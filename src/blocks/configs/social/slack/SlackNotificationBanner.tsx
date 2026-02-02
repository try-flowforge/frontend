"use client";

import React from "react";
import { LuCircleCheck, LuCircleX, LuInfo, LuTriangleAlert } from "react-icons/lu";
import { Typography } from "@/components/ui/Typography";
import type { SlackNotification } from "@/types/slack";

interface SlackNotificationBannerProps {
    notification: SlackNotification | null;
    variant?: "default" | "compact";
}

/**
 * Centralized notification banner for Slack integration
 * Displays success, error, info, and warning messages
 */
export const SlackNotificationBanner = React.memo(function SlackNotificationBanner({
    notification,
    variant = "default",
}: SlackNotificationBannerProps) {
    if (!notification) return null;

    const iconClassName = variant === "compact" ? "w-3 h-3" : "w-4 h-4";
    const textVariant = variant === "compact" ? "caption" : "bodySmall";

    const config = {
        success: {
            icon: <LuCircleCheck className={`${iconClassName} text-success`} />,
            bgClass: "bg-success/10",
            textClass: "text-success",
        },
        error: {
            icon: <LuCircleX className={`${iconClassName} text-destructive`} />,
            bgClass: "bg-destructive/10",
            textClass: "text-destructive",
        },
        info: {
            icon: <LuInfo className={`${iconClassName} text-info`} />,
            bgClass: "bg-info/10",
            textClass: "text-info",
        },
        warning: {
            icon: <LuTriangleAlert className={`${iconClassName} text-warning`} />,
            bgClass: "bg-warning/10",
            textClass: "text-warning",
        },
    };

    const { icon, bgClass, textClass } = config[notification.type];

    return (
        <div className={`flex items-center gap-2 p-2 rounded-lg ${bgClass}`}>
            {icon}
            <Typography variant={textVariant} className={textClass}>
                {notification.message}
            </Typography>
        </div>
    );
});
