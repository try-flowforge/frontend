import type { BlockDefinition } from "../../types";
import {
    SwapProvider,
    SwapType,
} from "@/types/swap";

/**
 * LI.FI Swap Block Definition
 * Allows users to perform same-chain and cross-chain swaps via LI.FI
 * Supports: Arbitrum, Base (cross-chain between them)
 */
export const lifiBlock: BlockDefinition = {
    id: "lifi",
    label: "LI.FI",
    iconName: "LiFiLogo",
    description: "Cross-chain swaps via LI.FI aggregator",
    category: "defi",
    nodeType: "lifi",
    backendType: "SWAP",
    sharedConfigComponent: "swap",
    supportedChains: ["ARBITRUM"],
    configComponentProps: {
        requiresAuth: true,
        requiresForcedProvider: false,
    },
    defaultData: {
        label: "LI.FI Swap",
        description: "Cross-chain swap via LI.FI",
        status: "idle" as const,
        // Fixed provider for this block
        swapProvider: SwapProvider.LIFI,
        swapChain: "ARBITRUM",
        swapToChain: "ARBITRUM",
        swapType: SwapType.EXACT_INPUT,
        // Source token
        sourceTokenAddress: "",
        sourceTokenSymbol: "",
        sourceTokenDecimals: 18,
        // Destination token
        destinationTokenAddress: "",
        destinationTokenSymbol: "",
        destinationTokenDecimals: 18,
        // Amount and settings
        swapAmount: "",
        simulateFirst: true,
        autoRetryOnFailure: true,
        maxRetries: 3,
        // Wallet address (will be populated from connected wallet)
        walletAddress: "",
        // Quote data (populated after getting a quote)
        hasQuote: false,
        quoteAmountOut: "",
        quotePriceImpact: "",
        quoteGasEstimate: "",
    },
};

export default lifiBlock;
