/**
 * Lending Types - Frontend type definitions for lending functionality
 * These types mirror the backend lending.types.ts for consistency
 * Note: Only Arbitrum mainnet is supported for lending
 */

import { SupportedChain } from './swap';

// Re-export SupportedChain for convenience
export { SupportedChain };

// Supported Lending Providers
export enum LendingProvider {
    AAVE = 'AAVE',
    COMPOUND = 'COMPOUND',
}

// Lending Operation Types
export enum LendingOperation {
    SUPPLY = 'SUPPLY',           // Deposit/Supply assets
    WITHDRAW = 'WITHDRAW',       // Withdraw supplied assets
    BORROW = 'BORROW',          // Borrow assets
    REPAY = 'REPAY',            // Repay borrowed assets
    ENABLE_COLLATERAL = 'ENABLE_COLLATERAL',  // Enable asset as collateral
    DISABLE_COLLATERAL = 'DISABLE_COLLATERAL', // Disable asset as collateral
}

// Interest Rate Mode
export enum InterestRateMode {
    STABLE = 'STABLE',     // Stable interest rate (if available)
    VARIABLE = 'VARIABLE', // Variable interest rate
}

// Token Information for Lending
export interface LendingTokenInfo {
    address: string;
    symbol?: string;
    decimals?: number;
    name?: string;
}

// Lending Input Configuration
export interface LendingInputConfig {
    // Mandatory fields
    operation: LendingOperation;
    asset: LendingTokenInfo;
    amount: string; // Wei/smallest unit as string to handle big numbers
    walletAddress: string; // The wallet that will perform the operation

    // Operation-specific fields
    interestRateMode?: InterestRateMode; // For BORROW operations (default: VARIABLE)
    onBehalfOf?: string; // Optional: perform operation on behalf of another address

    // Gas preferences (optional)
    maxPriorityFeePerGas?: string;
    maxFeePerGas?: string;
    gasLimit?: string;

    // Advanced options
    simulateFirst?: boolean; // Default: true - simulate before executing
    referralCode?: number; // Aave referral code (default: 0)
}

// Lending Position Information
export interface LendingPosition {
    asset: LendingTokenInfo;
    supplied: string; // Amount supplied
    borrowed: string; // Amount borrowed
    availableToBorrow: string;
    availableToWithdraw: string;
    supplyAPY: string; // Annual percentage yield for supply
    borrowAPY: string; // Annual percentage yield for borrow
    isCollateral: boolean;
    healthFactor?: string; // Overall account health (<1.0 means liquidation risk)
    ltv?: string; // Loan-to-value ratio
    liquidationThreshold?: string;
}

// Lending Quote Response
export interface LendingQuote {
    provider: LendingProvider;
    chain: SupportedChain;
    operation: LendingOperation;
    asset: LendingTokenInfo;
    amount: string;

    // Rate information
    supplyAPY?: string;
    borrowAPY?: string;
    availableLiquidity?: string;

    // Position information (if querying existing position)
    currentPosition?: LendingPosition;

    // Transaction estimates
    gasEstimate: string;
    estimatedGasCost: string; // In native token

    // Health factor impact (for borrow/withdraw operations)
    currentHealthFactor?: string;
    newHealthFactor?: string;

    validUntil?: number; // Unix timestamp
    rawQuote?: unknown; // Provider-specific quote data
}

// Asset Reserve Data
export interface AssetReserveData {
    asset: string;
    symbol: string;
    decimals: number;
    supplyAPY: string;
    variableBorrowAPY: string;
    stableBorrowAPY?: string;
    availableLiquidity: string;
    totalSupplied: string;
    totalBorrowed: string;
    utilizationRate: string;
    ltv: string;
    liquidationThreshold: string;
    liquidationBonus: string;
    isActive: boolean;
    isFrozen: boolean;
    canBorrow: boolean;
    canSupply: boolean;
    canBeCollateral: boolean;
}

// Lending Account Data
export interface LendingAccountData {
    totalCollateralBase: string;
    totalDebtBase: string;
    availableBorrowsBase: string;
    currentLiquidationThreshold: string;
    ltv: string;
    healthFactor: string;
}

// ============================================
// TOKEN LISTS FOR LENDING (ARBITRUM MAINNET ONLY)
// ============================================

/**
 * Common tokens supported in Aave V3 on Arbitrum
 */
export const AAVE_ARBITRUM_TOKENS: LendingTokenInfo[] = [
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
    {
        address: '0x5979D7b546E38E414F7E9822514be443A4800529',
        symbol: 'wstETH',
        decimals: 18,
        name: 'Wrapped stETH',
    },
];

/**
 * Common tokens supported in Compound V3 on Arbitrum
 * Compound V3 uses USDC as the base asset
 */
export const COMPOUND_ARBITRUM_TOKENS: LendingTokenInfo[] = [
    {
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin (Base Asset)',
    },
    {
        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        symbol: 'WETH',
        decimals: 18,
        name: 'Wrapped Ether (Collateral)',
    },
    {
        address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
        symbol: 'WBTC',
        decimals: 8,
        name: 'Wrapped BTC (Collateral)',
    },
    {
        address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
        symbol: 'ARB',
        decimals: 18,
        name: 'Arbitrum (Collateral)',
    },
];



/**
 * Get tokens for a specific lending provider and chain
 * @param provider - The lending provider
 * @param chain - The supported chain
 * @returns Array of LendingTokenInfo
 */
export function getLendingTokensForChain(provider: LendingProvider, chain: SupportedChain): LendingTokenInfo[] {
    // Default to Arbitrum
    switch (provider) {
        case LendingProvider.AAVE:
            return AAVE_ARBITRUM_TOKENS;
        case LendingProvider.COMPOUND:
            return COMPOUND_ARBITRUM_TOKENS;
        default:
            return AAVE_ARBITRUM_TOKENS;
    }
}

/**
 * Get tokens for a specific lending provider (Deprecated: use getLendingTokensForChain)
 * @param provider - The lending provider to get tokens for
 * @returns Array of LendingTokenInfo for the specified provider
 */
export function getTokensForLendingProvider(provider: LendingProvider): LendingTokenInfo[] {
    return getLendingTokensForChain(provider, SupportedChain.ARBITRUM);
}

// Display labels for enums
export const LENDING_PROVIDER_LABELS: Record<LendingProvider, string> = {
    [LendingProvider.AAVE]: 'Aave V3',
    [LendingProvider.COMPOUND]: 'Compound V3',
};

export const LENDING_OPERATION_LABELS: Record<LendingOperation, string> = {
    [LendingOperation.SUPPLY]: 'Supply',
    [LendingOperation.WITHDRAW]: 'Withdraw',
    [LendingOperation.BORROW]: 'Borrow',
    [LendingOperation.REPAY]: 'Repay',
    [LendingOperation.ENABLE_COLLATERAL]: 'Enable as Collateral',
    [LendingOperation.DISABLE_COLLATERAL]: 'Disable as Collateral',
};

export const INTEREST_RATE_MODE_LABELS: Record<InterestRateMode, string> = {
    [InterestRateMode.STABLE]: 'Stable Rate',
    [InterestRateMode.VARIABLE]: 'Variable Rate',
};

// Default lending configuration
export const DEFAULT_LENDING_CONFIG = {
    provider: LendingProvider.AAVE,
    chain: SupportedChain.ARBITRUM,
    operation: LendingOperation.SUPPLY,
    simulateFirst: true,
    interestRateMode: InterestRateMode.VARIABLE,
};
