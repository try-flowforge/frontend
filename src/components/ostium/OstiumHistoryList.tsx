"use client";

import {
    LuHistory,
    LuLoader,
    LuArrowUpRight,
    LuArrowDownRight,
} from "react-icons/lu";
import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";
import {
    type OstiumHistoryItem,
    formatAddress,
} from "@/types/ostium";

interface OstiumHistoryListProps {
    history: OstiumHistoryItem[];
    loading: boolean;
    safeAddress: string;
}

export function OstiumHistoryList({
    history,
    loading,
    safeAddress,
}: OstiumHistoryListProps) {
    return (
        <SimpleCard className="overflow-hidden rounded-2xl border-white/6 bg-[#0a0a0e] p-0 hover:bg-[#0a0a0e] hover:border-white/8">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4">
                <div>
                    <Typography variant="h6" className="text-white font-semibold tracking-tight">
                        Trade History
                    </Typography>
                    <Typography variant="caption" className="text-zinc-500 block mt-0.5">
                        Audit trail of your closed positions and orders
                    </Typography>
                </div>
            </div>

            <div className="h-px w-full bg-white/6" />

            {/* ── Content ── */}
            <div className="p-6">
                {/* Loading State */}
                {loading && history.length === 0 && (
                    <SimpleCard className="flex items-center justify-center rounded-xl border-white/6 bg-white/2 py-10">
                        <div className="flex items-center gap-3 text-zinc-500">
                            <LuLoader className="h-4 w-4 animate-spin" />
                            <Typography variant="bodySmall" className="text-zinc-500">
                                Loading history…
                            </Typography>
                        </div>
                    </SimpleCard>
                )}

                {/* Empty State */}
                {!loading && history.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/8 py-14 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/4">
                            <LuHistory className="h-5 w-5 text-zinc-600" />
                        </div>
                        <Typography variant="bodySmall" className="text-zinc-500">
                            No history found for{" "}
                            <span className="font-mono text-zinc-400">{formatAddress(safeAddress)}</span>
                        </Typography>
                    </div>
                )}

                {/* ── History Table (Desktop) / Lists (Mobile) ── */}
                <div className="space-y-2">
                    {history.map((item) => {
                        const isProfit = !item.pnl.startsWith("-") && item.pnl !== "0" && item.pnl !== "-";
                        const isLoss = item.pnl.startsWith("-");

                        return (
                            <div
                                key={item.id}
                                className="group flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/4 bg-white/2 p-4 transition-all hover:bg-white/4 hover:border-white/8"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isProfit ? "bg-emerald-500/10 text-emerald-400" :
                                            isLoss ? "bg-red-500/10 text-red-400" :
                                                "bg-zinc-500/10 text-zinc-400"
                                        }`}>
                                        {isProfit ? <LuArrowUpRight className="h-5 w-5" /> : <LuArrowDownRight className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Typography variant="bodySmall" className="font-semibold text-white">
                                                {item.market}
                                            </Typography>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${item.side === "long" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                                }`}>
                                                {item.side}
                                            </span>
                                        </div>
                                        <Typography variant="caption" className="text-zinc-500">
                                            {item.action} · {new Date(item.timestamp).toLocaleDateString()}
                                        </Typography>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <Typography variant="caption" className="font-medium text-zinc-600 block uppercase tracking-tighter">
                                            Price
                                        </Typography>
                                        <Typography variant="bodySmall" className="font-mono text-white">
                                            {item.price}
                                        </Typography>
                                    </div>
                                    <div className="text-right min-w-[80px]">
                                        <Typography variant="caption" className="font-medium text-zinc-600 block uppercase tracking-tighter">
                                            PnL
                                        </Typography>
                                        <Typography variant="bodySmall" className={`font-bold ${isProfit ? "text-emerald-400" : isLoss ? "text-red-400" : "text-zinc-400"
                                            }`}>
                                            {item.pnl}
                                        </Typography>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </SimpleCard>
    );
}
