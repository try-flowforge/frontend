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

// Fetch backend runtime configuration
export async function fetchBackendRuntimeConfig(): Promise<BackendRuntimeConfig> {
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

  return data.data;
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
  const chains = getOnboardingChains();

  return { chains, backendConfig };
}
