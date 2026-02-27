"use client";

import { LuCircleCheck, LuCircleAlert, LuLoader, LuTrendingUp, LuTrendingDown } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { Input } from "@/components/ui/Input";
import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";

interface OstiumTradeLauncherProps {
    canOpenPosition: boolean;
    marketOptions: { value: string; label: string }[];
    openPositionForm: { market: string; side: "long" | "short"; collateral: string; leverage: string };
    setOpenPositionForm: React.Dispatch<React.SetStateAction<{ market: string; side: "long" | "short"; collateral: string; leverage: string }>>;
    runOpenPosition: () => Promise<void>;
    canSubmitOpenPosition: boolean;
    openPositionLoading: boolean;
    setIsSetupOpen: (open: boolean) => void;
}

export function OstiumTradeLauncher({
    canOpenPosition,
    marketOptions,
    openPositionForm,
    setOpenPositionForm,
    runOpenPosition,
    canSubmitOpenPosition,
    openPositionLoading,
    setIsSetupOpen,
}: OstiumTradeLauncherProps) {
    return (
        <SimpleCard className="overflow-hidden rounded-2xl border-white/6 bg-[#0a0a0e] p-0 hover:bg-[#0a0a0e] hover:border-white/8">
            {/* ── Card Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4">
                <div>
                    <Typography variant="h6" className="text-white font-semibold tracking-tight">
                        Trade Launcher
                    </Typography>
                    <Typography variant="caption" className="text-zinc-500 block mt-0.5">
                        Open a new position using your Safe as trader account
                    </Typography>
                </div>
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${canOpenPosition
                        ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-400"
                        : "border-amber-500/20 bg-amber-500/8 text-amber-400"
                        }`}
                >
                    {canOpenPosition ? (
                        <LuCircleCheck className="h-3.5 w-3.5" />
                    ) : (
                        <LuCircleAlert className="h-3.5 w-3.5" />
                    )}
                    {canOpenPosition ? "Ready" : "Setup required"}
                </span>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-white/6" />

            {/* ── Form Grid ── */}
            <div className="p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Market */}
                    <div className="space-y-1.5">
                        <Typography variant="caption" className="font-medium uppercase tracking-wider text-zinc-500 block">
                            Market
                        </Typography>
                        {marketOptions.length > 0 ? (
                            <Dropdown
                                value={openPositionForm.market}
                                onChange={(e) =>
                                    setOpenPositionForm((prev) => ({ ...prev, market: e.target.value }))
                                }
                                options={marketOptions}
                                placeholder="Select market"
                                className="h-11 bg-white/3 border-white/8 hover:border-white/14 rounded-lg"
                            />
                        ) : (
                            <Input
                                value={openPositionForm.market}
                                onChange={(e) =>
                                    setOpenPositionForm((prev) => ({ ...prev, market: e.target.value }))
                                }
                                placeholder="Market symbol (e.g. BTC)"
                                className="h-11 bg-white/3 border-white/8 hover:border-white/14 rounded-lg"
                            />
                        )}
                    </div>

                    {/* Side */}
                    <div className="space-y-1.5">
                        <Typography variant="caption" className="font-medium uppercase tracking-wider text-zinc-500 block">
                            Side
                        </Typography>
                        <Dropdown
                            value={openPositionForm.side}
                            onChange={(e) =>
                                setOpenPositionForm((prev) => ({
                                    ...prev,
                                    side: e.target.value === "short" ? "short" : "long",
                                }))
                            }
                            options={[
                                { value: "long", label: "Long" },
                                { value: "short", label: "Short" },
                            ]}
                            placeholder="Select side"
                            className="h-11 bg-white/3 border-white/8 hover:border-white/14 rounded-lg"
                        />
                    </div>

                    {/* Collateral */}
                    <div className="space-y-1.5">
                        <Typography variant="caption" className="font-medium uppercase tracking-wider text-zinc-500 block">
                            Collateral (USDC)
                        </Typography>
                        <Input
                            value={openPositionForm.collateral}
                            onChange={(e) =>
                                setOpenPositionForm((prev) => ({ ...prev, collateral: e.target.value }))
                            }
                            placeholder="100"
                            className="h-11 bg-white/3 border-white/8 hover:border-white/14 rounded-lg"
                        />
                    </div>

                    {/* Leverage */}
                    <div className="space-y-1.5">
                        <Typography variant="caption" className="font-medium uppercase tracking-wider text-zinc-500 block">
                            Leverage
                        </Typography>
                        <Input
                            value={openPositionForm.leverage}
                            onChange={(e) =>
                                setOpenPositionForm((prev) => ({ ...prev, leverage: e.target.value }))
                            }
                            placeholder="5"
                            className="h-11 bg-white/3 border-white/8 hover:border-white/14 rounded-lg"
                        />
                    </div>
                </div>

                {/* ── Actions ── */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Button
                        type="button"
                        className="h-11 px-7"
                        onClick={() => void runOpenPosition()}
                        disabled={!canSubmitOpenPosition || openPositionLoading}
                    >
                        {openPositionLoading ? (
                            <LuLoader className="h-4 w-4 animate-spin" />
                        ) : openPositionForm.side === "short" ? (
                            <LuTrendingDown className="h-4 w-4" />
                        ) : (
                            <LuTrendingUp className="h-4 w-4" />
                        )}
                        Open Position
                    </Button>
                    {!canOpenPosition && (
                        <Button
                            border
                            borderColor="rgba(245,158,11,0.7)"
                            className="h-11"
                            onClick={() => setIsSetupOpen(true)}
                        >
                            Complete Setup
                        </Button>
                    )}
                </div>
            </div>
        </SimpleCard>
    );
}
