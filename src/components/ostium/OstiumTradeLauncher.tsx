"use client";

import { LuCircleCheck, LuCircleAlert, LuLoader, LuTrendingUp, LuTrendingDown, LuShieldAlert } from "react-icons/lu";
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
        <SimpleCard className="rounded-2xl border-white/15 bg-white/[0.03] p-5 hover:bg-white/[0.03] hover:border-white/15">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <Typography variant="h6" className="text-foreground font-semibold">
                        Trade Launcher
                    </Typography>
                    <Typography variant="caption" className="text-white/65 block">
                        Open a new position using your connected Safe as trader account.
                    </Typography>
                </div>
                <div
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${canOpenPosition
                        ? "border-green-500/20 bg-green-500/10 text-green-300"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-200"
                        }`}
                >
                    {canOpenPosition ? (
                        <LuCircleCheck className="h-4 w-4" />
                    ) : (
                        <LuCircleAlert className="h-4 w-4" />
                    )}
                    {canOpenPosition ? "Ready to open" : "Setup required"}
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                    <Typography variant="caption" className="text-white/60 uppercase tracking-wide block">
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
                            className="h-10 bg-black/25 border-white/15 hover:bg-black/35"
                        />
                    ) : (
                        <Input
                            value={openPositionForm.market}
                            onChange={(e) =>
                                setOpenPositionForm((prev) => ({ ...prev, market: e.target.value }))
                            }
                            placeholder="Market symbol (e.g. BTC)"
                            className="h-10 bg-black/25 border-white/15 hover:bg-black/35"
                        />
                    )}
                </div>

                <div className="space-y-1">
                    <Typography variant="caption" className="text-white/60 uppercase tracking-wide block">
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
                        className="h-10 bg-black/25 border-white/15 hover:bg-black/35"
                    />
                </div>

                <div className="space-y-1">
                    <Typography variant="caption" className="text-white/60 uppercase tracking-wide block">
                        Collateral (USDC)
                    </Typography>
                    <Input
                        value={openPositionForm.collateral}
                        onChange={(e) =>
                            setOpenPositionForm((prev) => ({ ...prev, collateral: e.target.value }))
                        }
                        placeholder="100"
                        className="h-10 bg-black/25 border-white/15 hover:bg-black/35"
                    />
                </div>

                <div className="space-y-1">
                    <Typography variant="caption" className="text-white/60 uppercase tracking-wide block">
                        Leverage
                    </Typography>
                    <Input
                        value={openPositionForm.leverage}
                        onChange={(e) =>
                            setOpenPositionForm((prev) => ({ ...prev, leverage: e.target.value }))
                        }
                        placeholder="5"
                        className="h-10 bg-black/25 border-white/15 hover:bg-black/35"
                    />
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                    type="button"
                    className="h-10 px-6"
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
                    <button
                        type="button"
                        onClick={() => setIsSetupOpen(true)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/20"
                    >
                        <LuShieldAlert className="h-4 w-4" />
                        Complete Account Setup
                    </button>
                )}
            </div>
        </SimpleCard>
    );
}
