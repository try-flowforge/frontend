import { useState, useCallback, useEffect, useRef } from "react";
import type { Eip1193Provider } from "ethers";
import { BrowserProvider } from "ethers";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { getContractAddress } from "@/web3/config/contract-registry";
import { getSafeModuleStatus } from "../utils/safe";

// Hook to get the status of the Safe module for a given safe address
export function useSafeModuleStatus(
  safeAddress?: string,
): [boolean | null, () => Promise<void>, boolean] {
  const { chainId, ethereumProvider } = usePrivyWallet();
  const [status, setStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!safeAddress || !chainId || !ethereumProvider) {
      setStatus(null);
      return;
    }
    setLoading(true);
    try {
      const moduleAddress = getContractAddress(chainId, "safeModule");
      if (!moduleAddress) {
        setStatus(null);
        return;
      }
      const provider = new BrowserProvider(ethereumProvider as Eip1193Provider);
      const stat = await getSafeModuleStatus(
        safeAddress,
        moduleAddress,
        provider,
      );
      if (mountedRef.current) {
        setStatus(stat);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [safeAddress, chainId, ethereumProvider]);

  // Reset status when address changes (but don't auto-fetch)
  useEffect(() => {
    mountedRef.current = true;

    if (!safeAddress) {
      setStatus(null);
      return;
    }

    // Status will be fetched manually when needed (on dialog close, dropdown select, etc.)
    setStatus(null);

    return () => {
      mountedRef.current = false;
    };
  }, [safeAddress, chainId]);

  return [status, refresh, loading];
}
