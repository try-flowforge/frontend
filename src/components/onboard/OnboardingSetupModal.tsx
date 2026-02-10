"use client";

import React, { useEffect, useRef } from "react";
import {
    useOnboarding,
    OnboardingStepStatus,
    ChainProgress,
    ChainConfig,
} from "@/context/OnboardingContext";
import { usePrivy } from "@privy-io/react-auth";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { CHAIN_IDS } from "@/web3/chains";
import { TbFidgetSpinner } from "react-icons/tb";
import {
    FaCheckCircle,
    FaTimesCircle,
    FaSync,
    FaShieldAlt,
    FaPen,
} from "react-icons/fa";
import { Button } from "@/components/ui/Button";

interface StepIndicatorProps {
    label: string;
    status: OnboardingStepStatus;
    isSigningStep?: boolean;
    isSigning?: boolean;
}

interface ChainProgressCardProps {
    chain: ChainConfig;
    progress: ChainProgress;
    isSigning: boolean;
    onRetry: () => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
    label,
    status,
    isSigningStep,
    isSigning,
}) => {
    const getIcon = () => {
        switch (status) {
            case "idle":
                return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />;
            case "pending":
                return <TbFidgetSpinner className="w-5 h-5 text-primary animate-spin" />;
            case "success":
                return <FaCheckCircle className="w-5 h-5 text-green-400" />;
            case "error":
                return <FaTimesCircle className="w-5 h-5 text-destructive" />;
        }
    };

    return (
        <div className="flex items-center gap-2.5 py-1.5">
            <div className="shrink-0">{getIcon()}</div>
            <span
                className={`text-sm ${status === "success"
                    ? "text-green-400"
                    : status === "error"
                        ? "text-destructive"
                        : status === "pending"
                            ? "text-foreground"
                            : "text-muted-foreground"
                    }`}
            >
                {label}
                {isSigningStep && isSigning && status === "pending" && (
                    <span className="ml-1.5 text-primary font-medium">Sign in wallet</span>
                )}
            </span>
        </div>
    );
};

const ChainProgressCard: React.FC<ChainProgressCardProps> = ({
    chain,
    progress,
    isSigning,
    onRetry,
}) => {
    const hasError =
        progress.walletCreate === "error" ||
        progress.moduleSign === "error" ||
        progress.moduleEnable === "error" ||
        progress.moduleVerify === "error";

    const isComplete =
        progress.walletCreate === "success" &&
        progress.moduleSign === "success" &&
        progress.moduleEnable === "success" &&
        progress.moduleVerify === "success";

    return (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div
                        className={`w-2 h-2 rounded-full ${isComplete ? "bg-green-400" : hasError ? "bg-destructive" : "bg-primary"
                            }`}
                    />
                    <h3 className="font-medium text-sm text-foreground">Set-up Chain: {chain.name}</h3>
                </div>
                {hasError && (
                    <Button
                        onClick={onRetry}
                        className="h-7 px-2 gap-1 text-xs"
                    >
                        <FaSync className="w-3 h-3" />
                        Retry
                    </Button>
                )}
            </div>

            <div className="space-y-0.5 pl-1">
                <StepIndicator
                    label="Creating Safe Wallet"
                    status={progress.walletCreate}
                />
                <StepIndicator
                    label="Signing Module Authorization"
                    status={progress.moduleSign}
                    isSigningStep={true}
                    isSigning={isSigning}
                />
                <StepIndicator
                    label="Enabling Automation Module"
                    status={progress.moduleEnable}
                />
                <StepIndicator
                    label="Verifying On-Chain Status"
                    status={progress.moduleVerify}
                />
            </div>

            {progress.error && (
                <p className="mt-2 text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
                    {progress.error}
                </p>
            )}
        </div>
    );
};

export const OnboardingSetupModal: React.FC = () => {
    const {
        needsOnboarding,
        isOnboarding,
        isCheckingUser,
        // isModeValid,
        chainsToSetup,
        progress,
        currentSigningChain,
        walletChoiceCompleted,
        startOnboarding,
        retryChain,
        dismissOnboarding,
    } = useOnboarding();
    const { authenticated, ready } = usePrivy();
    const { chainId } = usePrivyWallet();
    const hasAutoStartedRef = useRef(false);

    // Yield to WalletChoiceModal until the wallet-choice step is resolved
    const walletChoiceShouldShow =
        authenticated && ready && !walletChoiceCompleted;

    // Calculate completion status
    const allComplete = chainsToSetup.every((chain) => {
        const chainProgress = progress[chain.id];
        return (
            chainProgress?.walletCreate === "success" &&
            chainProgress?.moduleSign === "success" &&
            chainProgress?.moduleEnable === "success" &&
            chainProgress?.moduleVerify === "success"
        );
    });

    const allIdle = chainsToSetup.every((chain) => {
        const chainProgress = progress[chain.id];
        return chainProgress?.walletCreate === "idle";
    });

    // When wallet is on Arbitrum Sepolia and setup is idle, auto-start once (e.g. after "Connect wallet" success)
    useEffect(() => {
        if (
            needsOnboarding &&
            allIdle &&
            !isOnboarding &&
            chainId === CHAIN_IDS.ARBITRUM_SEPOLIA &&
            !hasAutoStartedRef.current
        ) {
            hasAutoStartedRef.current = true;
            startOnboarding();
        }
    }, [needsOnboarding, allIdle, isOnboarding, chainId, startOnboarding]);

    // Close modal after completion animation
    useEffect(() => {
        if (allComplete) {
            const timer = setTimeout(() => {
                dismissOnboarding();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [allComplete, dismissOnboarding]);

    // Don't show if wallet choice modal should be shown first
    if (walletChoiceShouldShow) {
        return null;
    }
    // Don't show if not needed or still checking
    if (isCheckingUser || !needsOnboarding) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-dialog-title"
            aria-describedby="onboarding-dialog-description"
        >
            {/* Backdrop */}
            <div className="fixed inset-0 bg-background backdrop-blur-md" />

            {/* Modal Content - same layout as DeleteConfirmDialog */}
            <div
                className="relative z-50 w-full max-w-106.25 flex flex-col items-center justify-center p-6 gap-4 bg-black/95 border-white/20 border rounded-xl shadow-lg animate-in fade-in-0 zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon + Title + Description (centered, like delete modal) */}
                <FaShieldAlt className="w-16 h-16 text-white shrink-0" />
                <h2
                    id="onboarding-dialog-title"
                    className="text-xl font-semibold text-center text-foreground"
                >
                    Safe Wallet Setup
                </h2>
                <p
                    id="onboarding-dialog-description"
                    className="text-base text-center text-muted-foreground max-w-[80%]"
                >
                    Setting up your Safe Wallets for seamless automated transactions
                </p>

                {/* Progress Steps */}
                <div className="w-full space-y-4 max-h-80 overflow-y-auto">
                    {chainsToSetup.map((chain) => (
                        <ChainProgressCard
                            key={chain.id}
                            chain={chain}
                            progress={progress[chain.id] || {
                                walletCreate: "idle",
                                moduleSign: "idle",
                                moduleEnable: "idle",
                                moduleVerify: "idle",
                            }}
                            isSigning={currentSigningChain === String(chain.id)}
                            onRetry={() => retryChain(chain.id)}
                        />
                    ))}
                </div>

                {/* Footer - action area like delete modal */}
                <div className="w-full flex flex-col items-center gap-3 pt-2">
                    {allComplete ? (
                        <p className="text-sm font-medium text-green-400 flex items-center justify-center gap-2">
                            <FaCheckCircle className="w-4 h-4" />
                            Setup Completed!
                        </p>
                    ) : currentSigningChain ? (
                        <p className="text-sm text-primary font-medium flex items-center justify-center gap-2">
                            <FaPen className="w-4 h-4" />
                            Sign in your wallet
                        </p>
                    ) : null}
                    {allIdle && !isOnboarding && (
                        <div className="flex gap-3 w-full justify-center">
                            <Button
                                onClick={() => startOnboarding()}
                                className="flex-1 min-w-25"
                            >
                                Start setup
                            </Button>
                            <Button
                                onClick={dismissOnboarding}
                                variant="delete"
                                border
                                className="flex-1 min-w-25"
                            >
                                Skip
                            </Button>
                        </div>
                    )}
                    {!isOnboarding && !allComplete && !allIdle && (
                        <div className="flex gap-3 w-full justify-center">
                            <Button
                                onClick={dismissOnboarding}
                                variant="delete"
                                border
                                className="flex-1 min-w-25"
                            >
                                Skip Set-up
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingSetupModal;
