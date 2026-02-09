"use client";

import { useCallback, useState } from "react";
import { createPublicClient, createWalletClient, custom, http, parseAbi } from "viem";
import { namehash } from "viem/ens";
import { mainnet, sepolia } from "viem/chains";
import { api } from "@/lib/api-client";
import { buildApiUrl } from "@/config/api";
import { API_CONFIG } from "@/config/api";
import {
  ENS_PARENT_NAME,
  getEnsConfig,
  ENS_CHAIN_IDS,
  type EnsChainConfig,
} from "@/config/ens";

const REGISTRY_ABI = parseAbi([
  "function registerWithToken(bytes32 parentNode, string label, address newOwner, address resolver, uint64 duration, bytes[] records, address paymentToken) external payable",
  "function names(bytes32) view returns (address pricer, address beneficiary, bool active)",
]);
const PRICER_ABI = parseAbi([
  "function priceForToken(bytes32 parentNode, string label, uint256 duration, address paymentToken) view returns (uint256)",
  "function price(bytes32 parentNode, string label, uint256 duration) view returns (address token, uint256 priceAmount)",
  "function USDC() view returns (address)",
]);

export interface EnsSubdomainItem {
  id: string;
  ens_name: string;
  owner_address: string;
  expiry: string;
  chain_id: number;
  created_at: string;
  active: boolean;
}

export interface UseEnsSubdomainResult {
  subdomains: EnsSubdomainItem[];
  loading: boolean;
  error: string | null;
  listSubdomains: (accessToken: string) => Promise<void>;
  getPrice: (
    chainId: number,
    label: string,
    durationSeconds: number,
    paymentToken: "eth" | "usdc"
  ) => Promise<bigint>;
  registerSubdomain: (params: {
    chainId: number;
    label: string;
    durationSeconds: number;
    paymentToken: "eth" | "usdc";
    ownerAddress: string;
    accessToken: string;
    walletProvider: unknown;
  }) => Promise<{ success: boolean; error?: string; remaining_sponsored_txs?: number }>;
  configuredChains: EnsChainConfig[];
}

export function useEnsSubdomain(): UseEnsSubdomainResult {
  const [subdomains, setSubdomains] = useState<EnsSubdomainItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configuredChains = [
    getEnsConfig(ENS_CHAIN_IDS.ETHEREUM_SEPOLIA),
    getEnsConfig(ENS_CHAIN_IDS.ETHEREUM_MAINNET),
  ].filter((c): c is EnsChainConfig => c != null);

  const listSubdomains = useCallback(async (accessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: EnsSubdomainItem[] }>(
        API_CONFIG.ENDPOINTS.ENS.SUBDOMAINS,
        { accessToken }
      );
      if (res.ok && res.data?.data) {
        setSubdomains(res.data.data);
      } else {
        setSubdomains([]);
      }
    } catch {
      setSubdomains([]);
      setError("Failed to load subdomains");
    } finally {
      setLoading(false);
    }
  }, []);

  const getPrice = useCallback(
    async (
      chainId: number,
      label: string,
      durationSeconds: number,
      paymentToken: "eth" | "usdc"
    ): Promise<bigint> => {
      const cfg = getEnsConfig(chainId);
      if (!cfg) return BigInt(0);

      const transport = http();
      const chain = chainId === ENS_CHAIN_IDS.ETHEREUM_SEPOLIA ? sepolia : chainId === ENS_CHAIN_IDS.ETHEREUM_MAINNET ? mainnet : undefined;
      if (!chain) return BigInt(0);
      const client = createPublicClient({
        chain,
        transport,
      });

      const parentNode = namehash(ENS_PARENT_NAME);
      const tokenAddress =
        paymentToken === "usdc"
          ? await getUsdcAddressFromPricer(client, cfg.pricerAddress as `0x${string}`)
          : "0x0000000000000000000000000000000000000000";

      return client.readContract({
        address: cfg.pricerAddress as `0x${string}`,
        abi: PRICER_ABI,
        functionName: "priceForToken",
        args: [parentNode, label, BigInt(durationSeconds), tokenAddress as `0x${string}`],
      });
    },
    []
  );

  const registerSubdomain = useCallback(
    async (params: {
      chainId: number;
      label: string;
      durationSeconds: number;
      paymentToken: "eth" | "usdc";
      ownerAddress: string;
      accessToken: string;
      walletProvider: unknown;
    }): Promise<{
      success: boolean;
      error?: string;
      remaining_sponsored_txs?: number;
    }> => {
      const { chainId, label, durationSeconds, paymentToken, ownerAddress, accessToken, walletProvider } = params;
      const cfg = getEnsConfig(chainId);
      if (!cfg) {
        return { success: false, error: "ENS not configured for this chain" };
      }

      const chain = chainId === ENS_CHAIN_IDS.ETHEREUM_SEPOLIA ? sepolia : chainId === ENS_CHAIN_IDS.ETHEREUM_MAINNET ? mainnet : undefined;
      if (!chain) {
        return { success: false, error: "Unsupported ENS chain. Use Ethereum Sepolia or Mainnet." };
      }

      const transport = http(chain.rpcUrls?.default?.http?.[0]);
      const publicClient = createPublicClient({ chain, transport });
      const walletClient = createWalletClient({
        chain,
        transport: custom(walletProvider as import("viem").EIP1193Provider),
      });

      const registryAddress = cfg.registryAddress as `0x${string}`;
      const parentNode = namehash(ENS_PARENT_NAME);
      const tokenAddress =
        paymentToken === "usdc"
          ? await getUsdcAddressFromPricer(publicClient, cfg.pricerAddress as `0x${string}`)
          : "0x0000000000000000000000000000000000000000";

      const fee = await publicClient.readContract({
        address: cfg.pricerAddress as `0x${string}`,
        abi: PRICER_ABI,
        functionName: "priceForToken",
        args: [parentNode, label, BigInt(durationSeconds), tokenAddress as `0x${string}`],
      });

      const value = paymentToken === "eth" ? fee : BigInt(0);
      const [account] = await walletClient.getAddresses();
      if (!account) {
        return { success: false, error: "Wallet not connected" };
      }

      const hash = await walletClient.writeContract({
        address: registryAddress,
        abi: REGISTRY_ABI,
        functionName: "registerWithToken",
        args: [
          parentNode,
          label,
          ownerAddress as `0x${string}`,
          "0x0000000000000000000000000000000000000000" as `0x${string}`,
          BigInt(durationSeconds),
          [],
          tokenAddress as `0x${string}`,
        ],
        value,
        account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
      const expiryTimestamp = Number(block.timestamp) + durationSeconds;
      const expiry = new Date(expiryTimestamp * 1000).toISOString();
      const ensName = `${label}.${ENS_PARENT_NAME}`;

      const res = await api.post<{
        success: boolean;
        data?: { remaining_sponsored_txs: number };
        error?: string;
      }>(
        API_CONFIG.ENDPOINTS.ENS.SUBDOMAIN_REGISTERED,
        {
          ensName,
          ownerAddress: ownerAddress.toLowerCase(),
          expiry,
          durationSeconds,
          chainId,
        },
        { accessToken }
      );

      if (!res.ok || !res.data?.success) {
        return {
          success: false,
          error: (res.data as { error?: string })?.error ?? "Failed to register sponsorship",
        };
      }

      const data = res.data as { data?: { remaining_sponsored_txs: number } };
      return {
        success: true,
        remaining_sponsored_txs: data?.data?.remaining_sponsored_txs,
      };
    },
    []
  );

  return {
    subdomains,
    loading,
    error,
    listSubdomains,
    getPrice,
    registerSubdomain,
    configuredChains,
  };
}

/** Read USDC address from FlowForgeEthUsdcPricer.USDC() */
async function getUsdcAddressFromPricer(
  client: import("viem").PublicClient,
  pricerAddress: `0x${string}`
): Promise<`0x${string}`> {
  const usdc = await client.readContract({
    address: pricerAddress,
    abi: PRICER_ABI,
    functionName: "USDC",
  });
  return usdc as `0x${string}`;
}
