"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Button } from "@/components/ui/Button";
import {
    LuLoader,
    LuRefreshCw,
    LuCircleAlert,
    LuCircleCheck,
    LuLogIn,
    LuCopy,
    LuCheck,
    LuExternalLink,
    LuTrendingUp,
    LuTrendingDown,
    LuShield,
    LuWallet,
    LuCircleArrowUp,
    LuCircleArrowDown,
} from "react-icons/lu";
import { useWallets } from "@privy-io/react-auth";
import { useSafeWalletContext } from "@/context/SafeWalletContext";
import {
    LendingProvider,
    LendingOperation,
    InterestRateMode,
    LendingTokenInfo,
    LendingInputConfig,
    LENDING_OPERATION_LABELS,
    INTEREST_RATE_MODE_LABELS,
    SupportedChain,
    getLendingTokensForChain,
} from "@/types/lending";
import { CHAIN_IDS } from "@/web3/chains";
import { API_CONFIG, buildApiUrl } from "@/config/api";

interface LendingNodeConfigurationProps {
    nodeData: Record<string, unknown>;
    handleDataChange: (updates: Record<string, unknown>) => void;
    authenticated: boolean;
    login: () => void;
}

interface QuoteState {
    loading: boolean;
    error: string | null;
    data: {
        supplyAPY: string;
        borrowAPY: string;
        gasEstimate: string;
        healthFactor: string;
        availableLiquidity: string;
    } | null;
}

interface PositionState {
    loading: boolean;
    error: string | null;
    data: {
        supplied: string;
        borrowed: string;
        healthFactor: string;
        isCollateral: boolean;
    } | null;
}

// Aave V3 Pool Address on Arbitrum
const AAVE_POOL_ADDRESS = '0x794a61358D6845594F94dc1DB02A252b5b4814aD';

// Compound V3 Comet Address on Arbitrum (USDC market)
const COMPOUND_COMET_ADDRESS = '0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA';

/**
 * LendingNodeConfiguration - Configuration component for lending nodes (Aave/Compound)
 * 
 * Allows users to configure lending operations with:
 * - Operation selection (Supply, Withdraw, Borrow, Repay, Collateral management)
 * - Asset selection from supported tokens
 * - Amount input with token decimals handling
 * - Interest rate mode for borrow operations (Aave only)
 * - Quote preview with APY and health factor
 * - Position display showing current supplied/borrowed amounts
 * 
 * Note: Lending is available on Arbitrum and Ethereum Sepolia
 */
export function LendingNodeConfiguration({
    nodeData,
    handleDataChange,
    authenticated,
    login,
}: LendingNodeConfigurationProps) {
    const { wallets } = useWallets();
    const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
    const walletAddress = embeddedWallet?.address || "";

    const { selection } = useSafeWalletContext();
    const selectedSafe = selection.selectedSafe;
    const { chainId: currentChainId } = useWallets().wallets.find(w => w.walletClientType === "privy") || { chainId: null };

    // Local state
    const [quoteState, setQuoteState] = useState<QuoteState>({
        loading: false,
        error: null,
        data: null,
    });
    const [positionState, setPositionState] = useState<PositionState>({
        loading: false,
        error: null,
        data: null,
    });
    const [copied, setCopied] = useState(false);

    // Extract current configuration from node data
    const lendingProvider = (nodeData.lendingProvider as LendingProvider) || LendingProvider.AAVE;
    const lendingOperation = (nodeData.lendingOperation as LendingOperation) || LendingOperation.SUPPLY;
    const assetAddress = (nodeData.assetAddress as string) || "";
    const assetSymbol = (nodeData.assetSymbol as string) || "";
    const assetDecimals = (nodeData.assetDecimals as number) || 18;
    const lendingAmount = (nodeData.lendingAmount as string) || "";
    const interestRateMode = (nodeData.interestRateMode as InterestRateMode) || InterestRateMode.VARIABLE;

    // Get the wallet address to use (Safe or EOA)
    const effectiveWalletAddress = selectedSafe || walletAddress;

    // Get available tokens for the provider and chain
    const availableTokens = useMemo(() => {
        const chain = (nodeData.lendingChain as SupportedChain) || SupportedChain.ARBITRUM;
        return getLendingTokensForChain(lendingProvider, chain);
    }, [lendingProvider, nodeData.lendingChain]);

    // Track previous wallet address to avoid unnecessary updates
    const prevWalletRef = React.useRef<string | null>(null);

    // Update wallet address in node data only when it actually changes
    React.useEffect(() => {
        const updates: Record<string, unknown> = {};

        if (
            effectiveWalletAddress &&
            effectiveWalletAddress !== prevWalletRef.current &&
            effectiveWalletAddress !== nodeData.walletAddress
        ) {
            prevWalletRef.current = effectiveWalletAddress;
            updates.walletAddress = effectiveWalletAddress;
        }

        // Set chain automatically based on current network if not set
        const targetChain = Number(currentChainId) === CHAIN_IDS.ETHEREUM_SEPOLIA ? SupportedChain.ETHEREUM_SEPOLIA : SupportedChain.ARBITRUM;
        if (nodeData.lendingChain !== targetChain) {
            updates.lendingChain = targetChain;
        }

        if (Object.keys(updates).length > 0) {
            handleDataChange(updates);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveWalletAddress]);

    // Handle operation change
    const handleOperationChange = useCallback((operation: string) => {
        handleDataChange({
            lendingOperation: operation,
            hasQuote: false,
        });
    }, [handleDataChange]);

    // Handle token selection
    const handleAssetChange = useCallback((tokenAddress: string) => {
        const token = availableTokens.find((t: LendingTokenInfo) => t.address === tokenAddress);
        if (token) {
            handleDataChange({
                assetAddress: token.address,
                assetSymbol: token.symbol,
                assetDecimals: token.decimals,
                hasQuote: false,
            });
        }
    }, [handleDataChange, availableTokens]);

    // Handle interest rate mode change (Aave only)
    const handleInterestRateModeChange = useCallback((mode: string) => {
        handleDataChange({
            interestRateMode: mode,
            hasQuote: false,
        });
    }, [handleDataChange]);

    // Check if configuration is valid for getting a quote
    const isValidForQuote = useMemo(() => {
        return (
            assetAddress &&
            lendingAmount &&
            parseFloat(lendingAmount) > 0 &&
            effectiveWalletAddress
        );
    }, [assetAddress, lendingAmount, effectiveWalletAddress]);

    // Get quote from backend
    const handleGetQuote = useCallback(async () => {
        if (!isValidForQuote || !assetAddress) return;

        setQuoteState({ loading: true, error: null, data: null });

        try {
            // Convert amount to wei/smallest unit based on token decimals
            const amountInWei = (parseFloat(lendingAmount) * Math.pow(10, assetDecimals)).toString();

            const lendingConfig: LendingInputConfig = {
                operation: lendingOperation,
                asset: {
                    address: assetAddress,
                    symbol: assetSymbol,
                    decimals: assetDecimals,
                },
                amount: amountInWei,
                walletAddress: effectiveWalletAddress,
                interestRateMode: lendingOperation === LendingOperation.BORROW || lendingOperation === LendingOperation.REPAY
                    ? interestRateMode
                    : undefined,
            };

            const chain = (nodeData.lendingChain as SupportedChain) || SupportedChain.ARBITRUM;
            const url = `${buildApiUrl(API_CONFIG.ENDPOINTS.LENDING.QUOTE)}/${lendingProvider}/${chain}`;

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(lendingConfig),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: "Request failed" } }));
                throw new Error(errorData.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || "Failed to get quote");
            }

            const quote = data.data;

            setQuoteState({
                loading: false,
                error: null,
                data: {
                    supplyAPY: quote.supplyAPY || "0",
                    borrowAPY: quote.borrowAPY || "0",
                    gasEstimate: quote.gasEstimate || "0",
                    healthFactor: quote.currentHealthFactor || "N/A",
                    availableLiquidity: quote.availableLiquidity || "0",
                },
            });

            handleDataChange({
                hasQuote: true,
                quoteSupplyAPY: quote.supplyAPY || "0",
                quoteBorrowAPY: quote.borrowAPY || "0",
                quoteGasEstimate: quote.gasEstimate || "0",
                quoteHealthFactor: quote.currentHealthFactor || "",
            });
        } catch (error) {
            setQuoteState({
                loading: false,
                error: error instanceof Error ? error.message : "Failed to get quote",
                data: null,
            });
        }
    }, [
        isValidForQuote,
        assetAddress,
        assetSymbol,
        assetDecimals,
        lendingAmount,
        effectiveWalletAddress,
        lendingProvider,
        lendingOperation,
        interestRateMode,
        handleDataChange,
        nodeData.lendingChain,
    ]);

    // Fetch current position
    const handleFetchPosition = useCallback(async () => {
        if (!assetAddress || !effectiveWalletAddress) return;

        setPositionState({ loading: true, error: null, data: null });

        try {
            const chain = (nodeData.lendingChain as SupportedChain) || SupportedChain.ARBITRUM;
            const url = `${buildApiUrl(API_CONFIG.ENDPOINTS.LENDING.POSITION)}/${lendingProvider}/${chain}/${effectiveWalletAddress}?asset=${assetAddress}`;

            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: "Request failed" } }));
                throw new Error(errorData.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || "Failed to get position");
            }

            const position = data.data;

            // Format amounts for display
            const suppliedFormatted = (parseFloat(position.supplied) / Math.pow(10, assetDecimals)).toFixed(6);
            const borrowedFormatted = (parseFloat(position.borrowed) / Math.pow(10, assetDecimals)).toFixed(6);

            setPositionState({
                loading: false,
                error: null,
                data: {
                    supplied: suppliedFormatted,
                    borrowed: borrowedFormatted,
                    healthFactor: position.healthFactor || "N/A",
                    isCollateral: position.isCollateral || false,
                },
            });

            handleDataChange({
                suppliedAmount: suppliedFormatted,
                borrowedAmount: borrowedFormatted,
                isCollateral: position.isCollateral || false,
            });
        } catch (error) {
            setPositionState({
                loading: false,
                error: error instanceof Error ? error.message : "Failed to get position",
                data: null,
            });
        }
    }, [assetAddress, assetDecimals, effectiveWalletAddress, lendingProvider, handleDataChange, nodeData.lendingChain]);

    // Handle copy to clipboard
    const handleCopyAddress = useCallback(async () => {
        if (!effectiveWalletAddress) return;

        try {
            await navigator.clipboard.writeText(effectiveWalletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            //Failed to copy address:
        }
    }, [effectiveWalletAddress]);

    // Get operation icon
    const getOperationIcon = (operation: LendingOperation) => {
        switch (operation) {
            case LendingOperation.SUPPLY:
                return <LuCircleArrowUp className="w-4 h-4" />;
            case LendingOperation.WITHDRAW:
                return <LuCircleArrowDown className="w-4 h-4" />;
            case LendingOperation.BORROW:
                return <LuTrendingDown className="w-4 h-4" />;
            case LendingOperation.REPAY:
                return <LuTrendingUp className="w-4 h-4" />;
            case LendingOperation.ENABLE_COLLATERAL:
            case LendingOperation.DISABLE_COLLATERAL:
                return <LuShield className="w-4 h-4" />;
            default:
                return <LuWallet className="w-4 h-4" />;
        }
    };

    // Check if operation requires amount input
    const requiresAmount = lendingOperation !== LendingOperation.ENABLE_COLLATERAL &&
        lendingOperation !== LendingOperation.DISABLE_COLLATERAL;

    // Check if operation is borrow/repay (needs interest rate mode for Aave)
    const showInterestRateMode = lendingProvider === LendingProvider.AAVE &&
        (lendingOperation === LendingOperation.BORROW || lendingOperation === LendingOperation.REPAY);

    // Show login prompt if not authenticated
    if (!authenticated) {
        return (
            <div className="h-full flex items-center justify-center p-6">
                <SimpleCard className="p-6 w-full max-w-md">
                    <div className="space-y-4 text-center">
                        <div className="flex justify-center">
                            <div className="p-3 rounded-full bg-primary/10">
                                <LuLogIn className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Typography variant="h4" className="text-foreground">
                                Login Required
                            </Typography>
                            <Typography variant="bodySmall" className="text-muted-foreground">
                                Please login to configure lending settings
                            </Typography>
                        </div>
                        <Button onClick={login} className="w-full gap-2">
                            <LuLogIn className="w-4 h-4" />
                            Login to Continue
                        </Button>
                    </div>
                </SimpleCard>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Network Notice */}
            <SimpleCard className="p-3 border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2">
                    <LuShield className="w-4 h-4 text-primary" />
                    <Typography variant="caption" className="text-primary">
                        Lending is available on Arbitrum Mainnet and Ethereum Sepolia
                    </Typography>
                </div>
            </SimpleCard>

            {/* Wallet Address with Copy Button */}
            {effectiveWalletAddress && (
                <SimpleCard className="p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <Typography variant="caption" className="text-muted-foreground mb-1">
                                {selectedSafe ? "Safe Wallet" : "Wallet Address"}
                            </Typography>
                            <div className="flex items-center gap-2">
                                <Typography
                                    variant="bodySmall"
                                    className="font-mono text-foreground truncate"
                                >
                                    {effectiveWalletAddress}
                                </Typography>
                            </div>
                        </div>
                        <Button
                            onClick={handleCopyAddress}
                            className="shrink-0 gap-1.5"
                            title="Copy address"
                        >
                            {copied ? (
                                <LuCheck className="w-3.5 h-3.5 text-success" />
                            ) : (
                                <LuCopy className="w-3.5 h-3.5" />
                            )}
                        </Button>
                    </div>
                </SimpleCard>
            )}

            {/* Section 1: Operation Selection */}
            <SimpleCard className="p-4 space-y-3">
                <Typography variant="bodySmall" className="font-semibold text-foreground">
                    1. Select Operation
                </Typography>

                <div className="grid grid-cols-2 gap-2">
                    {Object.values(LendingOperation).map((op) => (
                        <button
                            key={op}
                            onClick={() => handleOperationChange(op)}
                            className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${lendingOperation === op
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50 text-foreground"
                                }`}
                        >
                            {getOperationIcon(op)}
                            <span className="text-sm font-medium">
                                {LENDING_OPERATION_LABELS[op]}
                            </span>
                        </button>
                    ))}
                </div>
            </SimpleCard>

            {/* Section 2: Asset Selection */}
            <SimpleCard className="p-4 space-y-3">
                <Typography variant="bodySmall" className="font-semibold text-foreground">
                    2. Select Asset
                </Typography>

                <select
                    value={assetAddress}
                    onChange={(e) => handleAssetChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Select asset"
                >
                    <option value="">Select an asset...</option>
                    {availableTokens.map((token: LendingTokenInfo) => (
                        <option key={token.address} value={token.address}>
                            {token.symbol} - {token.name}
                        </option>
                    ))}
                </select>

                {assetAddress && (
                    <Typography variant="caption" className="text-muted-foreground font-mono">
                        {assetAddress.slice(0, 10)}...{assetAddress.slice(-8)}
                    </Typography>
                )}
            </SimpleCard>

            {/* Section 3: Amount Input (if required) */}
            {requiresAmount && (
                <SimpleCard className="p-4 space-y-3">
                    <Typography variant="bodySmall" className="font-semibold text-foreground">
                        3. Enter Amount
                    </Typography>

                    <div className="relative">
                        <input
                            type="number"
                            value={lendingAmount}
                            onChange={(e) => handleDataChange({ lendingAmount: e.target.value, hasQuote: false })}
                            placeholder="0.00"
                            min="0"
                            step="any"
                            className="w-full px-3 py-2 pr-16 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            aria-label="Amount"
                        />
                        {assetSymbol && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                {assetSymbol}
                            </span>
                        )}
                    </div>
                </SimpleCard>
            )}

            {/* Section 4: Interest Rate Mode (Aave borrow/repay only) */}
            {showInterestRateMode && (
                <SimpleCard className="p-4 space-y-3">
                    <Typography variant="bodySmall" className="font-semibold text-foreground">
                        4. Interest Rate Mode
                    </Typography>

                    <div className="flex gap-2">
                        {Object.values(InterestRateMode).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => handleInterestRateModeChange(mode)}
                                className={`flex-1 p-3 rounded-lg border text-center transition-all ${interestRateMode === mode
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border hover:border-primary/50 text-foreground"
                                    }`}
                            >
                                <span className="text-sm font-medium">
                                    {INTEREST_RATE_MODE_LABELS[mode]}
                                </span>
                            </button>
                        ))}
                    </div>
                </SimpleCard>
            )}

            {/* Section 5: Current Position */}
            <SimpleCard className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <Typography variant="bodySmall" className="font-semibold text-foreground">
                        Current Position
                    </Typography>
                    <Button
                        onClick={handleFetchPosition}
                        disabled={!assetAddress || !effectiveWalletAddress || positionState.loading}
                        className="gap-1"
                    >
                        {positionState.loading ? (
                            <LuLoader className="w-3 h-3 animate-spin" />
                        ) : (
                            <LuRefreshCw className="w-3 h-3" />
                        )}
                        Refresh
                    </Button>
                </div>

                {positionState.error && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                        <LuCircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
                        <Typography variant="caption">{positionState.error}</Typography>
                    </div>
                )}

                {positionState.data && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                            <Typography variant="caption" className="text-muted-foreground">
                                Supplied
                            </Typography>
                            <Typography variant="bodySmall" className="font-semibold text-success">
                                {positionState.data.supplied} {assetSymbol}
                            </Typography>
                        </div>
                        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                            <Typography variant="caption" className="text-muted-foreground">
                                Borrowed
                            </Typography>
                            <Typography variant="bodySmall" className="font-semibold text-warning">
                                {positionState.data.borrowed} {assetSymbol}
                            </Typography>
                        </div>
                        <div className="p-3 rounded-lg bg-secondary/50">
                            <Typography variant="caption" className="text-muted-foreground">
                                Health Factor
                            </Typography>
                            <Typography variant="bodySmall" className="font-semibold text-foreground">
                                {positionState.data.healthFactor}
                            </Typography>
                        </div>
                        <div className="p-3 rounded-lg bg-secondary/50">
                            <Typography variant="caption" className="text-muted-foreground">
                                Collateral
                            </Typography>
                            <Typography variant="bodySmall" className="font-semibold text-foreground">
                                {positionState.data.isCollateral ? "Enabled" : "Disabled"}
                            </Typography>
                        </div>
                    </div>
                )}
            </SimpleCard>

            {/* Section 6: Quote Preview */}
            {requiresAmount && (
                <SimpleCard className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <Typography variant="bodySmall" className="font-semibold text-foreground">
                            Quote Preview
                        </Typography>
                        <Button
                            onClick={handleGetQuote}
                            disabled={!isValidForQuote || quoteState.loading}
                            className="gap-1"
                        >
                            {quoteState.loading ? (
                                <LuLoader className="w-3 h-3 animate-spin" />
                            ) : (
                                <LuRefreshCw className="w-3 h-3" />
                            )}
                            Get Quote
                        </Button>
                    </div>

                    {quoteState.error && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                            <LuCircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
                            <Typography variant="caption">{quoteState.error}</Typography>
                        </div>
                    )}

                    {quoteState.data && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                                <Typography variant="caption" className="text-muted-foreground">
                                    Supply APY
                                </Typography>
                                <Typography variant="bodySmall" className="font-semibold text-success">
                                    {quoteState.data.supplyAPY}%
                                </Typography>
                            </div>
                            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                                <Typography variant="caption" className="text-muted-foreground">
                                    Borrow APY
                                </Typography>
                                <Typography variant="bodySmall" className="font-semibold text-warning">
                                    {quoteState.data.borrowAPY}%
                                </Typography>
                            </div>
                            <div className="p-3 rounded-lg bg-secondary/50">
                                <Typography variant="caption" className="text-muted-foreground">
                                    Gas Estimate
                                </Typography>
                                <Typography variant="bodySmall" className="font-semibold text-foreground">
                                    {quoteState.data.gasEstimate}
                                </Typography>
                            </div>
                            <div className="p-3 rounded-lg bg-secondary/50">
                                <Typography variant="caption" className="text-muted-foreground">
                                    Health Factor
                                </Typography>
                                <Typography variant="bodySmall" className="font-semibold text-foreground">
                                    {quoteState.data.healthFactor}
                                </Typography>
                            </div>
                        </div>
                    )}

                    {quoteState.data && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success">
                            <LuCircleCheck className="w-4 h-4" />
                            <Typography variant="caption">
                                Quote valid. Ready to execute in workflow.
                            </Typography>
                        </div>
                    )}
                </SimpleCard>
            )}

            {/* Provider Info */}
            <SimpleCard className="p-4 space-y-2">
                <Typography variant="caption" className="text-muted-foreground">
                    Provider: <span className="font-semibold text-foreground">
                        {lendingProvider === LendingProvider.AAVE ? "Aave V3" : "Compound V3"}
                    </span>
                </Typography>
                <div className="flex items-center gap-2">
                    <Typography variant="caption" className="text-muted-foreground">
                        Contract:
                    </Typography>
                    <a
                        href={`https://arbiscan.io/address/${lendingProvider === LendingProvider.AAVE ? AAVE_POOL_ADDRESS : COMPOUND_COMET_ADDRESS
                            }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                    >
                        {(lendingProvider === LendingProvider.AAVE ? AAVE_POOL_ADDRESS : COMPOUND_COMET_ADDRESS).slice(0, 10)}...
                        <LuExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </SimpleCard>
        </div>
    );
}
