"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaInfoCircle, FaExclamationTriangle } from "react-icons/fa";

interface HelpItem {
    text: string;
    type?: "info" | "warning";
}

interface StepHelpSectionProps {
    items: HelpItem[];
    defaultOpen?: boolean;
}

export function StepHelpSection({ items, defaultOpen = false }: StepHelpSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const hasWarnings = items.some((item) => item.type === "warning");

    return (
        <div className="w-full mt-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                    ${hasWarnings
                        ? "bg-amber-500/8 border border-amber-500/15 text-amber-400/90 hover:bg-amber-500/12"
                        : "bg-white/4 border border-white/8 text-white/50 hover:bg-white/6 hover:text-white/70"
                    }
                `}
            >
                <span className="flex items-center gap-2">
                    {hasWarnings ? (
                        <FaExclamationTriangle className="w-3 h-3 text-amber-400/70" />
                    ) : (
                        <FaInfoCircle className="w-3 h-3" />
                    )}
                    {hasWarnings ? "Instructions & Warnings" : "Instructions"}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <FaChevronDown className="w-2.5 h-2.5" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <ul className="mt-2 space-y-1.5 px-1">
                            {items.map((item, index) => (
                                <motion.li
                                    key={index}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-start gap-2.5 text-xs leading-relaxed"
                                >
                                    <span
                                        className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${item.type === "warning"
                                            ? "bg-amber-400/70"
                                            : "bg-white/30"
                                            }`}
                                    />
                                    <span
                                        className={
                                            item.type === "warning"
                                                ? "text-amber-400/80"
                                                : "text-white/45"
                                        }
                                    >
                                        {item.text}
                                    </span>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
