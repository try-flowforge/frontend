import { useState, useEffect, useCallback } from "react";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { ethers } from "ethers";
import { getContractAddress } from "@/web3/config/contract-registry";
import TriggerXSafeFactoryArtifact from "../artifacts/SafeFactory.json";

export const useSafeWallets = () => {
  const { walletAddress, chainId, ethereumProvider } = usePrivyWallet();
  const [safeWallets, setSafeWallets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSafeWallets = useCallback(async () => {
    if (!walletAddress || !chainId || !ethereumProvider) {
      setSafeWallets([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const factoryAddress = getContractAddress(chainId, "safeWalletFactory");
      if (!factoryAddress) {
        throw new Error(
          "Safe Wallet Factory address not configured for this network",
        );
      }

      const provider = new ethers.BrowserProvider(ethereumProvider);
      const contract = new ethers.Contract(
        factoryAddress,
        TriggerXSafeFactoryArtifact.abi,
        provider,
      );

      const wallets = await contract.getSafeWallets(walletAddress);
      setSafeWallets(wallets);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch Safe wallets",
      );
      setSafeWallets([]);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, chainId, ethereumProvider]);

  useEffect(() => {
    fetchSafeWallets();
  }, [fetchSafeWallets]);

  return { safeWallets, isLoading, error, refetch: fetchSafeWallets };
};
