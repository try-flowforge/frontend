/**
 * Swap Types - Frontend type definitions for swap functionality
 * These types mirror the backend swap.types.ts for consistency
 *
 * Chain-related data has been moved to:
 *   - config/chain-registry.ts (chain metadata, labels, contracts)
 *   - config/token-registry.ts (token lists per chain)
 */

// ─── Re-export chain-related items from centralized registries ───────
// These re-exports maintain backward compatibility for existing imports.
export { getSwapTokensForChain as getTokensForChain } from "@/web3/config/token-registry";

// Supported Swap Providers
export enum SwapProvider {
    UNISWAP = 'UNISWAP',
    UNISWAP_V4 = 'UNISWAP_V4',
    RELAY = 'RELAY',
    ONEINCH = 'ONEINCH',
    LIFI = 'LIFI',
}

// Swap Type (exact in vs exact out)
export enum SwapType {
    EXACT_INPUT = 'EXACT_INPUT',
    EXACT_OUTPUT = 'EXACT_OUTPUT',
}

// Token Information
export interface TokenInfo {
    address: string;
    symbol?: string;
    decimals?: number;
    name?: string;
}

// Swap Input Configuration
export interface SwapInputConfig {
    // Mandatory fields
    sourceToken: TokenInfo;
    destinationToken: TokenInfo;
    amount: string; // Wei/smallest unit as string to handle big numbers
    swapType: SwapType;
    walletAddress: string; // The wallet that will perform the swap

    // Optional: destination chain for cross-chain (e.g. LiFi)
    toChain?: string;

    // Optional fields with defaults
    slippageTolerance?: number; // Default: 0.5 (0.5%) - backend uses default if not provided
    deadline?: number; // Unix timestamp, default: 20 minutes from now

    // Gas preferences (optional - backend handles automatically if not provided)
    maxPriorityFeePerGas?: string;
    maxFeePerGas?: string;
    gasLimit?: string;

    // Advanced options
    recipient?: string; // If different from walletAddress
    enablePartialFill?: boolean; // For 1inch provider
    simulateFirst?: boolean; // Default: true - simulate before executing
}

// Swap Node Configuration (matches backend SwapNodeConfig)
export interface SwapNodeConfig {
    provider: SwapProvider;
    chain: string;
    inputConfig: SwapInputConfig;

    // Optional: destination chain for cross-chain (e.g. LiFi)
    toChain?: string;

    // Execution preferences
    simulateFirst?: boolean; // Default: true
    autoRetryOnFailure?: boolean; // Default: true
    maxRetries?: number; // Default: 3
}

// Swap Quote Response
export interface SwapQuote {
    provider: SwapProvider;
    chain: string;
    sourceToken: TokenInfo;
    destinationToken: TokenInfo;
    amountIn: string;
    amountOut: string;
    estimatedAmountOut: string; // With slippage
    route?: string[]; // Token addresses in route
    priceImpact: string; // Percentage
    gasEstimate: string;
    estimatedGasCost: string; // In native token
    validUntil?: number; // Unix timestamp
}

/**
 * Special constant for custom token selection
 */
export const CUSTOM_TOKEN_OPTION = '__CUSTOM_TOKEN__';

/**
 * Check if custom token input is allowed for a chain
 * Mainnet allows custom tokens, testnet doesn't (limited liquidity)
 */
//eslint-disable-next-line @typescript-eslint/no-unused-vars
export function allowsCustomTokens(_chain: string): boolean {
    return true; // Enable custom tokens for all chains as per user request
}

// Display labels for enums
export const PROVIDER_LABELS: Record<SwapProvider, string> = {
    [SwapProvider.UNISWAP]: 'Uniswap',
    [SwapProvider.UNISWAP_V4]: 'Uniswap V4',
    [SwapProvider.RELAY]: 'Relay',
    [SwapProvider.ONEINCH]: '1inch',
    [SwapProvider.LIFI]: 'LI.FI',
};

export const SWAP_TYPE_LABELS: Record<SwapType, string> = {
    [SwapType.EXACT_INPUT]: 'Exact Input (Sell exact amount)',
    [SwapType.EXACT_OUTPUT]: 'Exact Output (Buy exact amount)',
};

// Slippage presets
export const SLIPPAGE_PRESETS = [0.1, 0.5, 1.0, 2.5];
