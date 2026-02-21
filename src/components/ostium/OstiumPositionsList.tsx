"use client";

import {
    LuCircleArrowDown,
    LuCircleArrowUp,
    LuLoader,
    LuRefreshCw,
    LuShield,
    LuShieldAlert,
    LuTrendingDown,
    LuTrendingUp,
} from "react-icons/lu";
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
    refreshPositions,
    runClosePosition,
    runUpdatePriceGuard,
}: OstiumPositionsListProps) {
    return (
        <SimpleCard className="rounded-2xl border-white/15 bg-white/[0.03] p-5 hover:bg-white/[0.03] hover:border-white/15">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <Typography variant="h6" className="text-foreground font-semibold">
                        Open Positions
                    </Typography>
                    <Typography variant="caption" className="text-white/65 block">
                        Monitor and manage active positions from your Safe wallet.
                    </Typography>
                </div>
                <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => void refreshPositions(true)}
                    disabled={positionsLoading}
                >
                    {positionsLoading ? (
                        <LuLoader className="h-4 w-4 animate-spin" />
                    ) : (
                        <LuRefreshCw className="h-4 w-4" />
                    )}
                    Refresh
                </button>
            </div>

            {positionsLoading && parsedPositions.length === 0 && (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
                    <Typography variant="caption" className="text-white/70">
                        Loading open positions...
                    </Typography>
                </div>
            )}

            {!positionsLoading && parsedPositions.length === 0 && (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
                    <Typography variant="caption" className="text-white/70">
                        No open positions found for {formatAddress(safeAddress)} on{" "}
                        {OSTIUM_NETWORK_LABELS[derivedNetwork]}.
                    </Typography>
                </div>
            )}

            <div className="mt-4 space-y-3">
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
                                ? "text-red-300"
                                : "text-green-300"
                            : "text-foreground";

                    return (
                        <div
                            key={position.id}
                            className="rounded-xl border border-white/10 bg-black/30 p-4"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <Typography variant="bodySmall" className="font-semibold text-foreground">
                                        {position.marketLabel}
                                    </Typography>
                                    <Typography variant="caption" className="text-white/60 block">
                                        Pair ID: {position.pairId ?? "-"} | Trade Index:{" "}
                                        {position.tradeIndex ?? "-"}
                                    </Typography>
                                </div>
                                <div
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${position.side === "LONG"
                                        ? "border-green-500/20 bg-green-500/10 text-green-300"
                                        : position.side === "SHORT"
                                            ? "border-red-500/20 bg-red-500/10 text-red-300"
                                            : "border-white/15 bg-white/10 text-white/80"
                                        }`}
                                >
                                    {position.side === "LONG" ? (
                                        <LuCircleArrowUp className="h-4 w-4" />
                                    ) : position.side === "SHORT" ? (
                                        <LuCircleArrowDown className="h-4 w-4" />
                                    ) : (
                                        <LuShield className="h-4 w-4" />
                                    )}
                                    {position.side}
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                                <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                                    <Typography variant="caption" className="text-white/55 block">
                                        Collateral
                                    </Typography>
                                    <Typography variant="bodySmall" className="text-foreground font-medium">
                                        {position.collateral}
                                    </Typography>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                                    <Typography variant="caption" className="text-white/55 block">
                                        Leverage
                                    </Typography>
                                    <Typography variant="bodySmall" className="text-foreground font-medium">
                                        {position.leverage}
                                    </Typography>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                                    <Typography variant="caption" className="text-white/55 block">
                                        Entry Price
                                    </Typography>
                                    <Typography variant="bodySmall" className="text-foreground font-medium">
                                        {position.entryPrice}
                                    </Typography>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                                    <Typography variant="caption" className="text-white/55 block">
                                        PnL
                                    </Typography>
                                    <Typography variant="bodySmall" className={`${pnlColorClass} font-medium`}>
                                        {position.pnl}
                                    </Typography>
                                </div>
                            </div>

                            {!hasExecutableIds && (
                                <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5">
                                    <Typography variant="caption" className="text-amber-200">
                                        This position payload does not include pairId/tradeIndex. Run actions from
                                        workflow node using explicit IDs.
                                    </Typography>
                                </div>
                            )}

                            <div className="mt-3 grid grid-cols-1 items-end gap-2 lg:grid-cols-12">
                                <div className="lg:col-span-3">
                                    <button
                                        type="button"
                                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                        onClick={() => void runClosePosition(position)}
                                        disabled={!canManagePositions || !hasExecutableIds || isCloseLoading}
                                    >
                                        {isCloseLoading ? (
                                            <LuLoader className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <LuShieldAlert className="h-4 w-4" />
                                        )}
                                        Close
                                    </button>
                                </div>

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
                                        className="h-10 bg-black/25 border-white/15 hover:bg-black/35"
                                    />
                                </div>

                                <div className="lg:col-span-2">
                                    <button
                                        type="button"
                                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                        onClick={() => void runUpdatePriceGuard(position, "sl")}
                                        disabled={!canManagePositions || !hasExecutableIds || isSlLoading}
                                    >
                                        {isSlLoading ? (
                                            <LuLoader className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <LuTrendingDown className="h-4 w-4" />
                                        )}
                                        Update SL
                                    </button>
                                </div>

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
                                        className="h-10 bg-black/25 border-white/15 hover:bg-black/35"
                                    />
                                </div>

                                <div className="lg:col-span-2">
                                    <button
                                        type="button"
                                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                        onClick={() => void runUpdatePriceGuard(position, "tp")}
                                        disabled={!canManagePositions || !hasExecutableIds || isTpLoading}
                                    >
                                        {isTpLoading ? (
                                            <LuLoader className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <LuTrendingUp className="h-4 w-4" />
                                        )}
                                        Update TP
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </SimpleCard>
    );
}
