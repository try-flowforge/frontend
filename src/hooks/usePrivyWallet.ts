"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useCallback, useEffect, useState } from "react";

// EIP-1193 provider type (minimal interface)
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    handler: (...args: unknown[]) => void,
  ) => void;
}

/**
 * Hook for interacting with the user's canonical Privy wallet.
 * Prefers the first external wallet (MetaMask, WalletConnect, etc.) if linked;
 * otherwise uses the embedded wallet. Used for Safe creation and all backend flows.
 */
export function usePrivyWallet() {
  const { authenticated, ready, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  // Only consider wallets that are *linked* to the Privy account.
  // useWallets() may include injected browser wallets (e.g. MetaMask extension)
  // that are detected but NOT linked (linked === false). The backend reads
  // user.linkedAccounts, so the frontend must use the same set for consistency.
  // Canonical wallet: prefer external (user chose "Connect existing") else embedded
  // We include privy wallets even if 'linked' is false momentarily during creation/login
  const linkedWallets = wallets.filter((w) => w.linked || w.walletClientType === "privy");
  const externalWallet = linkedWallets.find((w) => w.walletClientType !== "privy");
  const embeddedWallet = linkedWallets.find((w) => w.walletClientType === "privy");
  const wallet = externalWallet ?? embeddedWallet;

  // State for provider and chain
  const [chainId, setChainId] = useState<number | null>(null);
  const [ethereumProvider, setEthereumProvider] =
    useState<EthereumProvider | null>(null);

  // Initialize provider and chain info
  useEffect(() => {
    let isMounted = true;
    let cleanupListener: (() => void) | undefined;

    const initializeWallet = async () => {
      if (!wallet || !ready) {
        return;
      }

      try {
        const provider = await wallet.getEthereumProvider();
        if (!isMounted) return;

        setEthereumProvider(provider as EthereumProvider);

        if (provider) {
          const chainIdHex = await provider.request({ method: "eth_chainId" });
          if (isMounted) {
            const chainIdNum = parseInt(chainIdHex as string, 16);
            setChainId(chainIdNum);
          }

          // Set up chain change listener
          if (provider.on) {
            const handleChainChanged = (...args: unknown[]) => {
              const chainIdHex = args[0];
              if (isMounted) {
                const chainIdNum = parseInt(chainIdHex as string, 16);
                setChainId(chainIdNum);
              }
            };
            provider.on("chainChanged", handleChainChanged);

            cleanupListener = () => {
              if (provider.removeListener) {
                provider.removeListener("chainChanged", handleChainChanged);
              }
            };
          }
        } else if (isMounted) {
          setChainId(null);
        }
      } catch {
        if (isMounted) {
          setChainId(null);
          setEthereumProvider(null);
        }
      }
    };

    initializeWallet();

    return () => {
      isMounted = false;
      if (cleanupListener) {
        cleanupListener();
      }
      setChainId(null);
      setEthereumProvider(null);
    };
  }, [wallet, ready]);

  /**
   * Get Privy access token for API authentication
   */
  const getPrivyAccessToken = useCallback(async (): Promise<string | null> => {
    if (!authenticated || !ready) {
      return null;
    }

    try {
      const token = await getAccessToken();
      return token;
    } catch {
      return null;
    }
  }, [authenticated, ready, getAccessToken]);

  return {
    wallet,
    authenticated,
    ready,
    getPrivyAccessToken,
    ethereumProvider,
    chainId,
    walletAddress: wallet?.address || null,
  };
}
