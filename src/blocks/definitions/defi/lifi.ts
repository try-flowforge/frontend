import type { BlockDefinition } from "../../types";
import {
    SwapProvider,
    SupportedChain,
    SwapType,
} from "@/types/swap";

/**
 * LI.FI Swap Block Definition
 * Allows users to perform swaps via LI.FI DEX aggregator
 */
export const lifiBlock: BlockDefinition = {
    id: "lifi",
    label: "LI.FI",
    iconName: "LiFiLogo",
    description: "DEX aggregator for optimal swap routes",
    category: "defi",
    nodeType: "lifi",
    backendType: "SWAP",
    sharedConfigComponent: "swap",
    configComponentProps: {
        requiresAuth: true,
        requiresForcedProvider: true, // LiFi needs forcedProvider prop
    },
    defaultData: {
        label: "LI.FI Swap",
        description: "Swap via LI.FI aggregator",
        status: "idle" as const,
        // Fixed provider for this block
        swapProvider: SwapProvider.LIFI,
        swapChain: SupportedChain.ARBITRUM,
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
