"use client";

import Link from "next/link";
import {
    LuArrowLeft,
    LuLoader,
    LuRefreshCw,
    LuShield,
    LuWallet,
    LuGlobe,
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
            <SimpleCard className="rounded-2xl border-white/15 bg-white/[0.04] p-0 hover:bg-white/[0.04] hover:border-white/15">
                <div className="border-b border-white/10 bg-gradient-to-r from-orange-500/20 via-orange-500/5 to-transparent px-5 py-5 sm:px-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                                    <LuShield className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <Typography variant="h4" className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent font-bold tracking-tight">
                                        Ostium Perpectual Trading
                                    </Typography>
                                    <Typography variant="bodySmall" className="text-white/60">
                                        Manage delegation, readiness, positions, and trade actions from one central console.
                                    </Typography>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300">
                                    <LuGlobe className="h-3.5 w-3.5" />
                                    {OSTIUM_NETWORK_LABELS[derivedNetwork]}
                                </div>
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 pl-3 pr-2 py-1.5 text-xs text-white/70 backdrop-blur-sm">
                                    <LuWallet className="h-3.5 w-3.5" />
                                    Wallet: <span className="font-mono text-white/90">{formatAddress(safeAddress)}</span>
                                    {safeAddress && <CopyButton text={safeAddress} size="sm" className="ml-0.5" />}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link href="/automation-builder">
                                <Button border borderColor="rgba(255, 255, 255, 0.6)">
                                    <LuArrowLeft className="h-5 w-5" />
                                    Back to Builder
                                </Button>
                            </Link>
                            <Button
                                onClick={() => void refreshHub(true)}
                                disabled={!authenticated || hubLoading}
                            >
                                {hubLoading ? (
                                    <LuLoader className="h-5 w-5 animate-spin" />
                                ) : (
                                    <LuRefreshCw className="h-5 w-5" />
                                )}
                                Refresh Hub
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:grid-cols-4 sm:px-6">
                    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                        <Typography variant="caption" className="text-white/60 uppercase tracking-wide block">
                            Setup
                        </Typography>
                        <Typography variant="bodySmall" className="text-white font-semibold">
                            {readinessDoneCount}/{readinessTotalCount || 5}
                        </Typography>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                        <Typography variant="caption" className="text-white/60 uppercase tracking-wide block">
                            Open Positions
                        </Typography>
                        <Typography variant="bodySmall" className="text-white font-semibold">
                            {parsedPositionsCount}
                        </Typography>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                        <Typography variant="caption" className="text-white/60 uppercase tracking-wide block">
                            USDC Amount
                        </Typography>
                        <Typography variant="bodySmall" className="text-white font-semibold">
                            {formatNumber(safeUsdcBalance, 4)}
                        </Typography>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                        <Typography variant="caption" className="text-white/60 uppercase tracking-wide block">
                            Delegate Gas
                        </Typography>
                        <Typography variant="bodySmall" className="text-white font-semibold">
                            {formatNumber(delegateGasBalance, 6)}
                        </Typography>
                    </div>
                </div>
            </SimpleCard>

            {!authenticated && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-[0_0_30px_rgba(249,115,22,0.4)]">
                        <LuShield className="h-10 w-10 text-white" />
                    </div>
                    <Typography variant="h3" className="mb-3 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent font-bold tracking-tight">
                        Authentication Required
                    </Typography>
                    <Typography variant="body" className="mb-8 max-w-lg text-white/60">
                        Please connect your wallet to manage Safe delegation, monitor open positions, and execute trade actions on Ostium.
                    </Typography>
                    <Button onClick={login} className="h-12 px-8 text-base">
                        Connect Wallet
                    </Button>
                </div>
            )}
        </>
    );
}
