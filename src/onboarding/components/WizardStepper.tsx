"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa";

interface Step {
    id: string;
    label: string;
}

interface WizardStepperProps {
    steps: Step[];
    currentStepIndex: number;
    onStepClick?: (stepIndex: number) => void;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({
    steps,
    currentStepIndex,
    onStepClick,
}) => {
    return (
        <div className="flex items-center w-full mb-8">
            {steps.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isLast = index === steps.length - 1;
                const canGoToStep = onStepClick && (isCompleted || isCurrent);

                return (
                    <React.Fragment key={step.id}>
                        <div
                            className={`flex flex-col items-center gap-2 relative z-10 shrink-0 ${canGoToStep ? "cursor-pointer" : ""}`}
                            onClick={canGoToStep ? () => onStepClick(index) : undefined}
                            onKeyDown={
                                canGoToStep
                                    ? (e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                              e.preventDefault();
                                              onStepClick(index);
                                          }
                                      }
                                    : undefined
                            }
                            role={canGoToStep ? "button" : undefined}
                            tabIndex={canGoToStep ? 0 : undefined}
                            aria-label={canGoToStep ? `Go to step: ${step.label}` : undefined}
                        >
                            <motion.div
                                className={`
                                    w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors
                                    ${isCompleted
                                        ? "bg-orange-500 border-orange-500 text-black"
                                        : isCurrent
                                            ? "bg-transparent border-orange-500 text-orange-400"
                                            : "bg-transparent border-white/15 text-white/30"
                                    }
                                `}
                                animate={
                                    isCurrent
                                        ? { boxShadow: "0 0 16px rgba(249, 115, 22, 0.25)" }
                                        : { boxShadow: "0 0 0px rgba(249, 115, 22, 0)" }
                                }
                                transition={{ duration: 0.4 }}
                            >
                                {isCompleted ? (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", damping: 15, stiffness: 400 }}
                                    >
                                        <FaCheck className="w-3.5 h-3.5" />
                                    </motion.div>
                                ) : (
                                    index + 1
                                )}
                            </motion.div>
                            <span
                                className={`
                                    text-[10px] font-medium transition-colors duration-300 whitespace-nowrap
                                    ${isCurrent ? "text-white" : isCompleted ? "text-white/60" : "text-white/25"}
                                `}
                            >
                                {step.label}
                            </span>
                        </div>

                        {/* Connector Line */}
                        {!isLast && (
                            <div className="flex-1 h-0.5 bg-white/10 mx-2 mt-[-14px] relative overflow-hidden rounded-full">
                                <motion.div
                                    className="absolute inset-y-0 left-0 bg-orange-500 rounded-full"
                                    initial={{ width: "0%" }}
                                    animate={{
                                        width: isCompleted ? "100%" : "0%",
                                    }}
                                    transition={{
                                        type: "spring",
                                        damping: 30,
                                        stiffness: 200,
                                    }}
                                />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
