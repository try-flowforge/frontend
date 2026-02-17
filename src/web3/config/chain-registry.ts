import { Chain, arbitrum, arbitrumSepolia } from "viem/chains";

// RPC constants
const ARBITRUM_RPC = process.env.ARBITRUM_RPC_URL!;
const ARBITRUM_SEPOLIA_RPC = process.env.ARBITRUM_SEPOLIA_RPC_URL!;

// Chain Registry Interface
interface RegistryEntry {
    id: string;
    viemChain: Chain;
    rpcUrl?: string;
}

// Chain Info Interface
export interface ChainInfo {
    id: string;
    chainId: number;
    name: string;
    isTestnet: boolean;
    explorerUrl: string;
    rpcUrl?: string;
    viemChain: Chain;
}

// Internal Chain Identifiers
export const Chains = {
    ARBITRUM: "ARBITRUM",
    ARBITRUM_SEPOLIA: "ARBITRUM_SEPOLIA"
} as const;

// Raw Chain Registry
const RAW_REGISTRY: RegistryEntry[] = [
    {
        id: Chains.ARBITRUM,
        viemChain: arbitrum,
        rpcUrl: ARBITRUM_RPC,
    },
    {
        id: Chains.ARBITRUM_SEPOLIA,
        viemChain: arbitrumSepolia,
        rpcUrl: ARBITRUM_SEPOLIA_RPC,
    }
];

// Internal Chain Registry
const CHAIN_REGISTRY: ChainInfo[] = RAW_REGISTRY.map((entry) => ({
    id: entry.id,
    viemChain: entry.viemChain,
    chainId: entry.viemChain.id,
    name: entry.viemChain.name,
    isTestnet: !!entry.viemChain.testnet,
    explorerUrl: entry.viemChain.blockExplorers?.default.url ?? "",
    rpcUrl: entry.rpcUrl ?? entry.viemChain.rpcUrls.default.http[0],
}));

// Type-safe union for internal chain identifiers
export type ChainId = keyof typeof Chains;

// Export all viem Chain objects for Privy
export const SUPPORTED_VIEM_CHAINS = CHAIN_REGISTRY.map((c) => c.viemChain);

// Export all supported ChainInfo objects
export const getAllChains = (): ChainInfo[] => [...CHAIN_REGISTRY];

// Get chain info by numeric chain id or string internal id
export function getChain(identifier: string | number | null | undefined): ChainInfo | undefined {
    if (identifier === null || identifier === undefined) return undefined;
    if (typeof identifier === "number") {
        return CHAIN_REGISTRY.find((c) => c.chainId === identifier);
    }
    const numericId = parseInt(identifier);
    if (!isNaN(numericId) && numericId.toString() === identifier) {
        return CHAIN_REGISTRY.find((c) => c.chainId === numericId);
    }
    return CHAIN_REGISTRY.find((c) => c.id === identifier);
}