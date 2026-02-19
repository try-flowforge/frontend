"use client";

import { useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { BiLogInCircle } from "react-icons/bi";
import {
  LuBot,
  LuCheck,
  LuChevronRight,
  LuLock,
  LuWallet,
} from "react-icons/lu";
import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Button } from "@/components/ui/Button";
import { WalletNodeConfiguration } from "@/blocks/configs/wallet/WalletNodeConfiguration";
import { TelegramNodeConfiguration } from "@/blocks/configs/social/telegram/TelegramNodeConfiguration";

type OnboardingStep = 1 | 2;

export default function AgentOnboardingPageClient() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  const linkedWallets = useMemo(
    () => wallets.filter((w) => w.linked || w.walletClientType === "privy"),
    [wallets],
  );
  const primaryWallet = useMemo(
    () =>
      linkedWallets.find((w) => w.walletClientType !== "privy") ||
      linkedWallets.find((w) => w.walletClientType === "privy"),
    [linkedWallets],
  );
  const isSignedIn = authenticated;
  const hasLinkedWallet = primaryWallet !== undefined;
  const isWalletConnected = isSignedIn && hasLinkedWallet;

  const [telegramNodeData, setTelegramNodeData] = useState<Record<string, unknown>>(
    () => ({ id: "agent-onboarding-telegram", telegramMessage: "" }),
  );

  const [step, setStep] = useState<OnboardingStep>(1);

  const steps = useMemo(
    () =>
      [
        {
          id: 1 as const,
          title: "Connect wallet",
          description: "Login / signup and complete Safe onboarding",
          icon: LuWallet,
          isComplete: isWalletConnected,
          isLocked: false,
        },
        {
          id: 2 as const,
          title: "Connect Telegram",
          description: "Link a chat to interact with the agent",
          icon: LuBot,
          isComplete: false,
          isLocked: !isWalletConnected,
        },
      ] as const,
    [isWalletConnected],
  );

  const activeStep = steps.find((s) => s.id === step) ?? steps[0];

  return (
    <div className="space-y-6">
      <div className="p-6 sm:p-7">
        <Typography variant="h1" className="text-foreground" align="center">
          Onboarding
        </Typography>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-3">
          <SimpleCard className="p-4 rounded-2xl border-white/10">
            <div className="space-y-3">
              <Typography variant="bodySmall" className="font-semibold text-foreground">
                Steps
              </Typography>


              {steps.map((s) => {
                const Icon = s.icon;
                const isActive = s.id === step;
                const disabled = s.isLocked;

                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setStep(s.id)}
                    className={[
                      "w-full text-left rounded-xl transition-colors",
                      "px-3 py-2.5 flex items-start gap-3",
                      disabled
                        ? "opacity-60 cursor-not-allowed bg-white/5"
                        : isActive
                          ? "bg-amber-500/10"
                          : "bg-white/5 hover:bg-white/10",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                        disabled
                          ? "bg-transparent border-white/10"
                          : isActive
                            ? "bg-amber-500/10 border-amber-500/30"
                            : "bg-transparent border-white/10",
                      ].join(" ")}
                    >
                      {s.isComplete ? (
                        <LuCheck className="h-5 w-5 text-green-400" aria-hidden />
                      ) : disabled ? (
                        <LuLock className="h-4.5 w-4.5 text-muted-foreground" aria-hidden />
                      ) : (
                        <Icon
                          className={[
                            "h-5 w-5",
                            isActive ? "text-amber-400" : "text-foreground",
                          ].join(" ")}
                          aria-hidden
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <Typography
                          variant="bodySmall"
                          className={[
                            "font-semibold leading-5",
                            disabled ? "text-muted-foreground" : "text-foreground",
                          ].join(" ")}
                        >
                          {s.title}
                        </Typography>
                        <span
                          className={[
                            "shrink-0 rounded-full border px-2 py-0.5 text-[11px] leading-4",
                            s.isComplete
                              ? "border-green-500/30 bg-green-500/10 text-green-300"
                              : disabled
                                ? "border-white/10 bg-white/5 text-muted-foreground"
                                : isActive
                                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                                  : "border-white/10 bg-white/5 text-muted-foreground",
                          ].join(" ")}
                        >
                          {s.isComplete ? "Done" : disabled ? "Locked" : isActive ? "Current" : "Pending"}
                        </span>
                      </div>
                      <Typography variant="caption" className="text-muted-foreground mt-0.5 block">
                        {s.description}
                      </Typography>
                    </div>
                  </button>
                );
              })}

            </div>
          </SimpleCard>
        </div>

        <div className="min-w-0 bg-background">
          <div className="space-y-4">
            <div className="space-y-3 border-b border-white/10 pb-3">
              <div className="flex items-center justify-between gap-3">
                <Typography variant="caption" className="text-muted-foreground">
                  Step {step} of 2
                </Typography>
                {activeStep.id === 1 && isWalletConnected && (
                  <Button onClick={() => setStep(2)}>
                    Next
                    <LuChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                <Typography variant="h4" className="text-foreground">
                  {activeStep.id === 1 ? "Connect Wallet & Onboard" : "Connect Telegram"}
                </Typography>
                <Typography variant="caption" className="text-muted-foreground block">
                  {activeStep.id === 1
                    ? "Create/enable your Safe setup to power secure executions."
                    : "Verify and connect a Telegram chat for direct agent interaction."}
                </Typography>
              </div>
            </div>

              {step === 1 ? (
                !isSignedIn ? (
                  <SimpleCard className="p-6 rounded-2xl border-white/10">
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10">
                        <LuWallet className="h-5 w-5 text-foreground" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <Typography variant="bodySmall" className="font-semibold text-foreground">
                          Sign in to begin
                        </Typography>
                        <Typography variant="caption" className="text-muted-foreground">
                          Sign in to create your account or continue your Safe onboarding and wallet setup.
                        </Typography>
                        <div className="pt-2">
                          <Button
                            disabled={!ready}
                            onClick={() => login({ loginMethods: ["email"] })}
                          >
                            <BiLogInCircle className="w-4 h-4" />
                            <span>Sign In</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </SimpleCard>
                ) : (
                  <div className="space-y-4">
                    <WalletNodeConfiguration />
                  </div>
                )
              ) : !isSignedIn ? (
                <SimpleCard className="p-6 rounded-2xl border-white/10">
                  <Typography variant="caption" className="text-muted-foreground mt-1 block">
                    Sign in to continue. Telegram linking uses your authenticated session.
                  </Typography>
                  <div className="pt-3">
                    <Button
                      disabled={!ready}
                      onClick={() => {
                        setStep(1);
                        login({ loginMethods: ["email"] });
                      }}
                    >
                      <BiLogInCircle className="w-4 h-4" />
                      <span>Sign In</span>
                    </Button>
                  </div>
                </SimpleCard>
              ) : !hasLinkedWallet ? (
                <SimpleCard className="p-6 rounded-2xl border-white/10">
                  <Typography variant="bodySmall" className="font-semibold text-foreground">
                    Wallet connection required
                  </Typography>
                  <Typography variant="caption" className="text-muted-foreground mt-1 block">
                    Connect your wallet in Step 1 before linking Telegram.
                  </Typography>
                  <div className="pt-3">
                    <Button onClick={() => setStep(1)}>
                      Go to Step 1
                      <LuChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </SimpleCard>
              ) : (
                <TelegramNodeConfiguration
                  nodeData={telegramNodeData}
                  handleDataChange={(updates) =>
                    setTelegramNodeData((prev) => ({ ...prev, ...updates }))
                  }
                  authenticated={authenticated}
                  login={() => login({ loginMethods: ["email"] })}
                />
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

