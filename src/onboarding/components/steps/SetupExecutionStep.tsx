import React, { useEffect, useRef } from "react";
import {
    useOnboarding,
    OnboardingStepStatus,
    ChainProgress,
    ChainConfig,
} from "@/onboarding/context/OnboardingContext";
import { TbFidgetSpinner } from "react-icons/tb";
import {
    FaCheckCircle,
    FaTimesCircle,
    FaSync,
    FaPen,
} from "react-icons/fa";
import { Button } from "@/components/ui/Button";
import { StepHelpSection } from "../StepHelpSection";

import { motion, AnimatePresence } from "framer-motion";

interface StepIndicatorProps {
    label: string;
    description?: string;
    status: OnboardingStepStatus;
    isSigningStep?: boolean;
    isSigning?: boolean;
    isLast?: boolean;
}

interface ChainProgressCardProps {
    chain: ChainConfig;
    progress: ChainProgress;
    isSigning: boolean;
    onRetry: () => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
    label,
    description,
    status,
    isSigningStep,
    isSigning,
    isLast,
}) => {
    const getIcon = () => {
        switch (status) {
            case "idle":
                return (
                    <div className="w-6 h-6 rounded-full border-2 border-white/10 flex items-center justify-center bg-black/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    </div>
                );
            case "pending":
                return (
                    <div className="w-6 h-6 rounded-full border-2 border-primary/30 flex items-center justify-center bg-primary/5">
                        <TbFidgetSpinner className="w-4 h-4 text-primary animate-spin" />
                    </div>
                );
            case "success":
                return (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center"
                    >
                        <FaCheckCircle className="w-3.5 h-3.5 text-green-400" />
                    </motion.div>
                );
            case "error":
                return (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-destructive/10 border-2 border-destructive/50 flex items-center justify-center"
                    >
                        <FaTimesCircle className="w-3.5 h-3.5 text-destructive" />
                    </motion.div>
                );
        }
    };

    return (
        <div className="flex gap-4 group">
            <div className="flex flex-col items-center">
                <div className="relative z-10">{getIcon()}</div>
                {!isLast && (
                    <div className={`w-0.5 flex-1 my-1 transition-colors duration-500 ${status === "success" ? "bg-green-500/30" : "bg-white/5"
                        }`} />
                )}
            </div>
            <div className="pb-6 flex-1">
                <div className="flex items-center justify-between">
                    <span
                        className={`text-sm font-medium transition-colors duration-300 ${status === "success"
                            ? "text-green-400"
                            : status === "error"
                                ? "text-destructive"
                                : status === "pending"
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                            }`}
                    >
                        {label}
                    </span>
                    {isSigningStep && isSigning && status === "pending" && (
                        <motion.span
                            initial={{ opacity: 0, x: 5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[10px] uppercase tracking-wider text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full animate-pulse"
                        >
                            Prompted
                        </motion.span>
                    )}
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground/60 mt-0.5 line-clamp-1">
                        {description}
                    </p>
                )}
            </div>
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

    const steps = [
        { key: "walletCreate", label: "Wallet Creation", desc: "Creating Your Safe Wallet on the Blockchain", status: progress.walletCreate },
        { key: "moduleSign", label: "Sign Module", desc: "Authorizing your wallet for automation", status: progress.moduleSign, isSigning: true },
        { key: "moduleEnable", label: "Enable Module", desc: "Enabling automation modules for your wallet", status: progress.moduleEnable },
        { key: "moduleVerify", label: "Final Verification", desc: "Verifying workflow execution set-up for the selected chain", status: progress.moduleVerify },
    ];

    const completedCount = steps.filter(s => s.status === "success").length;
    const totalSteps = steps.length;
    const progressPercent = (completedCount / totalSteps) * 100;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden group rounded-2xl border transition-all duration-300 ${isComplete
                ? "border-green-500/30 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.05)]"
                : hasError
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05] shadow-xl"
                }`}
        >
            {/* Background Gradient Glow */}
            <div className={`absolute -right-20 -top-20 w-40 h-40 blur-[100px] transition-colors duration-500 ${isComplete ? "bg-green-500/10" : hasError ? "bg-destructive/10" : "bg-primary/5"
                }`} />

            <div className="px-6 pt-5 pb-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-foreground tracking-tight">
                                {chain.name}
                            </h3>
                            {isComplete && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                                >
                                    Ready
                                </motion.div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground/80">
                            {isComplete ? "Set-up complete" : hasError ? "Set-up interrupted" : "Set-up in progress"}
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        {hasError ? (
                            <Button
                                onClick={onRetry}
                                className="h-9 px-4 text-xs bg-red-500/10 border-red-500/20 hover:bg-red-500/20"
                                variant="delete"
                                border
                            >
                                <FaSync className="w-3 h-3 mr-2" />
                                Retry
                            </Button>
                        ) : (
                            <div className="text-right px-2 py-1 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-sm font-mono font-bold text-primary">
                                    {Math.round(progressPercent)}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modern Progress Bar */}
                <div className="h-1 w-full bg-white/5 rounded-full mb-8 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className={`h-full rounded-full transition-colors duration-500 ${isComplete ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-primary shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                            }`}
                    />
                </div>

                <div className="space-y-0 relative">
                    {steps.map((step, idx) => (
                        <StepIndicator
                            key={step.key}
                            label={step.label}
                            description={step.desc}
                            status={step.status as OnboardingStepStatus}
                            isSigningStep={step.isSigning}
                            isSigning={isSigning}
                            isLast={idx === steps.length - 1}
                        />
                    ))}
                </div>

                <AnimatePresence>
                    {progress.error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2"
                        >
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex gap-3">
                                <FaTimesCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-destructive">Error</p>
                                    <p className="text-[11px] text-destructive/80 leading-relaxed">
                                        {progress.error}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export const SetupExecutionStep = () => {
    const {
        isOnboarding,
        chainsToSetup,
        progress,
        currentSigningChain,
        startOnboarding,
        retryChain,
        dismissOnboarding,
        completeStep
    } = useOnboarding();

    const hasAutoStartedRef = useRef(false);

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

    // Auto-start logic
    useEffect(() => {
        if (
            allIdle &&
            !isOnboarding &&
            !hasAutoStartedRef.current &&
            chainsToSetup.length > 0
        ) {
            hasAutoStartedRef.current = true;
            startOnboarding();
        }
    }, [allIdle, isOnboarding, startOnboarding, chainsToSetup]);

    // Auto-complete step
    useEffect(() => {
        if (allComplete) {
            const timer = setTimeout(() => {
                completeStep("setup");
                dismissOnboarding();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [allComplete, completeStep, dismissOnboarding]);

    return (
        <div className="flex flex-col h-full w-full">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
                    Safe Wallet Set-up
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Creating secure Safe wallets and enabling automation modules across your selected networks for seamless workflow execution.
                </p>
            </div>

            <motion.div
                layout
                className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-3 pb-6 scrollbar-thin overflow-x-hidden"
                data-lenis-prevent
            >
                <AnimatePresence mode="popLayout">
                    {chainsToSetup.map((chain, index) => (
                        <motion.div
                            key={chain.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <ChainProgressCard
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
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            <div className="mt-4">
                <StepHelpSection
                    items={[
                        { text: "Your wallet will prompt a one-time signature per chain to authorize the module.", type: "warning" },
                        { text: "You can continue exploring the platform while the setup runs in the background." },
                        { text: "A Safe wallet will be created on each selected chain where automation is enabled." },
                        { text: "The Safe automation module will be enabled for seamless workflow execution." },
                        { text: "The entire setup process is fully automated and gas-free for you." }
                    ]}
                />
            </div>

            <div className="mt-auto pt-6 flex flex-col items-center gap-4">
                <AnimatePresence mode="wait">
                    {allComplete ? (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full flex flex-col items-center"
                        >
                            <div className="bg-green-500 text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                <FaCheckCircle className="w-5 h-5" />
                                All Set-up Completed!
                            </div>
                        </motion.div>
                    ) : currentSigningChain ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center gap-2"
                        >
                            <p className="text-sm text-primary font-bold flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-full border border-primary/20">
                                <motion.div
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                >
                                    <FaPen className="w-4 h-4 text-primary" />
                                </motion.div>
                                Signing required
                            </p>
                        </motion.div>
                    ) : allIdle && !isOnboarding ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full"
                        >
                            <Button onClick={() => startOnboarding()} className="w-full h-14 text-lg shadow-2xl">
                                Initialize All Networks
                            </Button>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </div>
    );
};
