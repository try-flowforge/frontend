"use client";

import { useState } from "react";
import {
    LuActivity,
    LuLoader,
    LuPlus,
    LuInfo,
} from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";

interface MarketStatProps {
    label: string;
    value: string;
    description: string;
}

function MarketStat({ label, value, description }: MarketStatProps) {
    return (
        <div className="flex flex-col gap-1 p-4 rounded-xl border border-white/4 bg-white/2">
            <div className="flex items-center justify-between">
                <Typography variant="caption" className="font-medium uppercase tracking-wider text-zinc-500">
                    {label}
                </Typography>
                <LuInfo className="h-3.5 w-3.5 text-zinc-600" />
            </div>
            <Typography variant="bodySmall" className="font-bold text-white text-lg">
                {value}
            </Typography>
            <Typography variant="caption" className="text-zinc-500 text-[10px]">
                {description}
            </Typography>
        </div>
    );
}

interface OstiumMarketStatsProps {
    marketName: string;
    fundingRate: string;
    rolloverFee: string;
    marketStatus: string;
    isTestnet: boolean;
    faucetLoading: boolean;
    runFaucet: () => Promise<void>;
}

export function OstiumMarketStats({
    marketName,
    fundingRate,
    rolloverFee,
    marketStatus,
    isTestnet,
    faucetLoading,
    runFaucet,
}: OstiumMarketStatsProps) {
    return (
        <SimpleCard className="overflow-hidden rounded-2xl border-white/6 bg-[#0a0a0e] p-0 hover:bg-[#0a0a0e] hover:border-white/8">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4">
                <div>
                    <Typography variant="h6" className="text-white font-semibold tracking-tight">
                        Market Insights: {marketName}
                    </Typography>
                    <Typography variant="caption" className="text-zinc-500 block mt-0.5">
                        Deep metrics for your selected trading pair
                    </Typography>
                </div>
                {isTestnet && (
                    <Button
                        border
                        borderColor="#10b981"
                        className="h-9 px-4 text-xs bg-emerald-500/10 hover:bg-emerald-500/20"
                        onClick={runFaucet}
                        disabled={faucetLoading}
                    >
                        {faucetLoading ? (
                            <LuLoader className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <LuPlus className="mr-2 h-3.5 w-3.5" />
                        )}
                        Request 1000 USDC
                    </Button>
                )}
            </div>

            <div className="h-px w-full bg-white/6" />

            {/* ── Content ── */}
            <div className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <MarketStat
                        label="Funding Rate"
                        value={fundingRate || "0.00%"}
                        description="Periodic payment to balance long/short demand."
                    />
                    <MarketStat
                        label="Rollover Fee"
                        value={rolloverFee || "0.00%"}
                        description="Hourly cost to maintain an open position."
                    />
                    <MarketStat
                        label="Market Status"
                        value={marketStatus || "Open"}
                        description="Current operational status of this market."
                    />
                </div>

                <div className="mt-6 flex items-start gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                    <LuActivity className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                        <Typography variant="bodySmall" className="font-semibold text-blue-200">
                            Real-time Execution
                        </Typography>
                        <Typography variant="caption" className="text-blue-200/60 leading-relaxed">
                            Market data is sourced directly from Chainlink price feeds. Funding rates and rollover fees are updated every block to ensure fair pricing.
                        </Typography>
                    </div>
                </div>
            </div>
        </SimpleCard>
    );
}
