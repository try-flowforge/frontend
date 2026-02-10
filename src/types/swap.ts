/**
 * Swap Types - Frontend type definitions for swap functionality
 * These types mirror the backend swap.types.ts for consistency
 */

// Supported Chains
export enum SupportedChain {
    ARBITRUM = 'ARBITRUM',
    ARBITRUM_SEPOLIA = 'ARBITRUM_SEPOLIA',
    BASE = 'BASE',
}

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
    toChain?: SupportedChain;

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
    chain: SupportedChain;
    inputConfig: SwapInputConfig;

    // Optional: destination chain for cross-chain (e.g. LiFi)
    toChain?: SupportedChain;

    // Execution preferences
    simulateFirst?: boolean; // Default: true
    autoRetryOnFailure?: boolean; // Default: true
    maxRetries?: number; // Default: 3
}

// Swap Quote Response
export interface SwapQuote {
    provider: SwapProvider;
    chain: SupportedChain;
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

// ============================================
// TOKEN LISTS BY CHAIN
// ============================================

/**
 * Arbitrum Mainnet Tokens
 * Common tokens with verified Uniswap V3 liquidity
 */
export const ARBITRUM_MAINNET_TOKENS: TokenInfo[] = [
    {
        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        symbol: 'WETH',
        decimals: 18,
        name: 'Wrapped Ether',
    },
    {
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
    },
    {
        address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        symbol: 'USDT',
        decimals: 6,
        name: 'Tether USD',
    },
    {
        address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
        symbol: 'WBTC',
        decimals: 8,
        name: 'Wrapped BTC',
    },
    {
        address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        symbol: 'DAI',
        decimals: 18,
        name: 'Dai Stablecoin',
    },
    {
        address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
        symbol: 'ARB',
        decimals: 18,
        name: 'Arbitrum',
    },
];



/**
 * Arbitrum Sepolia Testnet Tokens
 * Tokens with verified Uniswap V3 pools on Sepolia testnet
 * These are official testnet token addresses
 */
export const ARBITRUM_SEPOLIA_TOKENS: TokenInfo[] = [
    {
        address: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
        symbol: 'WETH',
        decimals: 18,
        name: 'Wrapped Ether',
    },
    {
        address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
    },
    {
        address: '0xb1D4538B4571d411F07960EF2838Ce337FE1E80E',
        symbol: 'LINK',
        decimals: 18,
        name: 'Chainlink Token',
    }
];

/**
 * Base Mainnet Tokens (for LiFi cross-chain)
 */
export const BASE_MAINNET_TOKENS: TokenInfo[] = [
    {
        address: '0x4200000000000000000000000000000000000006',
        symbol: 'WETH',
        decimals: 18,
        name: 'Wrapped Ether',
    },
    {
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
    },
    {
        address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
        symbol: 'DAI',
        decimals: 18,
        name: 'Dai Stablecoin',
    },
    {
        address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
        symbol: 'USDbC',
        decimals: 6,
        name: 'USD Base Coin',
    },
];

/**
 * Legacy export for backward compatibility
 * @deprecated Use getTokensForChain() instead
 */
export const ARBITRUM_TOKENS = ARBITRUM_MAINNET_TOKENS;

/**
 * Special constant for custom token selection (mainnet only)
 */
export const CUSTOM_TOKEN_OPTION = '__CUSTOM_TOKEN__';

/**
 * Get tokens for a specific chain
 * @param chain - The chain to get tokens for
 * @returns Array of TokenInfo for the specified chain
 */
export function getTokensForChain(chain: SupportedChain): TokenInfo[] {
    switch (chain) {
        case SupportedChain.ARBITRUM:
            return ARBITRUM_MAINNET_TOKENS;
        case SupportedChain.ARBITRUM_SEPOLIA:
            return ARBITRUM_SEPOLIA_TOKENS;

        case SupportedChain.BASE:
            return BASE_MAINNET_TOKENS;
        default:
            return ARBITRUM_MAINNET_TOKENS;
    }
}

/**
 * Check if custom token input is allowed for a chain
 * Mainnet allows custom tokens, testnet doesn't (limited liquidity)
 */
//eslint-disable-next-line @typescript-eslint/no-unused-vars
export function allowsCustomTokens(_chain: SupportedChain): boolean {
    return true; // Enable custom tokens for all chains as per user request
}

// Display labels for enums
export const CHAIN_LABELS: Record<SupportedChain, string> = {
    [SupportedChain.ARBITRUM]: 'Arbitrum',
    [SupportedChain.ARBITRUM_SEPOLIA]: 'Arbitrum Sepolia',
    [SupportedChain.BASE]: 'Base',
};

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

// Default swap configuration (default chain: Arbitrum Sepolia)
export const DEFAULT_SWAP_CONFIG: Partial<SwapNodeConfig> = {
    provider: SwapProvider.UNISWAP,
    chain: SupportedChain.ARBITRUM_SEPOLIA,
    simulateFirst: true,
    autoRetryOnFailure: true,
    maxRetries: 3,
    inputConfig: {
        sourceToken: ARBITRUM_SEPOLIA_TOKENS[1], // USDC
        destinationToken: ARBITRUM_SEPOLIA_TOKENS[0], // WETH
        amount: '',
        swapType: SwapType.EXACT_INPUT,
        walletAddress: '',
        slippageTolerance: 0.5,
    },
};
