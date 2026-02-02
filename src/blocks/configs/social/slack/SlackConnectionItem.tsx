"use client";

import React from "react";
import { LuCircleCheck, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { SlackChannelSelector } from "./SlackChannelSelector";
import type { SlackConnection, SlackChannel, SlackNotification, SlackLoadingState } from "@/types/slack";

interface SlackConnectionItemProps {
    connection: SlackConnection;
    isSelected: boolean;
    nodeData: Record<string, unknown>;
    channels: SlackChannel[];
    selectedChannelId: string;
    loading: SlackLoadingState;
    notification: SlackNotification | null;
    onSelect: (connectionId: string) => void;
    onDelete: (connectionId: string) => void;
    onChannelChange: (connectionId: string, channelId: string, channelName: string) => Promise<void>;
    onTestConnection: (connectionId: string, channelId: string) => Promise<void>;
    onReloadChannels: (connectionId: string) => void;
}

/**
 * Single connection item with channel selector for OAuth
 * Memoized date formatting for performance
 */
export const SlackConnectionItem = React.memo(function SlackConnectionItem({
    connection,
    isSelected,
    nodeData,
    channels,
    selectedChannelId,
    loading,
    notification,
    onSelect,
    onDelete,
    onChannelChange,
    onTestConnection,
    onReloadChannels,
}: SlackConnectionItemProps) {
    const isOAuth = connection.connectionType === "oauth";
    const showChannelSelector = isSelected && isOAuth;

    // Get display name, removing redundant "OAuth" suffix since we show it in the badge
    const rawName = connection.name || (isOAuth ? connection.teamName : "Unnamed Webhook");
    const displayName = rawName?.replace(/\s*OAuth\s*$/i, "").trim() || rawName;

    return (
        <div
            className={`border rounded-lg transition-colors ${isSelected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
                }`}
        >
            <div className="flex items-center justify-between p-3">
                <button
                    type="button"
                    onClick={() => onSelect(connection.id)}
                    className="flex-1 text-left"
                >
                    <div className="flex items-center gap-2">
                        {isSelected && (
                            <LuCircleCheck className="w-4 h-4 text-primary" aria-hidden="true" />
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <Typography
                                    variant="bodySmall"
                                    className="text-foreground font-medium"
                                >
                                    {displayName}
                                </Typography>
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${isOAuth
                                        ? "bg-primary/20 text-primary"
                                        : "bg-secondary text-secondary-foreground"
                                        }`}
                                >
                                    {isOAuth ? "OAuth" : "Webhook"}
                                </span>
                            </div>
                            {isOAuth && connection.channelName && (
                                <Typography variant="caption" className="text-muted-foreground">
                                    #{connection.channelName}
                                </Typography>
                            )}
                        </div>
                    </div>
                </button>
                <Button
                    type="button"
                    onClick={() => onDelete(connection.id)}
                    disabled={loading.processing}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label={`Delete connection ${displayName}`}
                >
                    <LuTrash2 className="w-3 h-3" />
                </Button>
            </div>

            {/* Channel Selector - Inline for OAuth connections */}
            {showChannelSelector && (
                <div className="px-3 pb-3 pt-2 border-t border-border/50 space-y-2">
                    <Typography variant="caption" className="text-muted-foreground font-medium">
                        Select Channel:
                    </Typography>
                    <SlackChannelSelector
                        channels={channels}
                        selectedChannelId={selectedChannelId || (nodeData.slackChannelId as string) || ""}
                        connectionId={connection.id}
                        loading={loading}
                        notification={notification}
                        onChannelChange={onChannelChange}
                        onTestConnection={onTestConnection}
                        onReloadChannels={onReloadChannels}
                    />
                </div>
            )}
        </div>
    );
});
