import type { BlockDefinition } from "../../types";
import {
    SwapProvider,
    SwapType,
} from "@/types/swap";

/**
 * Relay Swap Block Definition
 * Allows users to perform cross-chain swaps via Relay
 * Supports: Arbitrum, Arbitrum Sepolia
 */
export const relayBlock: BlockDefinition = {
    id: "relay",
    label: "Relay",
    iconName: "RelayLogo",
    description: "Cross-chain swaps via Relay",
    category: "defi",
    hidden: true,
    nodeType: "relay",
    backendType: "SWAP",
    sharedConfigComponent: "swap",
    supportedChains: ["ARBITRUM", "ARBITRUM_SEPOLIA"],
    configComponentProps: {
        requiresAuth: true,
        requiresForcedProvider: false,
    },
    defaultData: {
        label: "Relay Swap",
        description: "Cross-chain swap via Relay",
        status: "idle" as const,
        // Fixed provider for this block
        swapProvider: SwapProvider.RELAY,
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

export default relayBlock;
