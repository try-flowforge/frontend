/**
 * Centralized blockchain chain configuration and helpers.
 * All chain-specific values should live here to keep them in sync.
 * Safe addresses: per-chain env (e.g. NEXT_PUBLIC_SAFE_WALLET_FACTORY_ADDRESS_11155111)
 * falls back to single NEXT_PUBLIC_SAFE_WALLET_FACTORY_ADDRESS / NEXT_PUBLIC_SAFE_MODULE_ADDRESS.
 */

import { arbitrum, arbitrumSepolia, sepolia } from "viem/chains";

export const CHAIN_IDS = {
  ETHEREUM_SEPOLIA: 11155111,
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

function getSafeFactoryForChain(chainId: number): string {
  return (
    process.env[`NEXT_PUBLIC_SAFE_WALLET_FACTORY_ADDRESS_${chainId}`] ||
    process.env.NEXT_PUBLIC_SAFE_WALLET_FACTORY_ADDRESS ||
    ""
  );
}
function getSafeModuleForChain(chainId: number): string {
  return (
    process.env[`NEXT_PUBLIC_SAFE_MODULE_ADDRESS_${chainId}`] ||
    process.env.NEXT_PUBLIC_SAFE_MODULE_ADDRESS ||
    ""
  );
}

// Chain definitions with readonly properties
const chainDefinitions: Readonly<Record<SupportedChainId, ChainDefinition>> = {
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: {
    id: CHAIN_IDS.ETHEREUM_SEPOLIA,
    key: "testnet",
    name: "Ethereum Sepolia",
    explorerUrl: "https://sepolia.etherscan.io",
    isTestnet: true,
    safeWalletFactoryAddress: getSafeFactoryForChain(CHAIN_IDS.ETHEREUM_SEPOLIA),
    safeModuleAddress: getSafeModuleForChain(CHAIN_IDS.ETHEREUM_SEPOLIA),
  },
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    id: CHAIN_IDS.ARBITRUM_SEPOLIA,
    key: "testnet",
    name: "Arbitrum Sepolia",
    explorerUrl: "https://sepolia.arbiscan.io",
    isTestnet: true,
    safeWalletFactoryAddress: getSafeFactoryForChain(CHAIN_IDS.ARBITRUM_SEPOLIA),
    safeModuleAddress: getSafeModuleForChain(CHAIN_IDS.ARBITRUM_SEPOLIA),
  },
  [CHAIN_IDS.ARBITRUM_MAINNET]: {
    id: CHAIN_IDS.ARBITRUM_MAINNET,
    key: "mainnet",
    name: "Arbitrum Mainnet",
    explorerUrl: "https://arbiscan.io",
    isTestnet: false,
    safeWalletFactoryAddress: getSafeFactoryForChain(CHAIN_IDS.ARBITRUM_MAINNET),
    safeModuleAddress: getSafeModuleForChain(CHAIN_IDS.ARBITRUM_MAINNET),
  },
};

// Pre-computed arrays (allocated once at module load)
export const USE_TESTNET_ONLY = process.env.NEXT_PUBLIC_USE_TESTNET_ONLY === "true";

const ALL_CHAINS: ChainDefinition[] = [
  chainDefinitions[CHAIN_IDS.ARBITRUM_SEPOLIA],
  chainDefinitions[CHAIN_IDS.ETHEREUM_SEPOLIA],
  chainDefinitions[CHAIN_IDS.ARBITRUM_MAINNET],
].filter(chain => !USE_TESTNET_ONLY || chain.isTestnet);

const PRIVY_CHAINS_ALL = [arbitrumSepolia, sepolia, arbitrum].filter(chain => {
  if (!USE_TESTNET_ONLY) return true;
  return chain.id === CHAIN_IDS.ARBITRUM_SEPOLIA || chain.id === CHAIN_IDS.ETHEREUM_SEPOLIA;
});

// Re-export viem chains
export { arbitrum, arbitrumSepolia, sepolia };
export const VIEM_CHAINS = PRIVY_CHAINS_ALL;

/**
 * Type guard for supported chain IDs
 */
export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return (
    chainId === CHAIN_IDS.ETHEREUM_SEPOLIA ||
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
 * Get chains available for user selection (all three supported chains)
 */
export function getSelectableChains(): ChainDefinition[] {
  return ALL_CHAINS;
}

/**
 * Check if chain ID is testnet
 */
export function isTestnet(chainId: number | null | undefined): boolean {
  return chainId === CHAIN_IDS.ARBITRUM_SEPOLIA || chainId === CHAIN_IDS.ETHEREUM_SEPOLIA;
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
 * Get default chain for Privy. Always Arbitrum Sepolia so it is selected by default.
 */
export function getDefaultChainForPrivy() {
  return arbitrumSepolia;
}

/**
 * Get supported chains for Privy (all three: Arb Sepolia, ETH Sepolia, Arb Mainnet)
 */
export function getSupportedChainsForPrivy() {
  return PRIVY_CHAINS_ALL;
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
