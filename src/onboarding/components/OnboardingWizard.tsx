"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "@/onboarding/context/OnboardingContext";
import { WizardStepper } from "./WizardStepper";
import { WalletChoiceStep } from "./steps/WalletChoiceStep";
import { ChainSelectionStep } from "./steps/ChainSelectionStep";
import { SetupExecutionStep } from "./steps/SetupExecutionStep";
import { FaTimes } from "react-icons/fa";
import { TbFidgetSpinner } from "react-icons/tb";
import { usePrivy } from "@privy-io/react-auth";

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 30 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring" as const, damping: 28, stiffness: 350 },
    },
    exit: {
        opacity: 0,
        scale: 0.92,
        y: 30,
        transition: { duration: 0.2 },
    },
};

const stepVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 80 : -80,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
        transition: { type: "spring" as const, damping: 30, stiffness: 300 },
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -80 : 80,
        opacity: 0,
        transition: { duration: 0.2 },
    }),
};

export const OnboardingWizard: React.FC = () => {
    const {
        needsOnboarding,
        isCheckingUser,
        currentStep,
        isMinimized,
        toggleMinimize,
        dismissOnboarding,
    } = useOnboarding();
    const { authenticated } = usePrivy();

    const steps = useMemo(
        () => [
            { id: "wallet", label: "Wallet Choice" },
            { id: "chain", label: "Network Selection" },
            { id: "setup", label: "Safe Wallet Set-up" },
        ],
        []
    );

    const stepIndex = useMemo(
        () => steps.findIndex((s) => s.id === currentStep),
        [currentStep, steps]
    );

    // Track step history for animation direction
    const [stepHistory, setStepHistory] = useState({ prev: stepIndex, current: stepIndex });

    if (stepIndex !== stepHistory.current) {
        setStepHistory({ prev: stepHistory.current, current: stepIndex });
    }

    const direction = stepIndex >= stepHistory.prev ? 1 : -1;
    const shouldShowSkipButton = currentStep === "chain";

    // Show immediately if authenticated and either needs onboarding or is still checking
    const shouldShow =
        authenticated &&
        (isCheckingUser || needsOnboarding) &&
        currentStep !== "complete" &&
        !isMinimized;

    const getStepTitle = () => {
        switch (currentStep) {
            case "wallet":
                return "Your Wallet Choice";
            case "chain":
                return "Select Automation Networks";
            case "setup":
                return "Safe Wallet Set-up";
            default:
                return "Onboarding";
        }
    };

    const getStepDescription = () => {
        switch (currentStep) {
            case "wallet":
                return "Choose external wallet or create embedded wallet to get started.";
            case "chain":
                return "Select the chains you want to use for automation and safe wallet set-up.";
            case "setup":
                return "We'll set up your Safe wallets and enable automation modules for you.";
            default:
                return "";
        }
    };

    const renderStep = () => {
        if (isCheckingUser) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-6"
                    >
                        <div className="relative">
                            <motion.div
                                className="absolute inset-0 bg-primary/20 blur-xl rounded-full"
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <TbFidgetSpinner className="w-12 h-12 text-primary animate-spin relative z-10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-foreground">Initialising Experience</h3>
                            <p className="text-sm text-muted-foreground max-w-[280px]">
                                Synchronizing your account status and infrastructure across networks...
                            </p>
                        </div>
                    </motion.div>
                </div>
            );
        }

        switch (currentStep) {
            case "wallet":
                return <WalletChoiceStep />;
            case "chain":
                return <ChainSelectionStep />;
            case "setup":
                return <SetupExecutionStep />;
            default:
                return null;
        }
    };

    return (
        <AnimatePresence mode="wait">
            {shouldShow && (
                <motion.div
                    key="onboarding-backdrop"
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        onClick={toggleMinimize}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative flex flex-col w-full max-w-2xl max-h-[85vh] bg-black/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-5 border-b border-white/10">
                            <div className="flex flex-col gap-0.5">
                                <motion.h2
                                    key={getStepTitle()}
                                    className="text-lg font-semibold text-white"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    {getStepTitle()}
                                </motion.h2>
                                <motion.p
                                    key={getStepDescription()}
                                    className="text-xs text-white/50"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1, duration: 0.25 }}
                                >
                                    {getStepDescription()}
                                </motion.p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={currentStep === "setup" ? toggleMinimize : dismissOnboarding}
                                    className="text-white/40 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-full cursor-pointer"
                                    aria-label="Close wizard"
                                >
                                    <FaTimes className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-0.5 bg-white/5 overflow-hidden">
                            <motion.div
                                className="h-full"
                                style={{
                                    background:
                                        "linear-gradient(90deg, #f97316 0%, #fb923c 100%)",
                                }}
                                initial={false}
                                animate={{
                                    width: `${((stepIndex + 1) / steps.length) * 100}%`,
                                }}
                                transition={{
                                    type: "spring",
                                    damping: 25,
                                    stiffness: 200,
                                }}
                            />
                        </div>

                        {/* Stepper */}
                        <div className="px-8 pt-6">
                            <WizardStepper
                                steps={steps}
                                currentStepIndex={stepIndex}
                            />
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-thin" data-lenis-prevent>
                            <div className="w-full max-w-lg mx-auto h-full flex flex-col">
                                <AnimatePresence mode="wait" custom={direction}>
                                    <motion.div
                                        key={currentStep}
                                        custom={direction}
                                        variants={stepVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        className="flex-1 flex flex-col"
                                    >
                                        {renderStep()}
                                    </motion.div>
                                </AnimatePresence>

                                {/* Skip button - visible through wallet + chain steps */}
                                {shouldShowSkipButton && (
                                    <motion.div
                                        className="mt-6 flex flex-col items-center gap-2 mx-auto"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        <button
                                            className="text-xs text-white/40 hover:text-white/70 transition-colors underline underline-offset-4 cursor-pointer font-medium"
                                            onClick={dismissOnboarding}
                                        >
                                            Skip for now
                                        </button>
                                        <p className="text-[10px] text-white/30 text-center max-w-lg">
                                            You can complete the full setup later from the wallet block.
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
