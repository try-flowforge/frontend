"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "@/onboarding/context/OnboardingContext";
import { FaTimes, FaCheck } from "react-icons/fa";

// A small round indicator in the navbar when the onboarding is running in the background.
export function OnboardingProgressIndicator() {
    const {
        needsOnboarding,
        isMinimized,
        overallStatus,
        currentStep,
        expandWizard,
    } = useOnboarding();

    const [prevStatus, setPrevStatus] = useState(overallStatus);
    const [dismissed, setDismissed] = useState(false);

    // Reset dismissal when status changes away from complete
    if (overallStatus !== prevStatus) {
        setPrevStatus(overallStatus);
        setDismissed(false);
    }

    // Map step to number
    const stepNumber =
        currentStep === "wallet"
            ? 1
            : currentStep === "chain"
                ? 2
                : currentStep === "setup"
                    ? 3
                    : 0;

    // Auto-dismiss after completion
    useEffect(() => {
        if (overallStatus === "complete") {
            const timer = setTimeout(() => setDismissed(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [overallStatus]);

    // Only show when onboarding is active & wizard is minimized
    const shouldShow =
        needsOnboarding && isMinimized && !dismissed && currentStep !== "complete";

    // Also show briefly when complete
    const showComplete = overallStatus === "complete" && !dismissed;

    if (!shouldShow && !showComplete) return null;

    const isError = overallStatus === "error";
    const isProgress = overallStatus === "in-progress";
    const isComplete = overallStatus === "complete";

    // Ring color
    const ringColor = isError
        ? "#ef4444b3"
        : isComplete
            ? "#22c55eb3"
            : "#f9731699";

    return (
        <AnimatePresence>
            <motion.button
                key="onboarding-indicator"
                className="relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer group"
                onClick={expandWizard}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 400 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                title="Continue onboarding"
            >
                {/* Background circle */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: isError
                            ? "#ef44441f"
                            : isComplete
                                ? "#22c55e1f"
                                : "#f9731614",
                        border: `2px solid ${isError
                            ? "#ef44444d"
                            : isComplete
                                ? "#22c55e4d"
                                : "#f9731633"
                            }`,
                    }}
                />

                {/* Animated loading ring - only when in-progress */}
                {isProgress && (
                    <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 40 40"
                    >
                        <motion.circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke={ringColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray="113"
                            animate={{ strokeDashoffset: [113, 0] }}
                            transition={{
                                duration: 1.8,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        />
                    </svg>
                )}

                {/* Static ring for error / complete */}
                {(isError || isComplete) && !isProgress && (
                    <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 40 40"
                    >
                        <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke={ringColor}
                            strokeWidth="2"
                        />
                    </svg>
                )}

                {/* Icon */}
                <div className="relative z-10">
                    <AnimatePresence mode="wait">
                        {isError ? (
                            <motion.div
                                key="error"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                            >
                                <FaTimes className="w-4 h-4 text-red-400" />
                            </motion.div>
                        ) : isComplete ? (
                            <motion.div
                                key="complete"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                            >
                                <FaCheck className="w-4 h-4 text-green-400" />
                            </motion.div>
                        ) : (
                            <motion.span
                                key={`step-${stepNumber}`}
                                className="text-sm font-bold text-orange-400"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: "spring", damping: 15, stiffness: 400 }}
                            >
                                {stepNumber}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Tooltip */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    <span className="text-[10px] font-medium text-white/70 bg-black/90 px-2 py-1 rounded border border-white/10">
                        {isError
                            ? "Setup error - click to view"
                            : isComplete
                                ? "Setup complete!"
                                : "Continue setup"}
                    </span>
                </div>
            </motion.button>
        </AnimatePresence>
    );
}
