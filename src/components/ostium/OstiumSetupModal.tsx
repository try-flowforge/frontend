"use client";

import { useEffect, useMemo } from "react";
import {
    LuShield,
    LuShieldAlert,
    LuShieldCheck,
    LuCircleCheck,
    LuLoader,
    LuX,
} from "react-icons/lu";
import { Typography } from "@/components/ui/Typography";
import type { OstiumSetupOverview } from "@/types/ostium";
import type { EIP1193Provider } from "@privy-io/react-auth";

function getDelegationStatusVisual(status: string | null): {
    label: string;
    className: string;
    icon: React.ReactNode;
} {
    if (status === "ACTIVE") {
        return {
            label: "Active",
            className: "text-green-400 bg-green-500/10 border-green-500/30",
            icon: <LuShieldCheck className="w-4 h-4" />,
        };
    }
    if (status === "PENDING") {
        return {
            label: "Pending",
            className: "text-amber-400 bg-amber-500/10 border-amber-500/30",
            icon: <LuShield className="w-4 h-4" />,
        };
    }
    if (status === "REVOKED") {
        return {
            label: "Revoked",
            className: "text-zinc-300 bg-zinc-500/10 border-zinc-500/30",
            icon: <LuShieldAlert className="w-4 h-4" />,
        };
    }
    if (status === "FAILED") {
        return {
            label: "Failed",
            className: "text-red-400 bg-red-500/10 border-red-500/30",
            icon: <LuShieldAlert className="w-4 h-4" />,
        };
    }
    return {
        label: "Unknown",
        className: "text-zinc-300 bg-white/5 border-white/10",
        icon: <LuShield className="w-4 h-4" />,
    };
}

function getCheckVisual(ok: boolean): { className: string; label: string; icon: React.ReactNode } {
    if (ok) {
        return {
            className: "text-zinc-300",
            label: "Ready",
            icon: <LuCircleCheck className="w-4 h-4 text-green-400" />,
        };
    }
    return {
        className: "text-zinc-400",
        label: "Action Required",
        icon: <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />,
    };
}

export interface OstiumSetupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    overview: OstiumSetupOverview | null;
    delegationStatus: string | null;
    delegationActionLoading: "approve" | "revoke" | null;
    allowanceActionLoading: boolean;
    needsAllowance: boolean;
    ethereumProvider: EIP1193Provider | null;
    runDelegationFlow: (type: "approve" | "revoke") => Promise<void>;
    runAllowanceFlow: () => Promise<void>;
}

export function OstiumSetupModal({
    open,
    onOpenChange,
    overview,
    delegationStatus,
    delegationActionLoading,
    allowanceActionLoading,
    needsAllowance,
    ethereumProvider,
    runDelegationFlow,
    runAllowanceFlow,
}: OstiumSetupModalProps) {
    // Extract strictly the allowed steps from actionItems
    const filteredSteps = useMemo(() => {
        if (!overview) return [];
        // We strictly want: DELEGATION, SAFE_USDC_BALANCE, USDC_ALLOWANCE
        return overview.actionItems.filter(
            (item) =>
                item.id === "DELEGATION" ||
                item.id === "SAFE_USDC_BALANCE" ||
                item.id === "USDC_ALLOWANCE"
        );
    }, [overview]);

    const readinessDoneCount = filteredSteps.filter((item) => item.done).length;
    const readinessTotalCount = filteredSteps.length;
    const readinessProgressPercent =
        readinessTotalCount > 0 ? Math.round((readinessDoneCount / readinessTotalCount) * 100) : 0;

    // Prevent background scroll when modal is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    // Handle ESC key to close
    useEffect(() => {
        if (!open) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onOpenChange(false);
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all"
            role="dialog"
            aria-modal="true"
        >
            <div
                className="fixed inset-0"
                onClick={() => onOpenChange(false)}
                aria-hidden="true"
            />

            <div
                className="relative z-50 w-full max-w-lg mt-10 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Ribbon */}
                <div className="flex items-center justify-between border-b border-white-[0.05] px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/5">
                            <LuShield className="h-5 w-5 text-zinc-300" />
                        </div>
                        <div>
                            <Typography variant="body" className="font-medium text-zinc-100">
                                Trading Account Setup
                            </Typography>
                            <Typography variant="caption" className="text-zinc-500">
                                Initialize requirements ({readinessDoneCount}/{readinessTotalCount} complete)
                            </Typography>
                        </div>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
                    >
                        <LuX className="h-5 w-5" />
                    </button>
                </div>

                {/* Progress Bar (Minimal) */}
                <div className="h-[2px] w-full bg-zinc-900 border-b border-white/5">
                    <div
                        className="h-full bg-zinc-100 transition-all duration-500 ease-out"
                        style={{ width: `${readinessProgressPercent}%` }}
                    />
                </div>

                {/* Requirements List Sequence */}
                <div className="p-6 space-y-6">

                    {/* Step 1: Delegation */}
                    <div className="flex gap-4 items-start">
                        <div className="mt-1 flex-shrink-0">
                            {getCheckVisual(filteredSteps.find((s) => s.id === "DELEGATION")?.done || false).icon}
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                                <Typography variant="bodySmall" className="font-medium text-zinc-200">
                                    Transaction Delegation
                                </Typography>
                            </div>
                            <Typography variant="caption" className="block text-zinc-500 leading-relaxed pr-4">
                                Permits the backend relayer to execute actions on behalf of your Safe wallet securely.
                            </Typography>

                            <div className="pt-2">
                                {delegationStatus === "ACTIVE" ? (
                                    <button
                                        type="button"
                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-transparent px-4 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-red-400 disabled:opacity-50"
                                        onClick={() => void runDelegationFlow("revoke")}
                                        disabled={delegationActionLoading !== null || !ethereumProvider}
                                    >
                                        {delegationActionLoading === "revoke" ? (
                                            <LuLoader className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <LuShieldAlert className="h-3.5 w-3.5" />
                                        )}
                                        Revoke Delegation
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-100 px-5 text-xs font-semibold text-zinc-900 transition-all hover:bg-white disabled:opacity-50"
                                        onClick={() => void runDelegationFlow("approve")}
                                        disabled={delegationActionLoading !== null || !ethereumProvider}
                                    >
                                        {delegationActionLoading === "approve" && (
                                            <LuLoader className="h-3.5 w-3.5 animate-spin" />
                                        )}
                                        Enable Delegation
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="h-px w-full bg-zinc-900/80" />

                    {/* Step 2: Amount (Info Only) */}
                    <div className="flex gap-4 items-start">
                        <div className="mt-1 flex-shrink-0">
                            {getCheckVisual(filteredSteps.find((s) => s.id === "SAFE_USDC_BALANCE")?.done || false).icon}
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <Typography variant="bodySmall" className="font-medium text-zinc-200">
                                Required Collateral
                            </Typography>
                            <Typography variant="caption" className="block text-zinc-500 leading-relaxed">
                                Ensure your Safe wallet bears enough USDC to collateralize your requested positions before opening a trade.
                            </Typography>
                        </div>
                    </div>

                    <div className="h-px w-full bg-zinc-900/80" />

                    {/* Step 3: Allowance */}
                    <div className="flex gap-4 items-start">
                        <div className="mt-1 flex-shrink-0">
                            {getCheckVisual(filteredSteps.find((s) => s.id === "USDC_ALLOWANCE")?.done || false).icon}
                        </div>
                        <div className="flex-1 space-y-2">
                            <Typography variant="bodySmall" className="font-medium text-zinc-200">
                                USDC Spending Allowance
                            </Typography>
                            <Typography variant="caption" className="block text-zinc-500 leading-relaxed">
                                Permit the Ostium trading storage contract to withdraw USDC from your Safe balance.
                            </Typography>

                            <div className="pt-2">
                                <button
                                    type="button"
                                    className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-5 text-xs font-semibold transition-all disabled:opacity-50 ${needsAllowance ? "bg-zinc-100 text-zinc-900 hover:bg-white" : "border border-zinc-800 bg-transparent text-zinc-500 cursor-default"}`}
                                    onClick={() => void runAllowanceFlow()}
                                    disabled={allowanceActionLoading || !ethereumProvider || !needsAllowance}
                                >
                                    {allowanceActionLoading && (
                                        <LuLoader className="h-3.5 w-3.5 animate-spin" />
                                    )}
                                    {needsAllowance ? "Grant Allowance" : "Allowance Active"}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
