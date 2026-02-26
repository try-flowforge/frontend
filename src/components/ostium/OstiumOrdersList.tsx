"use client";

import {
    LuClock,
    LuLoader,
    LuShield,
    LuTrash2,
} from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";
import {
    OSTIUM_ACTION_LABELS,
    type OstiumOrder,
    formatAddress,
} from "@/types/ostium";

interface OstiumOrdersListProps {
    orders: OstiumOrder[];
    loading: boolean;
    safeAddress: string;
    canManagePositions: boolean;
    refreshOrders: () => Promise<void>;
    cancelOrder: (orderId: string) => Promise<void>;
}

export function OstiumOrdersList({
    orders,
    loading,
    safeAddress,
    canManagePositions,
    cancelOrder,
}: OstiumOrdersListProps) {
    return (
        <SimpleCard className="overflow-hidden rounded-2xl border-white/6 bg-[#0a0a0e] p-0 hover:bg-[#0a0a0e] hover:border-white/8">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4">
                <div>
                    <Typography variant="h6" className="text-white font-semibold tracking-tight">
                        Pending Orders
                    </Typography>
                    <Typography variant="caption" className="text-zinc-500 block mt-0.5">
                        Manage your open Limit and Stop orders
                    </Typography>
                </div>
            </div>

            <div className="h-px w-full bg-white/6" />

            {/* ── Content ── */}
            <div className="p-6">
                {/* Loading State */}
                {loading && orders.length === 0 && (
                    <SimpleCard className="flex items-center justify-center rounded-xl border-white/6 bg-white/2 py-10">
                        <div className="flex items-center gap-3 text-zinc-500">
                            <LuLoader className="h-4 w-4 animate-spin" />
                            <Typography variant="bodySmall" className="text-zinc-500">
                                Loading orders…
                            </Typography>
                        </div>
                    </SimpleCard>
                )}

                {/* Empty State */}
                {!loading && orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/8 py-14 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/4">
                            <LuClock className="h-5 w-5 text-zinc-600" />
                        </div>
                        <Typography variant="bodySmall" className="text-zinc-500">
                            No pending orders found for{" "}
                            <span className="font-mono text-zinc-400">{formatAddress(safeAddress)}</span>
                        </Typography>
                    </div>
                )}

                {/* ── Order Cards ── */}
                <div className="space-y-3">
                    {orders.map((order) => {
                        return (
                            <SimpleCard
                                key={order.orderId}
                                className="rounded-xl border-white/6 bg-white/8 p-0 hover:bg-white/4 hover:border-white/6"
                            >
                                {/* Header */}
                                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <Typography variant="bodySmall" className="font-semibold text-white">
                                            {order.marketLabel}
                                        </Typography>
                                        <span
                                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${order.orderType === "limit"
                                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                                }`}
                                        >
                                            {order.orderType}
                                        </span>
                                    </div>
                                    <Button
                                        variant="delete"
                                        onClick={() => cancelOrder(order.orderId)}
                                        disabled={!canManagePositions}
                                        className="h-8 px-3 text-xs"
                                    >
                                        <LuTrash2 className="mr-1.5 h-3 w-3" />
                                        Cancel
                                    </Button>
                                </div>

                                {/* Metrics Grid */}
                                <div className="mx-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-white/4 md:grid-cols-4">
                                    <div className="bg-[#0a0a0e] p-3">
                                        <Typography variant="caption" className="font-medium uppercase tracking-wider text-zinc-600 block">
                                            Side
                                        </Typography>
                                        <Typography variant="bodySmall" className={`mt-0.5 font-semibold ${order.side === "long" ? "text-emerald-400" : "text-red-400"}`}>
                                            {order.side.toUpperCase()}
                                        </Typography>
                                    </div>
                                    <div className="bg-[#0a0a0e] p-3">
                                        <Typography variant="caption" className="font-medium uppercase tracking-wider text-zinc-600 block">
                                            Collateral
                                        </Typography>
                                        <Typography variant="bodySmall" className="mt-0.5 font-semibold text-white">
                                            {order.collateral}
                                        </Typography>
                                    </div>
                                    <div className="bg-[#0a0a0e] p-3">
                                        <Typography variant="caption" className="font-medium uppercase tracking-wider text-zinc-600 block">
                                            Leverage
                                        </Typography>
                                        <Typography variant="bodySmall" className="mt-0.5 font-semibold text-white">
                                            {order.leverage}
                                        </Typography>
                                    </div>
                                    <div className="bg-[#0a0a0e] p-3">
                                        <Typography variant="caption" className="font-medium uppercase tracking-wider text-zinc-600 block">
                                            Trigger Price
                                        </Typography>
                                        <Typography variant="bodySmall" className="mt-0.5 font-bold text-amber-400">
                                            {order.triggerPrice}
                                        </Typography>
                                    </div>
                                </div>

                                {/* Footer Info */}
                                <div className="px-5 py-3">
                                    <Typography variant="caption" className="text-zinc-500">
                                        Placed at {new Date(order.timestamp).toLocaleString()} · ID: {order.orderId.slice(0, 8)}...
                                    </Typography>
                                </div>
                            </SimpleCard>
                        );
                    })}
                </div>
            </div>
        </SimpleCard>
    );
}
