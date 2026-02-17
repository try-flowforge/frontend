import type { BlockDefinition } from "../../types";
import {
    SwapProvider,
    SwapType,
} from "@/types/swap";

/**
 * Uniswap Swap Block Definition
 * Allows users to perform token swaps via Uniswap V4
 * Supports: Arbitrum, Arbitrum Sepolia
 */
export const uniswapBlock: BlockDefinition = {
    id: "uniswap",
    label: "Uniswap",
    iconName: "UniswapLogo",
    description: "Swap tokens via Uniswap V4",
    category: "defi",
    nodeType: "uniswap",
    backendType: "SWAP",
    sharedConfigComponent: "swap",
    supportedChains: ["ARBITRUM", "ARBITRUM_SEPOLIA"],
    configComponentProps: {
        requiresAuth: true,
        requiresForcedProvider: false,
    },
    defaultData: {
        label: "Uniswap Swap",
        description: "Swap tokens via Uniswap V4",
        status: "idle" as const,
        // Fixed provider for this block
        swapProvider: SwapProvider.UNISWAP_V4,
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

export default uniswapBlock;
