// Onboarding Configuration for Sync backend runtime config
import { API_CONFIG, buildApiUrl } from "@/config/api";
import { getAllChains, ChainInfo } from "@/web3/config/chain-registry";

// Runtime configuration from backend
interface BackendRuntimeConfig {
  activeChains: number[];
  chainDetails: Array<{
    chainId: number;
    name: string;
    factoryAddress: string;
    moduleAddress: string;
    rpcUrl: string;
  }>;
  timestamp: string;
}

// In-memory cache to avoid bombarding backend when multiple consumers fetch on sign-in
let runtimeConfigCache: { data: BackendRuntimeConfig; until: number } | null = null;
const RUNTIME_CONFIG_CACHE_MS = 30_000;

// Fetch backend runtime configuration (cached for a short period)
export async function fetchBackendRuntimeConfig(): Promise<BackendRuntimeConfig> {
  const now = Date.now();
  if (runtimeConfigCache && runtimeConfigCache.until > now) {
    return runtimeConfigCache.data;
  }
  const response = await fetch(
    buildApiUrl(API_CONFIG.ENDPOINTS.META.RUNTIME_CONFIG),
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch runtime config: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success || !data.data) {
    throw new Error("Invalid runtime config response");
  }

  const result = data.data as BackendRuntimeConfig;
  runtimeConfigCache = { data: result, until: now + RUNTIME_CONFIG_CACHE_MS };
  return result;
}

export function getOnboardingChains(): ChainInfo[] {
  return getAllChains().filter((c) => c.isTestnet);
}

// Fetch backend config and return onboarding chains
export async function validateAndGetOnboardingChains(): Promise<{
  chains: ChainInfo[];
  backendConfig: BackendRuntimeConfig;
}> {
  const backendConfig = await fetchBackendRuntimeConfig();
  const activeSet = new Set(backendConfig.activeChains ?? []);
  const chains = getAllChains().filter((c) => activeSet.has(c.chainId));

  return { chains, backendConfig };
}
