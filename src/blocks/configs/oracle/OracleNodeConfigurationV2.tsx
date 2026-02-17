"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
    LuLoader,
    LuCircleAlert,
    LuCircleCheck,
    LuInfo,
    LuSparkles,
} from "react-icons/lu";
import {
    fetchAvailableFeeds,
    fetchOracleConfig,
    groupFeedsByCategory,
    getChainLabel,
    getProviderLabel,
    getCategoryLabel,
    type OracleProvider,
    type PriceFeed,
    type FeedCategory,
} from "@/lib/oracle-api";

interface OracleNodeConfigurationV2Props {
    nodeData: Record<string, unknown>;
    handleDataChange: (updates: Record<string, unknown>) => void;
    authenticated: boolean;
    login: () => void;
}

function OracleNodeConfigurationV2Inner({
    nodeData,
    handleDataChange,
    authenticated,
    login,
}: OracleNodeConfigurationV2Props) {
    // Extract oracle data
    const oracleProvider = (nodeData.oracleProvider as OracleProvider) || "CHAINLINK";
    const oracleChain = (nodeData.oracleChain as string) || "ARBITRUM_SEPOLIA";
    const selectedSymbol = (nodeData.symbol as string) || "";
    const feedName = (nodeData.feedName as string) || "";
    const aggregatorAddress = (nodeData.aggregatorAddress as string) || "";
    const priceFeedId = (nodeData.priceFeedId as string) || "";
    const staleAfterSeconds = (nodeData.staleAfterSeconds as number) || 3600;

    const [availableFeeds, setAvailableFeeds] = useState<PriceFeed[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingConfig, setFetchingConfig] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isChainlink = oracleProvider === "CHAINLINK";

    // Fetch available feeds when provider or chain changes
    const loadAvailableFeeds = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const feeds = await fetchAvailableFeeds(oracleProvider, oracleChain);
            if (feeds) {
                setAvailableFeeds(feeds.feeds);
            } else {
                setError("Failed to load available price feeds");
            }
        } catch {
            //console.error("Error loading feeds:", err);
            setError("Failed to load price feeds");
        } finally {
            setLoading(false);
        }
    }, [oracleProvider, oracleChain]);

    useEffect(() => {
        loadAvailableFeeds();
    }, [loadAvailableFeeds]);

    // Handle chain change
    const handleChainChange = useCallback((chain: string) => {
        handleDataChange({
            oracleChain: chain,
            // Reset feed selection when chain changes
            symbol: "",
            feedName: "",
            aggregatorAddress: "",
            priceFeedId: "",
        });
    }, [handleDataChange]);

    // Handle price feed selection
    const handleFeedSelection = useCallback(async (symbol: string) => {
        if (!symbol) {
            handleDataChange({
                symbol: "",
                feedName: "",
                aggregatorAddress: "",
                priceFeedId: "",
            });
            return;
        }

        setFetchingConfig(true);
        setError(null);

        try {
            const config = await fetchOracleConfig(symbol, oracleProvider, oracleChain);

            if (config) {
                const updates: Record<string, unknown> = {
                    symbol: config.symbol,
                    feedName: config.name,
                    category: config.category,
                };

                if (config.provider === "CHAINLINK") {
                    updates.aggregatorAddress = config.aggregatorAddress;
                    updates.priceFeedId = "";
                } else {
                    updates.priceFeedId = config.priceFeedId;
                    updates.aggregatorAddress = "";
                }

                handleDataChange(updates);
            } else {
                setError("Failed to fetch configuration for selected feed");
            }
        } catch {
            //console.error("Error fetching config:", err);
            setError("Failed to fetch feed configuration");
        } finally {
            setFetchingConfig(false);
        }
    }, [oracleProvider, oracleChain, handleDataChange]);

    // Group feeds by category
    const groupedFeeds = useMemo(() => {
        if (availableFeeds.length === 0) return {};
        return groupFeedsByCategory(availableFeeds);
    }, [availableFeeds]);

    // Check if configuration is complete
    const isConfigValid = useMemo(() => {
        return selectedSymbol && (isChainlink ? aggregatorAddress : priceFeedId);
    }, [selectedSymbol, isChainlink, aggregatorAddress, priceFeedId]);

    // Get chain badge color
    const getChainBadgeColor = (chain: string) => {
        if (chain === "ARBITRUM") return "bg-green-500/20 text-green-400 border-green-500/30";
        if (chain === "ARBITRUM_SEPOLIA") return "bg-orange-500/20 text-orange-400 border-orange-500/30";

    };

    // Prepare dropdown options
    const dropdownOptions = useMemo(() => {
        const options: { value: string; label: string; group?: string }[] = [];
        Object.entries(groupedFeeds).forEach(([category, feeds]) => {
            // For simplicity in Dropdown (which might not support groups directly in its interface yet based on prev usage),
            // we flatten or just list them. If Dropdown supports groups, we'd structure accordingly.
            // Based on previous usage, Dropdown takes a flat list. We can prefix the label.
            (feeds as PriceFeed[]).forEach(feed => {
                options.push({
                    value: feed.symbol,
                    label: `${getCategoryLabel(category as FeedCategory)}: ${feed.symbol} - ${feed.name}`
                });
            });
        });
        return options;
    }, [groupedFeeds]);


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

            {/* Provider Header Card */}
            <SimpleCard className="p-4 space-y-2 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <LuSparkles className="w-5 h-5 text-primary" />
                        <Typography variant="bodySmall" className="font-semibold text-foreground">
                            {getProviderLabel(oracleProvider)} Oracle
                        </Typography>
                    </div>
                    <div className={`px-2 py-1 rounded-md border text-xs font-medium ${getChainBadgeColor(oracleChain)}`}>
                        {oracleChain === "ARBITRUM" ? "Mainnet" : "Testnet"}
                    </div>
                </div>
                <Typography variant="caption" className="text-muted-foreground">
                    {isChainlink
                        ? "Industry-standard decentralized oracle network providing reliable price feeds"
                        : "Low-latency, high-frequency oracle providing real-time price data"}
                </Typography>
            </SimpleCard>

            {/* Error Display */}
            {error && (
                <SimpleCard className="p-4 bg-red-500/10 border-red-500/30">
                    <div className="flex items-start gap-2">
                        <LuCircleAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <Typography variant="caption" className="text-red-300">
                            {error}
                        </Typography>
                    </div>
                </SimpleCard>
            )}

            {/* Step 1: Network Selection */}
            <SimpleCard className="p-4 space-y-3">
                <Typography variant="bodySmall" className="font-semibold text-foreground">
                    1. Select Blockchain Network
                </Typography>

                <div className="grid grid-cols-1 gap-2">
                    {(["ARBITRUM_SEPOLIA", "ARBITRUM"] as string[]).map((chain) => (
                        <button
                            key={chain}
                            onClick={() => handleChainChange(chain)}
                            disabled={loading}
                            className={`p-3 rounded-lg border text-left transition-all disabled:opacity-50 ${oracleChain === chain
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-foreground"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    {getChainLabel(chain)}
                                </span>
                                {oracleChain === chain && (
                                    <LuCircleCheck className="w-4 h-4" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </SimpleCard>

            {/* Step 2: Price Feed Selection */}
            <SimpleCard className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <Typography variant="bodySmall" className="font-semibold text-foreground">
                        2. Select Price Feed
                    </Typography>
                    {loading && <LuLoader className="w-4 h-4 animate-spin text-primary" />}
                </div>

                <div className="space-y-2">
                    <Typography variant="caption" className="text-muted-foreground mb-1.5 block">
                        Choose a price pair
                    </Typography>

                    <Dropdown
                        value={selectedSymbol}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onChange={(e: any) => handleFeedSelection(e.target.value)}
                        options={dropdownOptions}
                        placeholder="Select a price feed..."
                        disabled={loading || fetchingConfig}
                        className="w-full"
                    />

                    {fetchingConfig && (
                        <div className="flex items-center gap-2 text-primary">
                            <LuLoader className="w-4 h-4 animate-spin" />
                            <Typography variant="caption">
                                Fetching configuration...
                            </Typography>
                        </div>
                    )}
                </div>

                {/* Preview Card */}
                {selectedSymbol && feedName && (
                    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                        <div className="flex items-center gap-2">
                            <LuCircleCheck className="w-4 h-4 text-green-500" />
                            <Typography variant="bodySmall" className="font-semibold text-foreground">
                                {selectedSymbol}
                            </Typography>
                        </div>
                        <Typography variant="caption" className="text-muted-foreground">
                            {feedName}
                        </Typography>
                        <div className="pt-2 border-t border-border space-y-1">
                            <Typography variant="caption" className="text-muted-foreground">
                                {isChainlink ? "Aggregator Address:" : "Price Feed ID:"}
                            </Typography>
                            <div className="font-mono text-xs text-foreground/80 break-all bg-background/50 p-2 rounded">
                                {isChainlink ? aggregatorAddress : priceFeedId}
                            </div>
                            <div className="flex items-center gap-1 text-green-500">
                                <LuCircleCheck className="w-3 h-3" />
                                <Typography variant="caption">
                                    Auto-filled from backend
                                </Typography>
                            </div>
                        </div>
                    </div>
                )}
            </SimpleCard>

            {/* Step 3: Optional Settings */}
            <SimpleCard className="p-4 space-y-3">
                <Typography variant="bodySmall" className="font-semibold text-foreground">
                    3. Optional Settings
                </Typography>

                <div className="space-y-2">
                    <label className="block">
                        <Typography variant="caption" className="text-muted-foreground mb-1.5 flex items-center gap-1">
                            Staleness Guard (seconds)
                            <div className="group relative">
                                <LuInfo className="w-3 h-3 cursor-help" />
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-[#1e1e1e] border border-white/20 rounded-lg shadow-lg z-10">
                                    <Typography variant="caption" className="text-muted-foreground">
                                        Reject price data older than this many seconds. Default: 3600 (1 hour)
                                    </Typography>
                                </div>
                            </div>
                        </Typography>
                        <input
                            type="number"
                            value={staleAfterSeconds}
                            onChange={(e) => handleDataChange({
                                staleAfterSeconds: parseInt(e.target.value) || 3600
                            })}
                            placeholder="3600"
                            min="0"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <Typography variant="caption" className="text-muted-foreground mt-1">
                            Workflow will fail if price data is older than this
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
                                Select a blockchain network and price feed to continue
                            </Typography>
                        </>
                    )}
                </div>
            </SimpleCard>
        </div>
    );
}


export function OracleNodeConfigurationV2(props: OracleNodeConfigurationV2Props) {
    return (
        <ErrorBoundary
            fallback={(error, reset) => (
                <SimpleCard className="p-4 space-y-3">
                    <Typography variant="bodySmall" className="font-semibold text-foreground">
                        Oracle Configuration Error
                    </Typography>
                    <Typography variant="caption" className="text-destructive">
                        {error.message}
                    </Typography>
                    <Button type="button" onClick={reset} className="w-full">
                        Try Again
                    </Button>
                </SimpleCard>
            )}
        >
            <OracleNodeConfigurationV2Inner {...props} />
        </ErrorBoundary>
    );
}
