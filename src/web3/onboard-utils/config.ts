/**
 * Onboarding Configuration Module
 * Fetches backend runtime config and provides chains for Safe onboarding
 */

import { API_CONFIG, buildApiUrl } from "@/config/api";
import type { ChainDefinition } from "@/web3/chains";
import { getSelectableChains } from "@/web3/chains";

/**
 * Runtime configuration from backend
 */
export interface BackendRuntimeConfig {
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

/**
 * Fetch backend runtime configuration
 */
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

/**
 * Get chains to onboard
 */
export function getOnboardingChains(): ChainDefinition[] {
  return getSelectableChains();
}

/**
 * Fetch backend config and return onboarding chains
 */
export async function validateAndGetOnboardingChains(): Promise<{
  chains: ChainDefinition[];
  backendConfig: BackendRuntimeConfig;
}> {
  const backendConfig = await fetchBackendRuntimeConfig();
  const chains = getOnboardingChains();

  return { chains, backendConfig };
}
