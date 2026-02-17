import { ChainId, Chains, getChain } from "./chain-registry";

export interface ChainContracts {
    uniswapRouter: string;
    universalRouter: string;
    permit2: string;
    weth: string;
    safeWalletFactory?: string;
    safeModule?: string;
}

/**
 * CONTRACT REGISTRY
 * 
 * Stores contract addresses for each chain.
 * Keys are the Chain IDs (e.g. "ARBITRUM") from chain-registry.ts.
 */
export const CONTRACT_REGISTRY: Partial<Record<ChainId, ChainContracts>> = {
    [Chains.ARBITRUM]: {
        uniswapRouter: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
        universalRouter: "0xa51afafe0263b40edaef0df8781ea9aa03e381a3",
        permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
        weth: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        safeWalletFactory: process.env.NEXT_PUBLIC_SAFE_WALLET_FACTORY_ADDRESS_42161 || process.env.NEXT_PUBLIC_SAFE_WALLET_FACTORY_ADDRESS,
        safeModule: process.env.NEXT_PUBLIC_SAFE_MODULE_ADDRESS_42161 || process.env.NEXT_PUBLIC_SAFE_MODULE_ADDRESS,
    },
    [Chains.ARBITRUM_SEPOLIA]: {
        uniswapRouter: "0x101F443B4d1b059569D643917553c771E1b9663E",
        universalRouter: "0xefd1d4bd4cf1e86da286bb4cb1b8bced9c10ba47",
        permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
        weth: "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73",
        safeWalletFactory: process.env.NEXT_PUBLIC_SAFE_WALLET_FACTORY_ADDRESS_421614 || process.env.NEXT_PUBLIC_SAFE_WALLET_FACTORY_ADDRESS,
        safeModule: process.env.NEXT_PUBLIC_SAFE_MODULE_ADDRESS_421614 || process.env.NEXT_PUBLIC_SAFE_MODULE_ADDRESS,
    }
};

// Get a specific contract address for a chain.
export const getContractAddress = (
    identifier: string | number | null | undefined,
    contract: keyof ChainContracts,
): string | undefined => {
    const chainId = getChain(identifier)?.id as ChainId;
    return chainId ? CONTRACT_REGISTRY[chainId]?.[contract] : undefined;
};
