import { useState, useRef } from "react";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { ethers } from "ethers";
import { getContractAddress } from "@/web3/config/contract-registry";
import { getChain } from "@/web3/config/chain-registry";
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
      if (!getChain(effectiveChainId)) {
        return {
          success: false,
          safeAddress: null,
          error: `Unsupported network (ID: ${effectiveChainId}). Please select a supported blockchain.`,
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
              error: `Wallet chain mismatch. Expected ${getChain(chainId)?.name ?? `Chain ${chainId}`} but wallet is on chain ${actualChainIdNum}. Please switch networks.`,
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

        if (response.status === 409) {
          return {
            success: false,
            safeAddress: null,
            error: "Safe creation is already in progress on this chain. Please wait a minute and refresh.",
          };
        }

        if (response.status === 429) {
          return {
            success: false,
            safeAddress: null,
            error: "You have reached the limit of Safe creations for today. Please try again tomorrow.",
          };
        }

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
      if (!getChain(effectiveChainId)) {
        return {
          success: false,
          error: `Unsupported network (ID: ${effectiveChainId}). Please select a supported blockchain.`,
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

      // Dual validation: check reactive state first, but verify with provider if it fails
      // This handles cases where state updates lag behind the actual network switch
      if (chainId !== effectiveChainId) {
        try {
          const actualChainIdHex = await provider.request({ method: "eth_chainId" });
          const actualChainId = parseInt(actualChainIdHex as string, 16);

          if (actualChainId !== effectiveChainId) {
            return {
              success: false,
              error: `Wallet must be on chain ${effectiveChainId} to sign. Current wallet chain: ${actualChainId}. Please switch networks first.`,
            };
          }
        } catch (err) {
          return {
            success: false,
            error: `Failed to verify wallet chain: ${err instanceof Error ? err.message : String(err)}`,
          };
        }
      }

      const ethersProvider = new ethers.BrowserProvider(provider);

      const moduleAddress = getContractAddress(effectiveChainId, "safeModule");
      if (!moduleAddress) {
        return {
          success: false,
          error: `Safe Module address not configured for ${getChain(effectiveChainId)?.name ?? `Chain ${effectiveChainId}`}. Please check your environment variables.`,
        };
      }

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
      // Verify current chain directly from provider to handle state lag
      if (wallet) {
        try {
          const p = await wallet.getEthereumProvider();
          const actualHex = await p.request({ method: "eth_chainId" });
          const actualNum = parseInt(actualHex as string, 16);

          if (actualNum !== txChainId) {
            return {
              success: false,
              error: `Chain mismatch: Wallet is on chain ${actualNum} but transaction was signed for chain ${txChainId}. Please switch back.`,
            };
          }
        } catch {
          // If we can't verify but have a reactive mismatch, still fail
          if (chainId && chainId !== txChainId) {
            return {
              success: false,
              error: `Could not verify chain and state mismatch: Expected ${txChainId}, found ${chainId}.`,
            };
          }
        }
      }

      // Validate chain ID
      if (!getChain(txChainId)) {
        return {
          success: false,
          error: `Unsupported network (ID: ${txChainId}). Please select a supported blockchain.`,
        };
      }

      const moduleAddress = getContractAddress(txChainId, "safeModule");
      if (!moduleAddress) {
        return {
          success: false,
          error: `Safe Module address not configured for ${getChain(txChainId)?.name ?? `Chain ${txChainId}`}. Please check your environment variables.`,
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
            chainId: txChainId,
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
