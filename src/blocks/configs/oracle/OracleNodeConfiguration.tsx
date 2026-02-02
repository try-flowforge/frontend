"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Button } from "@/components/ui/Button";
import {
    LuCircleAlert,
    LuCircleCheck,
    LuExternalLink,
    LuCopy,
    LuCheck,
    LuInfo,
} from "react-icons/lu";
import {
    OracleProvider,
    OracleChain,
    CHAINLINK_PRICE_FEEDS,
    PYTH_PRICE_FEEDS,
    getChainlinkFeedsForChain,
    isValidEthereumAddress,
    isValidPythFeedId,
    ORACLE_CHAIN_LABELS,
} from "@/types/oracle";

interface OracleNodeConfigurationProps {
    nodeData: Record<string, unknown>;
    handleDataChange: (updates: Record<string, unknown>) => void;
    authenticated: boolean;
    login: () => void;
}

export function OracleNodeConfiguration({
    nodeData,
    handleDataChange,
    authenticated,
    login,
}: OracleNodeConfigurationProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Extract oracle data
    const oracleProvider = (nodeData.oracleProvider as OracleProvider) || OracleProvider.CHAINLINK;
    const oracleChain = (nodeData.oracleChain as OracleChain) || OracleChain.ARBITRUM_SEPOLIA;
    const aggregatorAddress = (nodeData.aggregatorAddress as string) || "";
    const priceFeedId = (nodeData.priceFeedId as string) || "";
    const selectedPriceFeed = (nodeData.selectedPriceFeed as string) || "";
    const staleAfterSeconds = nodeData.staleAfterSeconds as number | undefined;
    const simulateFirst = nodeData.simulateFirst !== false;

    const isChainlink = oracleProvider === OracleProvider.CHAINLINK;
    const isPyth = oracleProvider === OracleProvider.PYTH;

    // Get available price feeds based on provider and chain
    const availablePriceFeeds = useMemo(() => {
        if (isChainlink) {
            return getChainlinkFeedsForChain(oracleChain);
        }
        return PYTH_PRICE_FEEDS;
    }, [isChainlink, oracleChain]);

    // Validation
    const addressError = isChainlink && aggregatorAddress && !isValidEthereumAddress(aggregatorAddress)
        ? "Invalid Ethereum address format"
        : null;

    const feedIdError = isPyth && priceFeedId && !isValidPythFeedId(priceFeedId)
        ? "Invalid feed ID format (must be 66-character hex string)"
        : null;

    const isConfigValid = isChainlink
        ? aggregatorAddress && !addressError
        : priceFeedId && !feedIdError;

    // Handle chain change
    const handleChainChange = useCallback((chain: OracleChain) => {
        handleDataChange({
            oracleChain: chain,
            // Reset feed selection when chain changes
            selectedPriceFeed: "",
            aggregatorAddress: "",
        });
    }, [handleDataChange]);

    // Handle price feed preset selection
    const handlePriceFeedPreset = useCallback((feedSymbol: string) => {
        const feed = availablePriceFeeds.find(f => f.symbol === feedSymbol);
        if (!feed) return;

        if (isChainlink) {
            const chainlinkFeed = feed as typeof CHAINLINK_PRICE_FEEDS[0];
            handleDataChange({
                selectedPriceFeed: feedSymbol,
                aggregatorAddress: chainlinkFeed.address,
            });
        } else {
            const pythFeed = feed as typeof PYTH_PRICE_FEEDS[0];
            handleDataChange({
                selectedPriceFeed: feedSymbol,
                priceFeedId: pythFeed.feedId,
            });
        }
    }, [availablePriceFeeds, isChainlink, handleDataChange]);

    // Handle copy to clipboard
    const handleCopy = useCallback((text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    }, []);

    return (
        <div className="space-y-4">
            {/* Authentication Required */}
            {!authenticated && (
                <SimpleCard className="p-4 bg-amber-500/10 border-amber-500/30">
                    <div className="flex items-start gap-3">
                        <LuCircleAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-2">
                            <Typography variant="bodySmall" className="font-semibold text-amber-300">
                                Authentication Required
                            </Typography>
                            <Typography variant="caption" className="text-amber-200/80">
                                Connect your wallet to configure and execute oracle queries
                            </Typography>
                            <Button
                                onClick={login}
                                className="w-full mt-2 h-10"
                            >
                                Connect Wallet
                            </Button>
                        </div>
                    </div>
                </SimpleCard>
            )}

            {/* Provider Info Card */}
            <SimpleCard className="p-4 space-y-2 bg-primary/5 border-primary/20">
                <div className="flex items-center gap-2">
                    <LuInfo className="w-4 h-4 text-primary" />
                    <Typography variant="bodySmall" className="font-semibold text-foreground">
                        {isChainlink ? "Chainlink" : "Pyth Network"} Oracle
                    </Typography>
                </div>
                <Typography variant="caption" className="text-muted-foreground">
                    {isChainlink
                        ? "Industry-standard decentralized oracle network providing reliable price feeds"
                        : "Low-latency, high-frequency oracle providing real-time price data"}
                </Typography>
            </SimpleCard>

            {/* Section 1: Network Selection */}
            <SimpleCard className="p-4 space-y-3">
                <Typography variant="bodySmall" className="font-semibold text-foreground">
                    1. Select Network
                </Typography>

                <div className="grid grid-cols-2 gap-2">
                    {Object.values(OracleChain).map((chain) => (
                        <button
                            key={chain}
                            onClick={() => handleChainChange(chain)}
                            className={`p-3 rounded-lg border text-left transition-all ${oracleChain === chain
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50 text-foreground"
                                }`}
                        >
                            <span className="text-sm font-medium">
                                {ORACLE_CHAIN_LABELS[chain]}
                            </span>
                        </button>
                    ))}
                </div>
            </SimpleCard>

            {/* Section 2: Price Feed Selection */}
            <SimpleCard className="p-4 space-y-3">
                <Typography variant="bodySmall" className="font-semibold text-foreground">
                    2. Select Price Feed
                </Typography>

                <div className="space-y-2">
                    <label className="block">
                        <Typography variant="caption" className="text-muted-foreground mb-1.5">
                            Choose from presets
                        </Typography>
                        <select
                            value={selectedPriceFeed}
                            onChange={(e) => handlePriceFeedPreset(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="">Select a price feed...</option>
                            {availablePriceFeeds.map((feed) => (
                                <option key={feed.symbol} value={feed.symbol}>
                                    {feed.symbol} - {feed.description}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {/* Chainlink: Aggregator Address */}
                {isChainlink && (
                    <div className="space-y-2 pt-2 border-t border-border">
                        <label className="block">
                            <Typography variant="caption" className="text-muted-foreground mb-1.5">
                                Price Feed Contract Address
                            </Typography>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={aggregatorAddress}
                                    onChange={(e) => handleDataChange({ aggregatorAddress: e.target.value })}
                                    placeholder="0x639Fe6ab55C921647C C93A6C8766f4346C6F3"
                                    className={`w-full px-3 py-2 pr-10 bg-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${addressError ? "border-red-500" : "border-border"
                                        }`}
                                />
                                {aggregatorAddress && (
                                    <button
                                        onClick={() => handleCopy(aggregatorAddress, "address")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-secondary/50 rounded transition-colors"
                                    >
                                        {copiedField === "address" ? (
                                            <LuCheck className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <LuCopy className="w-4 h-4 text-muted-foreground" />
                                        )}
                                    </button>
                                )}
                            </div>
                            {addressError && (
                                <Typography variant="caption" className="text-red-500 mt-1">
                                    {addressError}
                                </Typography>
                            )}
                            <Typography variant="caption" className="text-muted-foreground mt-1">
                                Enter Chainlink aggregator contract address
                            </Typography>
                        </label>
                    </div>
                )}

                {/* Pyth: Price Feed ID */}
                {isPyth && (
                    <div className="space-y-2 pt-2 border-t border-border">
                        <label className="block">
                            <Typography variant="caption" className="text-muted-foreground mb-1.5">
                                Pyth Price Feed ID
                            </Typography>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={priceFeedId}
                                    onChange={(e) => handleDataChange({ priceFeedId: e.target.value })}
                                    placeholder="0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
                                    className={`w-full px-3 py-2 pr-10 bg-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${feedIdError ? "border-red-500" : "border-border"
                                        }`}
                                />
                                {priceFeedId && (
                                    <button
                                        onClick={() => handleCopy(priceFeedId, "feedId")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-secondary/50 rounded transition-colors"
                                    >
                                        {copiedField === "feedId" ? (
                                            <LuCheck className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <LuCopy className="w-4 h-4 text-muted-foreground" />
                                        )}
                                    </button>
                                )}
                            </div>
                            {feedIdError && (
                                <Typography variant="caption" className="text-red-500 mt-1">
                                    {feedIdError}
                                </Typography>
                            )}
                            <div className="flex items-center gap-1 mt-1">
                                <Typography variant="caption" className="text-muted-foreground">
                                    Find more feed IDs at
                                </Typography>
                                <a
                                    href="https://pyth.network/developers/price-feed-ids"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline text-xs flex items-center gap-0.5"
                                >
                                    pyth.network
                                    <LuExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </label>
                    </div>
                )}
            </SimpleCard>

            {/* Section 3: Optional Settings */}
            <SimpleCard className="p-4 space-y-3">
                <Typography variant="bodySmall" className="font-semibold text-foreground">
                    3. Optional Settings
                </Typography>

                <div className="space-y-2">
                    <label className="block">
                        <Typography variant="caption" className="text-muted-foreground mb-1.5">
                            Max Data Age (seconds)
                        </Typography>
                        <input
                            type="number"
                            value={staleAfterSeconds || ""}
                            onChange={(e) => handleDataChange({
                                staleAfterSeconds: e.target.value ? parseInt(e.target.value) : undefined
                            })}
                            placeholder="3600"
                            min="0"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <Typography variant="caption" className="text-muted-foreground mt-1">
                            Reject price data older than this (optional, leave empty for no check)
                        </Typography>
                    </label>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        id="simulateFirst"
                        checked={simulateFirst}
                        onChange={(e) => handleDataChange({ simulateFirst: e.target.checked })}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                    />
                    <label htmlFor="simulateFirst">
                        <Typography variant="caption" className="text-muted-foreground">
                            Simulate before fetching (recommended)
                        </Typography>
                    </label>
                </div>
            </SimpleCard>

            {/* Configuration Status */}
            <SimpleCard className={`p-4 ${isConfigValid ? "bg-green-500/10 border-green-500/30" : "bg-orange-500/10 border-orange-500/30"}`}>
                <div className="flex items-center gap-2">
                    {isConfigValid ? (
                        <>
                            <LuCircleCheck className="w-5 h-5 text-green-500" />
                            <Typography variant="bodySmall" className="text-green-400">
                                Configuration complete - ready to fetch price data
                            </Typography>
                        </>
                    ) : (
                        <>
                            <LuCircleAlert className="w-5 h-5 text-orange-400" />
                            <Typography variant="bodySmall" className="text-orange-300">
                                {isChainlink
                                    ? "Enter a valid aggregator address to continue"
                                    : "Enter a valid price feed ID to continue"}
                            </Typography>
                        </>
                    )}
                </div>
            </SimpleCard>
        </div>
    );
}

