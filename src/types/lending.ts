/**
 * Lending Types - Frontend type definitions for lending functionality
 * These types mirror the backend lending.types.ts for consistency
 *
 * Chain-related data has been moved to:
 *   - config/chain-registry.ts (chain metadata, labels)
 *   - config/token-registry.ts (token lists per chain/provider)
 */

// Re-export chain labels and lending token helper from registries
import { getLendingTokens } from "@/web3/config/token-registry";
export { getLendingTokens };

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
    chain: string;
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

/**
 * Get tokens for a specific lending provider and chain.
 * Delegates to the centralized token registry.
 *
 * @param provider - The lending provider
 * @param chain - The chain ID (e.g. "ARBITRUM")
 * @returns Array of LendingTokenInfo
 */
export function getLendingTokensForChain(provider: LendingProvider, chain: string): LendingTokenInfo[] {
    return getLendingTokens(provider, chain);
}

/**
 * Get tokens for a specific lending provider (defaults to Arbitrum)
 * @deprecated Use getLendingTokensForChain() instead
 */
export function getTokensForLendingProvider(provider: LendingProvider): LendingTokenInfo[] {
    return getLendingTokensForChain(provider, "ARBITRUM");
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
    chain: "ARBITRUM",
    operation: LendingOperation.SUPPLY,
    simulateFirst: true,
    interestRateMode: InterestRateMode.VARIABLE,
};
