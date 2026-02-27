"use client";

import { useEffect, useMemo } from "react";
import {
    LuShield,
    LuShieldAlert,
    LuCircleCheck,
    LuLoader,
    LuX,
} from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import type { OstiumSetupOverview } from "@/types/ostium";

function getCheckVisual(ok: boolean): { className: string; label: string; icon: React.ReactNode } {
    if (ok) {
        return {
            className: "text-zinc-300",
            label: "Ready",
            icon: <LuCircleCheck className="w-4 h-4 text-emerald-400" />,
        };
    }
    return {
        className: "text-zinc-400",
        label: "Action Required",
        icon: <div className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse" />,
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
    ethereumProvider: {
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
        on?: (event: string, handler: (...args: unknown[]) => void) => void;
        removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    } | null;
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md transition-all"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop click to close */}
            <div
                className="fixed inset-0"
                onClick={() => onOpenChange(false)}
                aria-hidden="true"
            />

            {/* ── Modal Card ── */}
            <div
                className="relative z-50 w-full max-w-lg mx-4 overflow-hidden rounded-2xl border border-white/8 bg-[#0a0a0e] shadow-2xl shadow-orange-500/6 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-orange-500/20 to-amber-600/20 border border-orange-500/10">
                            <LuShield className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                            <Typography variant="body" className="font-semibold text-white">
                                Trading Account Setup
                            </Typography>
                            <Typography variant="caption" className="text-zinc-500">
                                {readinessDoneCount}/{readinessTotalCount} requirements complete
                            </Typography>
                        </div>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/6 hover:text-zinc-300"
                    >
                        <LuX className="h-4 w-4" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-[2px] w-full bg-white/4">
                    <div
                        className="h-full bg-linear-to-r from-orange-500 to-amber-500 transition-all duration-700 ease-out"
                        style={{ width: `${readinessProgressPercent}%` }}
                    />
                </div>

                {/* ── Requirements Steps ── */}
                <div className="p-6 space-y-0">

                    {/* Step 1: Delegation */}
                    <div className="flex gap-4 items-start">
                        <div className="mt-1 shrink-0">
                            {getCheckVisual(filteredSteps.find((s) => s.id === "DELEGATION")?.done || false).icon}
                        </div>
                        <div className="flex-1 space-y-2">
                            <div>
                                <Typography variant="bodySmall" className="font-medium text-zinc-200">
                                    Transaction Delegation
                                </Typography>
                                <Typography variant="caption" className="block mt-1 text-zinc-500 leading-relaxed">
                                    Permits the backend relayer to execute actions on behalf of your Safe wallet securely.
                                </Typography>
                            </div>

                            <div className="pt-1">
                                {delegationStatus === "ACTIVE" ? (
                                    <Button
                                        border
                                        borderColor="rgba(161,161,170,0.5)"
                                        className="h-8 rounded-lg px-3.5 text-xs"
                                        onClick={() => void runDelegationFlow("revoke")}
                                        disabled={delegationActionLoading !== null || !ethereumProvider}
                                    >
                                        {delegationActionLoading === "revoke" ? (
                                            <LuLoader className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <LuShieldAlert className="h-3.5 w-3.5" />
                                        )}
                                        Revoke Delegation
                                    </Button>
                                ) : (
                                    <button
                                        type="button"
                                        className="cursor-pointer inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-white px-5 text-xs font-semibold text-zinc-900 transition-all hover:bg-zinc-100 disabled:opacity-50"
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

                    <div className="h-px w-full bg-white/4" />

                    {/* Step 2: USDC Balance (Info Only) */}
                    <div className="flex gap-4 items-start py-5">
                        <div className="mt-0.5 shrink-0">
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

                    <div className="h-px w-full bg-white/4" />

                    {/* Step 3: Allowance */}
                    <div className="flex gap-4 items-start py-5 last:pb-0">
                        <div className="mt-0.5 shrink-0">
                            {getCheckVisual(filteredSteps.find((s) => s.id === "USDC_ALLOWANCE")?.done || false).icon}
                        </div>
                        <div className="flex-1 space-y-2">
                            <div>
                                <Typography variant="bodySmall" className="font-medium text-zinc-200">
                                    USDC Spending Allowance
                                </Typography>
                                <Typography variant="caption" className="block mt-1 text-zinc-500 leading-relaxed">
                                    Permit the Ostium trading storage contract to withdraw USDC from your Safe balance.
                                </Typography>
                            </div>

                            <div className="pt-1">
                                <button
                                    type="button"
                                    className={`inline-flex h-8 items-center justify-center gap-2 rounded-lg px-5 text-xs font-semibold transition-all disabled:opacity-50 ${needsAllowance
                                        ? "cursor-pointer bg-white text-zinc-900 hover:bg-zinc-100"
                                        : "border border-white/6 bg-transparent text-zinc-600 cursor-default"
                                        }`}
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
