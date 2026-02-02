import type { BlockDefinition } from "../../types";
import {
    SwapProvider,
    SupportedChain,
    SwapType,
} from "@/types/swap";

/**
 * Relay Swap Block Definition
 * Allows users to perform cross-chain swaps via Relay
 */
export const relayBlock: BlockDefinition = {
    id: "relay",
    label: "Relay",
    iconName: "RelayLogo",
    description: "Cross-chain swaps via Relay",
    category: "defi",
    nodeType: "relay",
    backendType: "SWAP",
    sharedConfigComponent: "swap",
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

export default relayBlock;
