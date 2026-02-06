/**
 * Onboarding Configuration Module
 * This module handles mode detection, backend handshake, and validation
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
 * Mode mismatch error with actionable details
 */
export class ModeMismatchError extends Error {
  constructor(
    public frontendMode: boolean,
    public backendMode: boolean,
  ) {
    super(
      `Configuration mismatch: Frontend NEXT_PUBLIC_USE_TESTNET_ONLY=${frontendMode}, Backend USE_TESTNET_ONLY=${backendMode}. ` +
        `Please ensure both frontend and backend environment variables match.`,
    );
    this.name = "ModeMismatchError";
  }
}

/**
 * Get frontend mode (from NEXT_PUBLIC_USE_TESTNET_ONLY)
 */
export function getFrontendMode(): boolean {
  return FRONTEND_USE_TESTNET_ONLY;
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
 * Assert that frontend and backend modes match, throw ModeMismatchError if not
 */
export function assertModeMatchOrThrow(
  backendConfig: BackendRuntimeConfig,
): void {
  const frontendMode = getFrontendMode();
  const backendMode = backendConfig.useTestnetOnly;

  if (frontendMode !== backendMode) {
    throw new ModeMismatchError(frontendMode, backendMode);
  }
}

/**
 * Get chains to onboard (after mode validation)
 */
export function getOnboardingChains(): ChainDefinition[] {
  return getSelectableChains();
}

/**
 * Validate backend runtime config and return onboarding chains
 * Throws ModeMismatchError if modes don't match
 */
export async function validateAndGetOnboardingChains(): Promise<{
  chains: ChainDefinition[];
  backendConfig: BackendRuntimeConfig;
}> {
  const backendConfig = await fetchBackendRuntimeConfig();
  assertModeMatchOrThrow(backendConfig);
  const chains = getOnboardingChains();

  return { chains, backendConfig };
}
