/**
 * Centralized blockchain chain configuration and helpers.
 * All chain-specific values should live here to keep them in sync.
 */

import { arbitrum, arbitrumSepolia } from "viem/chains";

export const CHAIN_IDS = {
  ARBITRUM_SEPOLIA: 421614,
  ARBITRUM_MAINNET: 42161,
} as const;

export type SupportedChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS];

export type ChainDefinition = {
  readonly id: SupportedChainId;
  readonly key: "testnet" | "mainnet";
  readonly name: string;
  readonly explorerUrl: string;
  readonly isTestnet: boolean;
  readonly safeWalletFactoryAddress: string;
  readonly safeModuleAddress: string;
};

export const USE_TESTNET_ONLY =
  process.env.NEXT_PUBLIC_USE_TESTNET_ONLY !== "false";

// Chain definitions with readonly properties
const chainDefinitions: Readonly<Record<SupportedChainId, ChainDefinition>> = {
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    id: CHAIN_IDS.ARBITRUM_SEPOLIA,
    key: "testnet",
    name: "Arbitrum Sepolia",
    explorerUrl: "https://sepolia.arbiscan.io",
    isTestnet: true,
    safeWalletFactoryAddress:
      process.env.NEXT_PUBLIC_SAFE_WALLET_FACTORY_ADDRESS!,
    safeModuleAddress: process.env.NEXT_PUBLIC_SAFE_MODULE_ADDRESS!,
  },
  [CHAIN_IDS.ARBITRUM_MAINNET]: {
    id: CHAIN_IDS.ARBITRUM_MAINNET,
    key: "mainnet",
    name: "Arbitrum Mainnet",
    explorerUrl: "https://arbiscan.io",
    isTestnet: false,
    safeWalletFactoryAddress:
      process.env.NEXT_PUBLIC_MAINNET_SAFE_WALLET_FACTORY_ADDRESS!,
    safeModuleAddress: process.env.NEXT_PUBLIC_MAINNET_SAFE_MODULE_ADDRESS!,
  },
};

// Pre-computed arrays (allocated once at module load)
const ALL_CHAINS: ChainDefinition[] = [
  chainDefinitions[CHAIN_IDS.ARBITRUM_SEPOLIA],
  chainDefinitions[CHAIN_IDS.ARBITRUM_MAINNET],
];

const TESTNET_ONLY_CHAINS: ChainDefinition[] = [
  chainDefinitions[CHAIN_IDS.ARBITRUM_SEPOLIA],
];

const PRIVY_CHAINS_ALL = [arbitrumSepolia, arbitrum];
const PRIVY_CHAINS_TESTNET = [arbitrumSepolia];

// Re-export viem chains
export { arbitrum, arbitrumSepolia };
export const VIEM_CHAINS = PRIVY_CHAINS_ALL;

/**
 * Type guard for supported chain IDs
 */
export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return (
    chainId === CHAIN_IDS.ARBITRUM_SEPOLIA ||
    chainId === CHAIN_IDS.ARBITRUM_MAINNET
  );
}

/**
 * Get chain name, with fallback for unknown chains
 */
export function getChainName(chainId: number): string {
  return (
    chainDefinitions[chainId as SupportedChainId]?.name ?? `Chain ${chainId}`
  );
}

/**
 * Get chains available for user selection (respects USE_TESTNET_ONLY)
 */
export function getSelectableChains(): ChainDefinition[] {
  return USE_TESTNET_ONLY ? TESTNET_ONLY_CHAINS : ALL_CHAINS;
}

/**
 * Check if chain ID is testnet
 */
export function isTestnet(chainId: number | null | undefined): boolean {
  return chainId === CHAIN_IDS.ARBITRUM_SEPOLIA;
}

/**
 * Check if chain ID is mainnet
 */
export function isMainnet(chainId: number | null | undefined): boolean {
  return chainId === CHAIN_IDS.ARBITRUM_MAINNET;
}

/**
 * Get target chain ID for network switching
 */
export function getTargetChainId(toTestnet: boolean): number {
  return toTestnet ? CHAIN_IDS.ARBITRUM_SEPOLIA : CHAIN_IDS.ARBITRUM_MAINNET;
}

/**
 * Get default chain for Privy (respects USE_TESTNET_ONLY)
 */
export function getDefaultChainForPrivy() {
  return USE_TESTNET_ONLY ? arbitrumSepolia : arbitrum;
}

/**
 * Get supported chains for Privy (returns pre-computed array)
 */
export function getSupportedChainsForPrivy() {
  return USE_TESTNET_ONLY ? PRIVY_CHAINS_TESTNET : PRIVY_CHAINS_ALL;
}

/**
 * Get Safe wallet factory address for a chain
 */
export function getSafeWalletFactoryAddress(chainId: number): string {
  const info = chainDefinitions[chainId as SupportedChainId];
  if (!info) {
    return "";
  }
  return info.safeWalletFactoryAddress;
}

/**
 * Get Safe module address for a chain
 */
export function getSafeModuleAddress(chainId: number): string {
  const info = chainDefinitions[chainId as SupportedChainId];
  if (!info) {
    return "";
  }
  return info.safeModuleAddress;
}
