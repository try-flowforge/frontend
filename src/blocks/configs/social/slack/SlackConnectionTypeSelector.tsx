"use client";

import React, { useCallback } from "react";
import { LuLink2, LuKeyRound } from "react-icons/lu";
import type { ConnectionType } from "@/types/slack";

interface SlackConnectionTypeSelectorProps {
    connectionType: ConnectionType;
    onTypeChange: (type: ConnectionType) => void;
}

const OPTIONS: { type: ConnectionType; label: string; description: string; icon: React.ElementType }[] = [
    { type: "webhook", label: "Webhook", description: "Use webhook URL", icon: LuLink2 },
    { type: "oauth", label: "OAuth", description: "Workspace & channel", icon: LuKeyRound },
];

export const SlackConnectionTypeSelector = React.memo(function SlackConnectionTypeSelector({
    connectionType,
    onTypeChange,
}: SlackConnectionTypeSelectorProps) {
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLButtonElement>, type: ConnectionType) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                onTypeChange(type === "webhook" ? "oauth" : "webhook");
            }
        },
        [onTypeChange]
    );

    return (
        <div
            className="flex p-1 rounded-lg bg-white/5 border border-white/10 gap-0.5"
            role="radiogroup"
            aria-label="Connection type"
        >
            {OPTIONS.map(({ type, label, description, icon: Icon }) => {
                const isSelected = connectionType === type;
                return (
                    <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`${label}: ${description}`}
                        onClick={() => onTypeChange(type)}
                        onKeyDown={(e) => handleKeyDown(e, type)}
                        tabIndex={isSelected ? 0 : -1}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium outline-none transition-all duration-200 focus:border-white/50 ${isSelected
                                ? "bg-white/5 text-white border border-white/50"
                                : "text-white border border-transparent hover:bg-white/5 hover:border-white/10"
                            }`}
                    >
                        <Icon className="w-4 h-4 shrink-0" aria-hidden />
                        <span>{label}</span>
                    </button>
                );
            })}
        </div>
    );
});
