import type { BlockDefinition } from "../../types";
import {
    LendingProvider,
    LendingOperation,
    InterestRateMode,
} from "@/types/lending";

/**
 * Aave Lending Block Definition
 * Allows users to supply, withdraw, borrow, and repay via Aave V3
 * Supports: Arbitrum only
 */
export const aaveBlock: BlockDefinition = {
    id: "aave",
    label: "Aave",
    iconName: "AaveLogo",
    description: "Lending & borrowing via Aave V3",
    category: "defi",
    nodeType: "aave",
    backendType: "LENDING",
    sharedConfigComponent: "lending",
    supportedChains: ["ARBITRUM"],
    configComponentProps: {
        requiresAuth: true,
    },
    defaultData: {
        label: "Aave Lending",
        description: "Lend or borrow via Aave V3",
        status: "idle" as const,
        // Fixed provider for this block
        lendingProvider: LendingProvider.AAVE,
        lendingChain: "ARBITRUM",
        lendingOperation: LendingOperation.SUPPLY,
        // Asset configuration
        assetAddress: "",
        assetSymbol: "",
        assetDecimals: 18,
        // Amount
        lendingAmount: "",
        // Interest rate mode
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

export default aaveBlock;
