import type { BlockDefinition } from "../../types";
import {
    SwapProvider,
    SwapType,
} from "@/types/swap";

/**
 * 1inch Swap Block Definition
 * Allows users to perform token swaps via 1inch aggregator
 * Supports: Arbitrum only
 */
export const oneInchBlock: BlockDefinition = {
    id: "oneinch",
    label: "1inch",
    iconName: "OneInchLogo",
    description: "Swap tokens via 1inch aggregator",
    category: "defi",
    hidden: true,
    nodeType: "oneinch",
    backendType: "SWAP",
    sharedConfigComponent: "swap",
    supportedChains: ["ARBITRUM"],
    configComponentProps: {
        requiresAuth: true,
        requiresForcedProvider: false,
    },
    defaultData: {
        label: "1inch Swap",
        description: "Swap tokens via 1inch",
        status: "idle" as const,
        // Fixed provider for this block
        swapProvider: SwapProvider.ONEINCH,
        swapChain: "ARBITRUM",
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

export default oneInchBlock;
