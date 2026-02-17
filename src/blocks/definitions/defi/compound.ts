import type { BlockDefinition } from "../../types";
import {
    LendingProvider,
    LendingOperation,
    InterestRateMode,
} from "@/types/lending";

/**
 * Compound Lending Block Definition
 * Allows users to supply, withdraw, borrow, and repay via Compound V3
 * Supports: Arbitrum only
 */
export const compoundBlock: BlockDefinition = {
    id: "compound",
    label: "Compound",
    iconName: "CompoundLogo",
    description: "Lending & borrowing via Compound V3",
    category: "defi",
    nodeType: "compound",
    backendType: "LENDING",
    sharedConfigComponent: "lending",
    supportedChains: ["ARBITRUM"],
    configComponentProps: {
        requiresAuth: true,
    },
    defaultData: {
        label: "Compound Lending",
        description: "Lend or borrow via Compound V3",
        status: "idle" as const,
        // Fixed provider for this block
        lendingProvider: LendingProvider.COMPOUND,
        lendingChain: "ARBITRUM",
        lendingOperation: LendingOperation.SUPPLY,
        // Asset configuration
        assetAddress: "",
        assetSymbol: "",
        assetDecimals: 6, // Default to USDC (Compound V3 base asset)
        // Amount
        lendingAmount: "",
        // Interest rate mode (Compound uses variable only)
        interestRateMode: InterestRateMode.VARIABLE,
        // Execution settings
        simulateFirst: true,
        // Wallet address (will be populated from connected wallet)
        walletAddress: "",
        // Quote data (populated after getting a quote)
        hasQuote: false,
        quoteSupplyAPY: "",
        quoteBorrowAPY: "",
        quoteGasEstimate: "",
        quoteHealthFactor: "",
        // Position data
        suppliedAmount: "",
        borrowedAmount: "",
        isCollateral: false,
        // Transaction tracking
        lastTxHash: "",
        lastExecutedAt: "",
    },
};

export default compoundBlock;
