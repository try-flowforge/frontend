"use client";

import {
    LuCircleArrowDown,
    LuCircleArrowUp,
    LuLoader,
    LuShield,
} from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Input } from "@/components/ui/Input";
import {
    OSTIUM_NETWORK_LABELS,
    type OstiumNetwork,
    type ParsedOstiumPosition,
    formatAddress,
} from "@/types/ostium";

interface PositionDraft {
    slPrice: string;
    tpPrice: string;
}

interface RowActionLoading {
    id: string;
    type: "close" | "sl" | "tp";
}

interface OstiumPositionsListProps {
    parsedPositions: ParsedOstiumPosition[];
    positionsLoading: boolean;
    safeAddress: string;
    derivedNetwork: OstiumNetwork;
    positionDrafts: Record<string, PositionDraft>;
    setPositionDrafts: React.Dispatch<React.SetStateAction<Record<string, PositionDraft>>>;
    canManagePositions: boolean;
    rowActionLoading: RowActionLoading | null;
    refreshPositions: (force: boolean) => Promise<void>;
    runClosePosition: (position: ParsedOstiumPosition) => Promise<void>;
    runUpdatePriceGuard: (position: ParsedOstiumPosition, type: "sl" | "tp") => Promise<void>;
}

export function OstiumPositionsList({
    parsedPositions,
    positionsLoading,
    safeAddress,
    derivedNetwork,
    positionDrafts,
    setPositionDrafts,
    canManagePositions,
    rowActionLoading,
    // refreshPositions,
    runClosePosition,
    runUpdatePriceGuard,
}: OstiumPositionsListProps) {
    return (
        <SimpleCard className="overflow-hidden rounded-2xl border-white/6 bg-[#0a0a0e] p-0 hover:bg-[#0a0a0e] hover:border-white/8">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4">
                <div>
                    <Typography variant="h6" className="text-white font-semibold tracking-tight">
                        Open Positions
                    </Typography>
                    <Typography variant="caption" className="text-zinc-500 block mt-0.5">
                        Monitor and manage active positions
                    </Typography>
                </div>
            </div>

            <div className="h-px w-full bg-white/6" />

            {/* ── Content ── */}
            <div className="p-6">
                {/* Loading State */}
                {positionsLoading && parsedPositions.length === 0 && (
                    <SimpleCard className="flex items-center justify-center rounded-xl border-white/6 bg-white/2 py-10 hover:bg-white/2 hover:border-white/6">
                        <div className="flex items-center gap-3 text-zinc-500">
                            <LuLoader className="h-4 w-4 animate-spin" />
                            <Typography variant="bodySmall" className="text-zinc-500">
                                Loading positions…
                            </Typography>
                        </div>
                    </SimpleCard>
                )}

                {/* Empty State */}
                {!positionsLoading && parsedPositions.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/8 py-14 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/4">
                            <LuShield className="h-5 w-5 text-zinc-600" />
                        </div>
                        <Typography variant="bodySmall" className="text-zinc-500">
                            No positions found for{" "}
                            <span className="font-mono text-zinc-400">{formatAddress(safeAddress)}</span>{" "}
                            on {OSTIUM_NETWORK_LABELS[derivedNetwork]}
                        </Typography>
                    </div>
                )}

                {/* ── Position Cards ── */}
                <div className="space-y-3">
                    {parsedPositions.map((position) => {
                        const draft = positionDrafts[position.id] || { slPrice: "", tpPrice: "" };
                        const isCloseLoading =
                            rowActionLoading?.id === position.id && rowActionLoading.type === "close";
                        const isSlLoading =
                            rowActionLoading?.id === position.id && rowActionLoading.type === "sl";
                        const isTpLoading =
                            rowActionLoading?.id === position.id && rowActionLoading.type === "tp";
                        const hasExecutableIds =
                            position.pairId !== null && position.tradeIndex !== null;
                        const pnlIsNegative = position.pnl.trim().startsWith("-");
                        const pnlColorClass =
                            position.pnl !== "-"
                                ? pnlIsNegative
                                    ? "text-red-400"
                                    : "text-emerald-400"
                                : "text-zinc-400";

                        return (
                            <SimpleCard
                                key={position.id}
                                className="rounded-xl border-white/6 bg-white/8 p-0 hover:bg-white/4 hover:border-white/6"
                            >
                                {/* ── Card Header ── */}
                                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                                    <div>
                                        <Typography variant="bodySmall" className="font-semibold text-white">
                                            {position.marketLabel}
                                        </Typography>
                                        <Typography variant="caption" className="text-zinc-600 ml-3" as="span">
                                            #{position.pairId ?? "–"} · idx {position.tradeIndex ?? "–"}
                                        </Typography>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${position.side === "LONG"
                                                ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                                : position.side === "SHORT"
                                                    ? "border border-red-500/20 bg-red-500/10 text-red-400"
                                                    : "border border-white/10 bg-white/5 text-zinc-400"
                                            }`}
                                    >
                                        {position.side === "LONG" ? (
                                            <LuCircleArrowUp className="h-3.5 w-3.5" />
                                        ) : position.side === "SHORT" ? (
                                            <LuCircleArrowDown className="h-3.5 w-3.5" />
                                        ) : (
                                            <LuShield className="h-3.5 w-3.5" />
                                        )}
                                        {position.side}
                                    </span>
                                </div>

                                {/* ── Metrics Grid ── */}
                                <div className="mx-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-white/4 md:grid-cols-4">
                                    <div className="bg-[#0a0a0e] p-3">
                                        <Typography variant="caption" className="font-medium uppercase tracking-wider text-zinc-600 block">
                                            Collateral
                                        </Typography>
                                        <Typography variant="bodySmall" className="mt-0.5 font-semibold text-white">
                                            {position.collateral}
                                        </Typography>
                                    </div>
                                    <div className="bg-[#0a0a0e] p-3">
                                        <Typography variant="caption" className="font-medium uppercase tracking-wider text-zinc-600 block">
                                            Leverage
                                        </Typography>
                                        <Typography variant="bodySmall" className="mt-0.5 font-semibold text-white">
                                            {position.leverage}
                                        </Typography>
                                    </div>
                                    <div className="bg-[#0a0a0e] p-3">
                                        <Typography variant="caption" className="font-medium uppercase tracking-wider text-zinc-600 block">
                                            Entry Price
                                        </Typography>
                                        <Typography variant="bodySmall" className="mt-0.5 font-semibold text-white">
                                            {position.entryPrice}
                                        </Typography>
                                    </div>
                                    <div className="bg-[#0a0a0e] p-3">
                                        <Typography variant="caption" className="font-medium uppercase tracking-wider text-zinc-600 block">
                                            PnL
                                        </Typography>
                                        <Typography variant="bodySmall" className={`mt-0.5 font-bold ${pnlColorClass}`}>
                                            {position.pnl}
                                        </Typography>
                                    </div>
                                </div>

                                {/* Missing IDs Warning */}
                                {!hasExecutableIds && (
                                    <SimpleCard className="mx-5 mt-3 rounded-lg border-amber-500/15 bg-amber-500/5 p-2.5 hover:bg-amber-500/5 hover:border-amber-500/15">
                                        <Typography variant="caption" className="text-amber-400/80">
                                            Missing pairId / tradeIndex — use workflow node with explicit IDs.
                                        </Typography>
                                    </SimpleCard>
                                )}

                                {/* ── Action Zone ── */}
                                <div className="m-5 mt-3 rounded-xl border border-white/4 bg-white/2 p-4">
                                    <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-12">
                                        {/* Close Position */}
                                        <div className="lg:col-span-3">
                                            <Button
                                                variant="delete"
                                                border
                                                className="h-10 w-full rounded-lg border text-sm"
                                                onClick={() => void runClosePosition(position)}
                                                disabled={!canManagePositions || !hasExecutableIds || isCloseLoading}
                                            >
                                                {isCloseLoading ? (
                                                    <LuLoader className="h-4 w-4 animate-spin" />
                                                ) : null}
                                                {isCloseLoading ? "Closing..." : "Close"}
                                            </Button>
                                        </div>

                                        {/* SL Input */}
                                        <div className="lg:col-span-3">
                                            <Input
                                                value={draft.slPrice}
                                                onChange={(e) =>
                                                    setPositionDrafts((prev) => ({
                                                        ...prev,
                                                        [position.id]: {
                                                            slPrice: e.target.value,
                                                            tpPrice: prev[position.id]?.tpPrice || "",
                                                        },
                                                    }))
                                                }
                                                placeholder={`SL (${position.currentSl})`}
                                                className="h-10 bg-white/3 border-orange-300/20 hover:border-orange-500 rounded-lg"
                                            />
                                        </div>

                                        {/* SL Button */}
                                        <div className="lg:col-span-2">
                                            <Button
                                                border
                                                borderColor="rgba(245,158,11,0.7)"
                                                className="h-10 w-full rounded-lg border text-sm"
                                                onClick={() => void runUpdatePriceGuard(position, "sl")}
                                                disabled={!canManagePositions || !hasExecutableIds || isSlLoading}
                                            >
                                                {isSlLoading ? (
                                                    <LuLoader className="h-4 w-4 animate-spin" />
                                                ) : null}
                                                Set SL
                                            </Button>
                                        </div>

                                        {/* TP Input */}
                                        <div className="lg:col-span-2">
                                            <Input
                                                value={draft.tpPrice}
                                                onChange={(e) =>
                                                    setPositionDrafts((prev) => ({
                                                        ...prev,
                                                        [position.id]: {
                                                            slPrice: prev[position.id]?.slPrice || "",
                                                            tpPrice: e.target.value,
                                                        },
                                                    }))
                                                }
                                                placeholder={`TP (${position.currentTp})`}
                                                className="h-10 bg-white/3 border-blue-300/20 hover:border-blue-500 rounded-lg"
                                            />
                                        </div>

                                        {/* TP Button */}
                                        <div className="lg:col-span-2">
                                            <Button
                                                border
                                                borderColor="rgba(96,165,250,0.7)"
                                                className="h-10 w-full rounded-lg border text-sm"
                                                onClick={() => void runUpdatePriceGuard(position, "tp")}
                                                disabled={!canManagePositions || !hasExecutableIds || isTpLoading}
                                            >
                                                {isTpLoading ? (
                                                    <LuLoader className="h-4 w-4 animate-spin" />
                                                ) : null}
                                                Set TP
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </SimpleCard>
                        );
                    })}
                </div>
            </div>
        </SimpleCard>
    );
}
