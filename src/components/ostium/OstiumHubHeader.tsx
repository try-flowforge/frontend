"use client";

import Link from "next/link";
import {
    LuArrowLeft,
    LuLoader,
    LuRefreshCw,
    LuShield,
    LuWallet,
    LuGlobe,
    LuActivity,
    LuZap,
} from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { CopyButton } from "@/components/ui/CopyButton";
import {
    OSTIUM_NETWORK_LABELS,
    type OstiumNetwork,
    formatNumber,
    formatAddress,
} from "@/types/ostium";

interface OstiumHubHeaderProps {
    derivedNetwork: OstiumNetwork;
    safeAddress: string;
    authenticated: boolean;
    hubLoading: boolean;
    readinessDoneCount: number;
    readinessTotalCount: number;
    parsedPositionsCount: number;
    safeUsdcBalance: string;
    delegateGasBalance: string;
    refreshHub: (force: boolean) => Promise<void>;
    login: () => void;
}

export function OstiumHubHeader({
    derivedNetwork,
    safeAddress,
    authenticated,
    hubLoading,
    readinessDoneCount,
    readinessTotalCount,
    parsedPositionsCount,
    safeUsdcBalance,
    delegateGasBalance,
    refreshHub,
    login,
}: OstiumHubHeaderProps) {
    return (
        <>
            <SimpleCard className="relative overflow-hidden rounded-2xl border-white/6 bg-[#0a0a0e] p-0 hover:bg-[#0a0a0e] hover:border-white/8">
                {/* Ambient radial decorations */}
                <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-orange-500/7 blur-[80px]" />
                <div className="pointer-events-none absolute -bottom-32 -right-32 h-56 w-56 rounded-full bg-orange-600/4 blur-[80px]" />

                <div className="relative px-6 py-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        {/* Left: Branding + Meta */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20">
                                    <LuShield className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <Typography variant="h4" className="bg-linear-to-r from-white to-white/70 bg-clip-text text-transparent font-bold tracking-tight">
                                        Ostium Perpetual Trading
                                    </Typography>
                                    <Typography variant="caption" className="text-zinc-500">
                                        Manage delegation, readiness, positions &amp; trade actions
                                    </Typography>
                                </div>
                            </div>

                            {/* Info Pills */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/8 px-3.5 py-1.5 text-xs font-medium text-orange-300">
                                    <LuGlobe className="h-3.5 w-3.5" />
                                    {OSTIUM_NETWORK_LABELS[derivedNetwork]}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/4 pl-3.5 pr-2 py-1.5 text-xs text-zinc-400">
                                    <LuWallet className="h-3.5 w-3.5" />
                                    <span className="font-mono text-zinc-300">{formatAddress(safeAddress)}</span>
                                    {safeAddress && <CopyButton text={safeAddress} size="sm" />}
                                </span>
                            </div>
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex shrink-0 items-center gap-3">
                            <Link href="/automation-builder">
                                <Button border borderColor="rgba(255,255,255,0.45)">
                                    <LuArrowLeft className="h-4 w-4" />
                                    Back to Builder
                                </Button>
                            </Link>
                            <Button
                                onClick={() => void refreshHub(true)}
                                disabled={!authenticated || hubLoading}
                            >
                                {hubLoading ? (
                                    <LuLoader className="h-4 w-4 animate-spin" />
                                ) : (
                                    <LuRefreshCw className="h-4 w-4" />
                                )}
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </SimpleCard>

            {authenticated && (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {/* Setup Progress */}
                    <SimpleCard className="group flex items-center gap-3 rounded-xl border-white/6 bg-[#0a0a0e] p-4 hover:border-white/12 hover:bg-white/3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/8 text-orange-400">
                            <LuShield className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <Typography variant="caption" className="font-medium uppercase tracking-wider text-zinc-500 block">
                                Setup
                            </Typography>
                            <Typography variant="bodySmall" className="font-bold text-white">
                                {readinessDoneCount}/{readinessTotalCount || 5}
                            </Typography>
                        </div>
                    </SimpleCard>

                    {/* Open Positions */}
                    <SimpleCard className="group flex items-center gap-3 rounded-xl border-white/6 bg-[#0a0a0e] p-4 hover:border-white/12 hover:bg-white/3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/8 text-orange-400">
                            <LuActivity className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <Typography variant="caption" className="font-medium uppercase tracking-wider text-zinc-500 block">
                                Positions
                            </Typography>
                            <Typography variant="bodySmall" className="font-bold text-white">
                                {parsedPositionsCount}
                            </Typography>
                        </div>
                    </SimpleCard>

                    {/* USDC Balance */}
                    <SimpleCard className="group flex items-center gap-3 rounded-xl border-white/6 bg-[#0a0a0e] p-4 hover:border-white/12 hover:bg-white/3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/8 text-orange-400">
                            <LuWallet className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <Typography variant="caption" className="font-medium uppercase tracking-wider text-zinc-500 block">
                                USDC
                            </Typography>
                            <Typography variant="bodySmall" className="font-bold text-white truncate">
                                {formatNumber(safeUsdcBalance, 4)}
                            </Typography>
                        </div>
                    </SimpleCard>

                    {/* Delegate Gas */}
                    <SimpleCard className="group flex items-center gap-3 rounded-xl border-white/6 bg-[#0a0a0e] p-4 hover:border-white/12 hover:bg-white/3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/8 text-orange-400">
                            <LuZap className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <Typography variant="caption" className="font-medium uppercase tracking-wider text-zinc-500 block">
                                Gas
                            </Typography>
                            <Typography variant="bodySmall" className="font-bold text-white truncate">
                                {formatNumber(delegateGasBalance, 6)}
                            </Typography>
                        </div>
                    </SimpleCard>
                </div>
            )}

            {!authenticated && (
                <div className="flex flex-col items-center justify-center py-28 text-center">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 scale-150 rounded-3xl bg-orange-500/20 blur-3xl" />
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-linear-to-br from-orange-500 to-amber-600 shadow-2xl shadow-orange-500/25">
                            <LuShield className="h-12 w-12 text-white" />
                        </div>
                    </div>
                    <Typography variant="h3" className="mb-3 bg-linear-to-r from-white to-white/70 bg-clip-text text-transparent font-bold tracking-tight">
                        Connect Your Wallet
                    </Typography>
                    <Typography variant="body" className="mb-10 max-w-md text-zinc-500">
                        Connect your wallet to manage Safe delegation, monitor open
                        positions, and execute trade actions on Ostium.
                    </Typography>
                    <div className="animate-glow-orange rounded-full">
                        <Button onClick={login} className="h-14 px-10 text-base">
                            Connect Wallet
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
