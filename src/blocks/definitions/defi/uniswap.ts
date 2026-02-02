import type { BlockDefinition } from "../../types";
import {
    SwapProvider,
    SupportedChain,
    SwapType,
} from "@/types/swap";

/**
 * Uniswap Swap Block Definition
 * Allows users to perform token swaps via Uniswap
 */
export const uniswapBlock: BlockDefinition = {
    id: "uniswap",
    label: "Uniswap",
    iconName: "UniswapLogo",
    description: "Swap tokens via Uniswap DEX",
    category: "defi",
    nodeType: "uniswap",
    backendType: "SWAP",
    sharedConfigComponent: "swap",
    configComponentProps: {
        requiresAuth: true,
        requiresForcedProvider: false,
    },
    defaultData: {
        label: "Uniswap Swap",
        description: "Swap tokens via Uniswap",
        status: "idle" as const,
        // Fixed provider for this block
        swapProvider: SwapProvider.UNISWAP,
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

export default uniswapBlock;
