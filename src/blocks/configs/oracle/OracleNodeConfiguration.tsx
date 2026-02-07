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
    LuNetwork,
    LuDatabase,
    LuSettings2,
    LuChevronRight,
    LuSparkles,
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
import { cn } from "@/lib/utils";

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
        ? "Invalid feed ID format (66-character hex)"
        : null;

    const isConfigValid = isChainlink
        ? aggregatorAddress && !addressError
        : priceFeedId && !feedIdError;

    // Handle chain change
    const handleChainChange = useCallback((chain: OracleChain) => {
        handleDataChange({
            oracleChain: chain,
            selectedPriceFeed: "",
            aggregatorAddress: "",
            priceFeedId: "",
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
            {/* 1. Auth & Provider Identity */}
            <div className="space-y-4">
                {!authenticated && (
                    <SimpleCard className="p-4 border-amber-500/20 bg-amber-500/5">
                        <div className="flex gap-3">
                            <LuCircleAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-3 flex-1">
                                <div className="space-y-0.5">
                                    <Typography variant="bodySmall" className="font-bold text-foreground">
                                        Action Required
                                    </Typography>
                                    <Typography variant="caption" className="text-muted-foreground block leading-relaxed">
                                        Please connect your wallet to configure oracle parameters and simulate workflow execution.
                                    </Typography>
                                </div>
                                <Button onClick={login} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-10">
                                    Connect Wallet
                                </Button>
                            </div>
                        </div>
                    </SimpleCard>
                )}

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2.5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <LuInfo className="w-12 h-12" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20">
                            <LuSparkles className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <Typography variant="bodySmall" className="font-bold tracking-tight text-foreground">
                            {isChainlink ? "Chainlink" : "Pyth"} Oracle
                        </Typography>
                    </div>
                    <Typography variant="caption" className="text-muted-foreground block leading-relaxed max-w-sm">
                        {isChainlink
                            ? "Access decentralized price feeds and off-chain data via Chainlink's industry-standard infrastructure."
                            : "Low-latency, high-fidelity financial market data delivered directly from the Pyth Network."}
                    </Typography>
                </div>
            </div>

            {/* Step 1: Network Selection */}
            <SimpleCard className="p-5 space-y-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-800 border border-white/10 text-[10px] font-bold text-white/40 group-hover:text-white/60 transition-colors">
                        1
                    </div>
                    <Typography variant="bodySmall" className="font-bold text-foreground">
                        Select Network
                    </Typography>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {Object.values(OracleChain).map((chain) => {
                        const isSelected = oracleChain === chain;
                        return (
                            <button
                                key={chain}
                                onClick={() => handleChainChange(chain)}
                                className={cn(
                                    "group relative flex items-center justify-between p-3.5 rounded-xl border transition-all text-left",
                                    isSelected
                                        ? "bg-blue-500/5 border-blue-500/40 text-blue-400 shadow-[0_0_15px_-3px_rgba(59,130,246,0.1)]"
                                        : "bg-white/5 border-white/10 text-white/50 hover:bg-white/[0.07] hover:border-white/20"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                                        isSelected ? "bg-blue-500/20 border-blue-500/30 text-blue-400" : "bg-zinc-900 border-white/5 text-white/20"
                                    )}>
                                        <LuNetwork className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-semibold tracking-tight">
                                        {ORACLE_CHAIN_LABELS[chain]}
                                    </span>
                                </div>
                                {isSelected && <LuCircleCheck className="w-4 h-4" />}
                                {!isSelected && <LuChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </button>
                        );
                    })}
                </div>
            </SimpleCard>

            {/* Step 2: Feed Configuration */}
            <SimpleCard className="p-5 space-y-5">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-800 border border-white/10 text-[10px] font-bold text-white/40">
                        2
                    </div>
                    <Typography variant="bodySmall" className="font-bold text-foreground">
                        Configure Price Feed
                    </Typography>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <Typography variant="caption" className="font-bold text-white/40 uppercase tracking-widest text-[10px]">
                                Preset Feeds
                            </Typography>
                        </div>
                        <select
                            value={selectedPriceFeed}
                            onChange={(e) => handlePriceFeedPreset(e.target.value)}
                            className="w-full h-11 px-4 bg-zinc-900/50 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Select a feed...</option>
                            {availablePriceFeeds.map((feed) => (
                                <option key={feed.symbol} value={feed.symbol}>
                                    {feed.symbol} — {feed.description}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="h-px bg-white/5 w-full" />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <Typography variant="caption" className="font-bold text-white/40 uppercase tracking-widest text-[10px]">
                                {isChainlink ? "Contract Address" : "Feed ID"}
                            </Typography>
                        </div>
                        <div className="relative group">
                            <input
                                type="text"
                                value={isChainlink ? aggregatorAddress : priceFeedId}
                                onChange={(e) => handleDataChange(isChainlink ? { aggregatorAddress: e.target.value } : { priceFeedId: e.target.value })}
                                placeholder={isChainlink ? "0x000...000" : "0x000...000"}
                                className={cn(
                                    "w-full h-11 px-4 pr-11 bg-zinc-900/50 border rounded-xl text-sm font-mono text-foreground focus:outline-none focus:ring-2 transition-all",
                                    (isChainlink ? addressError : feedIdError)
                                        ? "border-red-500/50 focus:ring-red-500/10"
                                        : "border-white/10 focus:ring-blue-500/10 focus:border-blue-500/40"
                                )}
                            />
                            {(isChainlink ? aggregatorAddress : priceFeedId) && (
                                <button
                                    onClick={() => handleCopy(isChainlink ? aggregatorAddress : priceFeedId, "feed")}
                                    className="absolute right-2 top-1.5 p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
                                >
                                    {copiedField === "feed" ? (
                                        <LuCheck className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <LuCopy className="w-4 h-4" />
                                    )}
                                </button>
                            )}
                        </div>
                        {(isChainlink ? addressError : feedIdError) && (
                            <div className="flex items-center gap-1.5 px-1 py-0.5">
                                <LuCircleAlert className="w-3.5 h-3.5 text-red-500" />
                                <Typography variant="caption" className="text-red-500 font-medium">
                                    {isChainlink ? addressError : feedIdError}
                                </Typography>
                            </div>
                        )}

                        {isPyth && (
                            <div className="flex items-center gap-2 px-1 py-1">
                                <div className="h-4 w-4 shrink-0 flex items-center justify-center rounded-full bg-blue-500/10">
                                    <LuExternalLink className="w-2.5 h-2.5 text-blue-400" />
                                </div>
                                <Typography variant="caption" className="text-muted-foreground">
                                    Find IDs at <a href="https://pyth.network/developers/price-feed-ids" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">pyth.network</a>
                                </Typography>
                            </div>
                        )}
                    </div>
                </div>
            </SimpleCard>

            {/* Step 3: Advanced Options */}
            <SimpleCard className="p-5 space-y-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-800 border border-white/10 text-[10px] font-bold text-white/40">
                        3
                    </div>
                    <Typography variant="bodySmall" className="font-bold text-foreground">
                        Execution Settings
                    </Typography>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <Typography variant="caption" className="font-bold text-white/40 uppercase tracking-widest text-[10px]">
                                Staleness Threshold
                            </Typography>
                        </div>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                                <LuSettings2 className="w-4 h-4" />
                            </div>
                            <input
                                type="number"
                                value={staleAfterSeconds || ""}
                                onChange={(e) => handleDataChange({
                                    staleAfterSeconds: e.target.value ? parseInt(e.target.value) : undefined
                                })}
                                placeholder="3600 (seconds)"
                                className="w-full h-11 pl-11 pr-4 bg-zinc-900/50 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/40"
                            />
                        </div>
                        <Typography variant="caption" className="text-muted-foreground block px-1 leading-snug">
                            Maximum data age (in seconds) before the workflow rejects the price feed.
                        </Typography>
                    </div>

                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleDataChange({ simulateFirst: !simulateFirst })}
                        className={cn(
                            "flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                            simulateFirst ? "bg-blue-500/5 border-blue-500/20" : "bg-black/20 border-white/5 hover:border-white/10"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg border",
                                simulateFirst ? "bg-blue-500/20 border-blue-500/30 text-blue-400" : "bg-zinc-900 border-white/5 text-white/20"
                            )}>
                                <LuDatabase className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                                <Typography variant="caption" className="font-bold text-foreground block">Simulate Execution</Typography>
                                <Typography variant="caption" className="text-muted-foreground block text-[10px]">Verify feed status before run</Typography>
                            </div>
                        </div>
                        <div className={cn(
                            "w-10 h-5 rounded-full relative transition-colors",
                            simulateFirst ? "bg-blue-500" : "bg-zinc-800"
                        )}>
                            <div className={cn(
                                "absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                                simulateFirst ? "left-6" : "left-1"
                            )} />
                        </div>
                    </div>
                </div>
            </SimpleCard>

            {/* Validation & Summary */}
            <div className={cn(
                "p-4 rounded-xl border-l-4 transition-all shadow-sm",
                isConfigValid
                    ? "bg-green-500/5 border-green-500/30 text-green-400"
                    : "bg-orange-500/5 border-orange-500/30 text-orange-400"
            )}>
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        isConfigValid ? "bg-green-500/20" : "bg-orange-500/20"
                    )}>
                        {isConfigValid ? <LuCircleCheck className="w-5 h-5" /> : <LuCircleAlert className="w-5 h-5" />}
                    </div>
                    <div>
                        <Typography variant="bodySmall" className="font-bold block">
                            {isConfigValid ? "Oracle Fully Configured" : "Configuration Incomplete"}
                        </Typography>
                        <Typography variant="caption" className="opacity-80 block leading-tight mt-0.5">
                            {isConfigValid
                                ? "Blockchain connection and price feed parameters are validated."
                                : isChainlink
                                    ? "Please provide a valid contract address to proceed."
                                    : "Please provide a valid feed ID to proceed."}
                        </Typography>
                    </div>
                </div>
            </div>
        </div>
    );
}
