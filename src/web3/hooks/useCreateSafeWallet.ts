import { useState, useRef, useEffect } from "react";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { ethers } from "ethers";
import {
  CHAIN_IDS,
  getChainName,
  getSafeModuleAddress,
  isSupportedChain,
} from "@/web3/chains";
import Safe from "@safe-global/protocol-kit";
import type { SafeTransaction } from "@safe-global/safe-core-sdk-types";
import type { CreateSafeResult, SignResult, SubmitResult } from "../types/safe";
import { readSafeInfo } from "../utils/safe";
import { API_CONFIG, buildApiUrl } from "@/config/api";

export const useCreateSafeWallet = () => {
  const { chainId, ethereumProvider, wallet, getPrivyAccessToken } =
    usePrivyWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [isSigningEnableModule, setIsSigningEnableModule] = useState(false);
  const [isExecutingEnableModule, setIsExecutingEnableModule] = useState(false);

  // Store signed transaction data for the two-step flow
  const signedTxRef = useRef<{
    safeSdk: Safe;
    signedSafeTx: SafeTransaction;
    safeTxHash: string;
    safeAddress: string;
    threshold: number;
    owners: string[];
    signerAddress: string;
    chainId: number; // Track which chain this tx is for
  } | null>(null);

  // Clear signed tx when chain changes to prevent cross-chain accidents
  useEffect(() => {
    if (
      chainId &&
      signedTxRef.current &&
      signedTxRef.current.chainId !== chainId
    ) {
      signedTxRef.current = null;
    }
  }, [chainId]);

  // Create Safe wallet: Backend uses authenticated Privy wallet address from the access token
  const createSafeWallet = async (
    _userAddress: string,
    targetChainId?: number,
  ): Promise<CreateSafeResult> => {
    setIsCreating(true);
    try {
      // Use targetChainId if provided, otherwise fall back to current chainId
      const effectiveChainId = targetChainId ?? chainId;

      // Check if chainId is available
      if (!effectiveChainId) {
        return {
          success: false,
          safeAddress: null,
          error: "Wallet not ready. Please wait for wallet to initialize.",
        };
      }

      // Validate chain ID
      if (!isSupportedChain(effectiveChainId)) {
        return {
          success: false,
          safeAddress: null,
          error: `Unsupported chain. Please switch to Ethereum Sepolia (${CHAIN_IDS.ETHEREUM_SEPOLIA}), Arbitrum Sepolia (${CHAIN_IDS.ARBITRUM_SEPOLIA}), or Arbitrum Mainnet (${CHAIN_IDS.ARBITRUM_MAINNET}). Current chain: ${effectiveChainId}`,
        };
      }

      // Verify wallet is actually connected to the claimed chain
      if (!targetChainId && wallet && chainId) {
        try {
          const provider = await wallet.getEthereumProvider();
          const actualChainId = await provider.request({
            method: "eth_chainId",
          });
          const actualChainIdNum = parseInt(actualChainId as string, 16);

          if (actualChainIdNum !== chainId) {
            return {
              success: false,
              safeAddress: null,
              error: `Wallet chain mismatch. Expected ${getChainName(chainId)} but wallet is on chain ${actualChainIdNum}. Please switch networks.`,
            };
          }
        } catch {
          // Failed to verify wallet chain
        }
      }

      // Get Privy access token
      const accessToken = await getPrivyAccessToken();
      if (!accessToken) {
        return {
          success: false,
          safeAddress: null,
          error: "Authentication required. Please log in with Privy.",
        };
      }

      // Call backend relay API
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.RELAY.CREATE_SAFE),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            chainId: effectiveChainId,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          safeAddress: null,
          error: errorData.error || `Server error: ${response.status}`,
        };
      }

      const data = await response.json();

      if (!data.success || !data.data?.safeAddress) {
        return {
          success: false,
          safeAddress: null,
          error: data.error || "Failed to create Safe wallet",
        };
      }

      return {
        success: true,
        safeAddress: data.data.safeAddress,
      };
    } catch (err) {
      const getShortErrorMessage = (error: Error): string => {
        const message = error.message.toLowerCase();

        if (message.includes("fetch") || message.includes("network")) {
          return "Network error. Please check your connection.";
        }
        if (message.includes("timeout")) {
          return "Request timeout. Please try again.";
        }

        // Fallback: take first sentence or 50 chars
        const msg = error.message.split(".")[0];
        return msg.length > 50 ? msg.substring(0, 50) + "..." : msg;
      };

      return {
        success: false,
        safeAddress: null,
        error:
          err instanceof Error
            ? getShortErrorMessage(err)
            : "Failed to create Safe wallet",
      };
    } finally {
      setIsCreating(false);
    }
  };

  // Sign enable module transaction (Step 2) : targetChainId parameter ensures we sign on the correct chain
  const signEnableModule = async (
    safeAddress: string,
    targetChainId?: number,
  ): Promise<SignResult> => {
    setIsSigningEnableModule(true);

    try {
      // Use targetChainId if provided, otherwise fall back to current chainId
      const effectiveChainId = targetChainId ?? chainId;

      // Check if chainId is available
      if (!effectiveChainId) {
        return {
          success: false,
          error: "Wallet not ready. Please wait for wallet to initialize.",
        };
      }

      // Validate chain ID
      if (!isSupportedChain(effectiveChainId)) {
        return {
          success: false,
          error: `Unsupported chain. Please switch to Ethereum Sepolia (${CHAIN_IDS.ETHEREUM_SEPOLIA}), Arbitrum Sepolia (${CHAIN_IDS.ARBITRUM_SEPOLIA}), or Arbitrum Mainnet (${CHAIN_IDS.ARBITRUM_MAINNET}). Current chain: ${effectiveChainId}`,
        };
      }

      // CRITICAL: Verify wallet is on the target chain before signing
      if (chainId !== effectiveChainId) {
        return {
          success: false,
          error: `Wallet must be on chain ${effectiveChainId} to sign. Current chain: ${chainId}. Please switch networks first.`,
        };
      }

      const moduleAddress = getSafeModuleAddress(effectiveChainId);
      if (!moduleAddress) {
        return {
          success: false,
          error: `Safe Module address not configured for ${getChainName(
            effectiveChainId,
          )}. Please check your environment variables.`,
        };
      }

      if (!wallet || !ethereumProvider) {
        return {
          success: false,
          error: "Privy wallet not available. Please log in.",
        };
      }

      // Get Privy EIP-1193 provider
      const provider = await wallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const signerAddress = await signer.getAddress();

      // Read Safe info with retry logic
      const { threshold, owners, isEnabled } = await readSafeInfo(
        safeAddress,
        moduleAddress,
        ethersProvider,
      );

      const normalizedOwners = owners.map((owner: string) =>
        owner.toLowerCase(),
      );

      if (!normalizedOwners.includes(signerAddress.toLowerCase())) {
        return {
          success: false,
          error: "Connected wallet is not an owner of this Safe",
        };
      }

      if (isEnabled) {
        // Module already enabled - this is actually a success state
        signedTxRef.current = null;
        return {
          success: true,
          data: {
            threshold,
            owners,
            safeTxHash: "", // No transaction needed
          },
        };
      }

      // Initialize Safe SDK with Privy provider
      const safeSdk = await Safe.init({
        provider: provider as unknown as ethers.Eip1193Provider,
        safeAddress,
      });

      // Create enable module transaction
      const safeTransaction = await safeSdk.createEnableModuleTx(moduleAddress);

      // Sign the transaction using Safe SDK (this triggers the EIP-712 signature)
      const signedSafeTx = await safeSdk.signTransaction(safeTransaction);
      const safeTxHash = await safeSdk.getTransactionHash(signedSafeTx);

      // Store signed transaction for submitEnableModule
      signedTxRef.current = {
        safeSdk,
        signedSafeTx,
        safeTxHash,
        safeAddress,
        threshold,
        owners,
        signerAddress,
        chainId: effectiveChainId,
      };

      return {
        success: true,
        data: {
          threshold,
          owners,
          safeTxHash,
        },
      };
    } catch (err) {
      signedTxRef.current = null;

      const getErrorMessage = (error: Error): string => {
        const message = error.message.toLowerCase();

        if (
          message.includes("user rejected") ||
          message.includes("user denied")
        ) {
          return "Signature rejected by user";
        }
        if (message.includes("network")) {
          return "Network error occurred";
        }

        // Fallback: take first sentence or 50 chars
        const msg = error.message.split(".")[0];
        return msg.length > 50 ? msg.substring(0, 50) + "..." : msg;
      };

      return {
        success: false,
        error:
          err instanceof Error
            ? getErrorMessage(err)
            : "Failed to sign transaction",
      };
    } finally {
      setIsSigningEnableModule(false);
    }
  };

  // Submit (execute) the signed enable module transaction
  const submitEnableModule = async (): Promise<SubmitResult> => {
    if (!signedTxRef.current) {
      return {
        success: false,
        error: "No signed transaction found. Please sign first.",
      };
    }

    const {
      signedSafeTx,
      threshold,
      owners,
      safeAddress,
      chainId: txChainId,
    } = signedTxRef.current;

    try {
      // Check if chainId is available
      if (!chainId) {
        return {
          success: false,
          error: "Wallet not ready. Please wait for wallet to initialize.",
        };
      }

      // CRITICAL: Verify we're still on the same chain as when we signed
      if (chainId !== txChainId) {
        return {
          success: false,
          error: `Chain mismatch: Transaction was signed on chain ${txChainId} but wallet is now on chain ${chainId}. Please switch back to chain ${txChainId}.`,
        };
      }

      // Validate chain ID
      if (!isSupportedChain(chainId)) {
        return {
          success: false,
          error: `Unsupported chain. Please switch to Ethereum Sepolia (${CHAIN_IDS.ETHEREUM_SEPOLIA}), Arbitrum Sepolia (${CHAIN_IDS.ARBITRUM_SEPOLIA}), or Arbitrum Mainnet (${CHAIN_IDS.ARBITRUM_MAINNET}). Current chain: ${chainId}`,
        };
      }

      const moduleAddress = getSafeModuleAddress(chainId);
      if (!moduleAddress) {
        return {
          success: false,
          error: `Safe Module address not configured for ${getChainName(
            chainId,
          )}. Please check your environment variables.`,
        };
      }

      setIsExecutingEnableModule(true);

      // Get Privy access token
      const accessToken = await getPrivyAccessToken();
      if (!accessToken) {
        return {
          success: false,
          error: "Authentication required. Please log in with Privy.",
        };
      }

      // Extract Safe transaction data
      const safeTxData = {
        to: signedSafeTx.data.to,
        value: signedSafeTx.data.value,
        data: signedSafeTx.data.data,
        operation: signedSafeTx.data.operation,
        safeTxGas: signedSafeTx.data.safeTxGas,
        baseGas: signedSafeTx.data.baseGas,
        gasPrice: signedSafeTx.data.gasPrice,
        gasToken: signedSafeTx.data.gasToken,
        refundReceiver: signedSafeTx.data.refundReceiver,
        nonce: signedSafeTx.data.nonce,
      };

      // Get encoded signatures
      const signatures = signedSafeTx.encodedSignatures();

      // Call backend relay API
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.RELAY.ENABLE_MODULE),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            chainId,
            safeAddress,
            safeTxData,
            signatures,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `Server error: ${response.status}`,
        };
      }

      const data = await response.json();

      if (!data.success || !data.data?.txHash) {
        return {
          success: false,
          error: data.error || "Failed to enable module",
        };
      }

      // Clear signed tx after execution
      signedTxRef.current = null;

      return {
        success: true,
        data: {
          status: "executed",
          threshold,
          owners,
          transactionHash: data.data.txHash,
        },
      };
    } catch (err) {
      const getErrorMessage = (error: Error): string => {
        const message = error.message.toLowerCase();

        if (message.includes("fetch") || message.includes("network")) {
          return "Network error. Please check your connection.";
        }
        if (message.includes("timeout")) {
          return "Request timeout. Please try again.";
        }

        // Fallback: take first sentence or 50 chars
        const msg = error.message.split(".")[0];
        return msg.length > 50 ? msg.substring(0, 50) + "..." : msg;
      };

      return {
        success: false,
        error:
          err instanceof Error
            ? getErrorMessage(err)
            : "Failed to submit transaction",
      };
    } finally {
      setIsExecutingEnableModule(false);
    }
  };

  return {
    createSafeWallet,
    signEnableModule,
    submitEnableModule,
    isCreating,
    isSigningEnableModule,
    isExecutingEnableModule,
  };
};
