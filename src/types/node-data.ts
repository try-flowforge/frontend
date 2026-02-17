/**
 * Node Data Type Definitions
 * Properly typed interfaces for all node configurations
 */

import type { SwitchCaseData } from "@/blocks/definitions/control/switch";

// Base node data shared by all nodes
export interface BaseNodeData {
    label: string;
    description?: string;
    /** Icon name from iconRegistry - serializable */
    iconName?: string;
    status?: NodeStatus;
    blockId?: string;
}

export type NodeStatus = "idle" | "running" | "success" | "error";

// Slack Node Data
export interface SlackNodeData extends BaseNodeData {
    slackConnectionId?: string;
    slackConnectionType?: "webhook" | "oauth";
    slackConnectionName?: string;
    slackTeamName?: string;
    slackChannelId?: string;
    slackChannelName?: string;
    slackMessage?: string;
}

// Telegram Node Data
export interface TelegramNodeData extends BaseNodeData {
    telegramConnectionId?: string;
    telegramChatId?: string;
    telegramChatTitle?: string;
    telegramMessage?: string;
}

// Email Node Data
export interface EmailNodeData extends BaseNodeData {
    emailTo?: string;
    emailSubject?: string;
    emailBody?: string;
}

// If/Condition Node Data
export interface IfNodeData extends BaseNodeData {
    leftPath?: string;
    operator?: ConditionOperator;
    rightValue?: string;
}

export type ConditionOperator =
    | "equals"
    | "notEquals"
    | "contains"
    | "gt"
    | "lt"
    | "gte"
    | "lte"
    | "isEmpty"
    | "regex";

// Switch Node Data
export interface SwitchNodeData extends BaseNodeData {
    valuePath?: string;
    cases?: SwitchCaseData[];
}

// Wallet Node Data
export interface WalletNodeData extends BaseNodeData {
    walletAddress?: string;
    safeAddress?: string;
    moduleEnabled?: boolean;
}

// Start Node Data (type alias since it has no additional fields)
export type StartNodeData = BaseNodeData;

// AI Transform Node Data
export interface AiTransformNodeData extends BaseNodeData {
    llmProvider?: 'openai' | 'openrouter';
    llmModel?: string;
    userPromptTemplate?: string;
    outputSchema?: Record<string, unknown>;
    temperature?: number;
    maxOutputTokens?: number;
}

// Swap Node Data (for Uniswap, Relay, 1inch, LIFI blocks)
export interface SwapNodeData extends BaseNodeData {
    swapProvider?: "UNISWAP" | "UNISWAP_V4" | "RELAY" | "ONEINCH" | "LIFI";
    swapChain?: string;
    /** Destination chain for cross-chain swaps (LiFi). When set and different from swapChain, use cross-chain route. */
    swapToChain?: string;
    swapType?: "EXACT_INPUT" | "EXACT_OUTPUT";
    sourceTokenAddress?: string;
    sourceTokenSymbol?: string;
    sourceTokenDecimals?: number;
    destinationTokenAddress?: string;
    destinationTokenSymbol?: string;
    destinationTokenDecimals?: number;
    swapAmount?: string;
    walletAddress?: string;
    simulateFirst?: boolean;
    autoRetryOnFailure?: boolean;
    maxRetries?: number;
    hasQuote?: boolean;
    quoteAmountOut?: string;
    quotePriceImpact?: string;
    quoteGasEstimate?: string;
    lastTxHash?: string;
    lastExecutedAt?: string;
}

// Lending Node Data (for Aave, Compound blocks)
export interface LendingNodeData extends BaseNodeData {
    lendingProvider?: "AAVE" | "COMPOUND";
    lendingChain?: string;
    lendingOperation?: "SUPPLY" | "WITHDRAW" | "BORROW" | "REPAY" | "ENABLE_COLLATERAL" | "DISABLE_COLLATERAL";
    assetAddress?: string;
    assetSymbol?: string;
    assetDecimals?: number;
    lendingAmount?: string;
    interestRateMode?: "STABLE" | "VARIABLE";
    walletAddress?: string;
    simulateFirst?: boolean;
    hasQuote?: boolean;
    quoteSupplyAPY?: string;
    quoteBorrowAPY?: string;
    quoteGasEstimate?: string;
    quoteHealthFactor?: string;
    suppliedAmount?: string;
    borrowedAmount?: string;
    isCollateral?: boolean;
    lastTxHash?: string;
    lastExecutedAt?: string;
}

// Oracle Node Data (for Chainlink, Pyth blocks)
export interface OracleNodeData extends BaseNodeData {
    oracleProvider?: "CHAINLINK" | "PYTH";
    oracleChain?: string;

    // Chainlink specific
    aggregatorAddress?: string;

    // Pyth specific
    priceFeedId?: string;

    // Common fields
    selectedPriceFeed?: string; // Symbol like "ETH/USD"
    staleAfterSeconds?: number;
    outputMapping?: Record<string, string>;

    // Output data (populated after execution)
    priceData?: string;
    formattedPrice?: string;
    confidence?: string; // For Pyth
    timestamp?: string;
    decimals?: number;

    // Execution settings
    simulateFirst?: boolean;
    lastFetchedAt?: string;
}

// Discriminated union for all node types
export type WorkflowNodeData =
    | ({ nodeType: "slack" } & SlackNodeData)
    | ({ nodeType: "telegram" } & TelegramNodeData)
    | ({ nodeType: "mail" } & EmailNodeData)
    | ({ nodeType: "if" } & IfNodeData)
    | ({ nodeType: "switch" } & SwitchNodeData)
    | ({ nodeType: "wallet-node" } & WalletNodeData)
    | ({ nodeType: "start" } & StartNodeData)
    | ({ nodeType: "uniswap" } & SwapNodeData)
    | ({ nodeType: "relay" } & SwapNodeData)
    | ({ nodeType: "oneinch" } & SwapNodeData)
    | ({ nodeType: "aave" } & LendingNodeData)
    | ({ nodeType: "compound" } & LendingNodeData)
    | ({ nodeType: "chainlink" } & OracleNodeData)
    | ({ nodeType: "pyth" } & OracleNodeData)
    | ({ nodeType: "ai-transform" } & AiTransformNodeData)
    | ({ nodeType: "base" } & BaseNodeData);

// Type guard functions
export function isSlackNodeData(data: unknown): data is SlackNodeData {
    return (
        typeof data === "object" &&
        data !== null &&
        ("slackConnectionId" in data || "slackMessage" in data)
    );
}

export function isTelegramNodeData(data: unknown): data is TelegramNodeData {
    return (
        typeof data === "object" &&
        data !== null &&
        ("telegramConnectionId" in data || "telegramMessage" in data)
    );
}

export function isEmailNodeData(data: unknown): data is EmailNodeData {
    return (
        typeof data === "object" &&
        data !== null &&
        ("emailTo" in data || "emailSubject" in data || "emailBody" in data)
    );
}

export function isIfNodeData(data: unknown): data is IfNodeData {
    return (
        typeof data === "object" &&
        data !== null &&
        ("leftPath" in data || "operator" in data || "rightValue" in data)
    );
}

export function isSwitchNodeData(data: unknown): data is SwitchNodeData {
    return (
        typeof data === "object" &&
        data !== null &&
        ("valuePath" in data || "cases" in data)
    );
}

export function isSwapNodeData(data: unknown): data is SwapNodeData {
    return (
        typeof data === "object" &&
        data !== null &&
        ("swapProvider" in data || "sourceTokenAddress" in data || "swapAmount" in data)
    );
}

export function isLendingNodeData(data: unknown): data is LendingNodeData {
    return (
        typeof data === "object" &&
        data !== null &&
        ("lendingProvider" in data || "assetAddress" in data || "lendingAmount" in data)
    );
}

export function isOracleNodeData(data: unknown): data is OracleNodeData {
    return (
        typeof data === "object" &&
        data !== null &&
        ("oracleProvider" in data || "assetPair" in data || "priceData" in data)
    );
}

export function isAiTransformNodeData(data: unknown): data is AiTransformNodeData {
    return (
        typeof data === "object" &&
        data !== null &&
        ("llmProvider" in data || "llmModel" in data || "userPromptTemplate" in data)
    );
}