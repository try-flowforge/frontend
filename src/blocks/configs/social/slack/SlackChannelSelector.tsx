"use client";

import React, { useCallback, useState, useMemo } from "react";
import { LuLoader, LuSend, LuRefreshCw, LuCircleHelp, LuChevronDown, LuChevronUp } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { Dropdown } from "@/components/ui/Dropdown";
import { SlackNotificationBanner } from "./SlackNotificationBanner";
import type { SlackChannel, SlackNotification, SlackLoadingState } from "@/types/slack";

interface SlackChannelSelectorProps {
    channels: SlackChannel[];
    selectedChannelId: string;
    connectionId: string;
    loading: SlackLoadingState;
    notification: SlackNotification | null;
    onChannelChange: (connectionId: string, channelId: string, channelName: string) => Promise<void>;
    onTestConnection: (connectionId: string, channelId: string) => Promise<void>;
    onReloadChannels: (connectionId: string) => void;
}

/**
 * Channel selector for OAuth connections
 * Includes reload functionality and test message button
 * Uses memoized Map for optimized channel lookup
 */
export const SlackChannelSelector = React.memo(function SlackChannelSelector({
    channels,
    selectedChannelId,
    connectionId,
    loading,
    notification,
    onChannelChange,
    onTestConnection,
    onReloadChannels,
}: SlackChannelSelectorProps) {
    const [pendingChannelUpdate, setPendingChannelUpdate] = useState<string | null>(null);
    const [showHelpTip, setShowHelpTip] = useState(false);

    // Memoize channel Map for O(1) lookups and stable callback dependencies
    const channelMap = useMemo(() =>
        new Map(channels.map(c => [c.id, c])),
        [channels]
    );

    const handleChannelChange = useCallback(
        async (e: React.ChangeEvent<HTMLSelectElement>) => {
            const channelId = e.target.value;

            if (!channelId) {
                // Clear selection handled by parent
                return;
            }

            // Use memoized Map for O(1) lookup
            const channel = channelMap.get(channelId);
            if (channel && connectionId) {
                setPendingChannelUpdate(channelId);
                try {
                    await onChannelChange(connectionId, channelId, channel.name);
                } finally {
                    setPendingChannelUpdate(null);
                }
            }
        },
        [channelMap, connectionId, onChannelChange]
    );

    const isUpdatingChannel = pendingChannelUpdate !== null || loading.processing;

    const channelOptions = useMemo(
        () => [
            { value: "", label: "Select a channel..." },
            ...channels.map((c) => ({
                value: c.id,
                label: `#${c.name}${c.isPrivate ? " (Private)" : ""}`,
            })),
        ],
        [channels]
    );

    /**
     * Collapsible Help Tip Component
     * Shows as a small clickable text that expands to reveal more info
     */
    const HelpTip = () => (
        <div className="mt-2">
            <button
                type="button"
                onClick={() => setShowHelpTip(!showHelpTip)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            >
                <LuCircleHelp className="w-3 h-3" />
                <span className="group-hover:underline">Can&apos;t see a channel?</span>
                {showHelpTip ? (
                    <LuChevronUp className="w-3 h-3" />
                ) : (
                    <LuChevronDown className="w-3 h-3" />
                )}
            </button>

            {showHelpTip && (
                <div className="mt-2 p-2 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="mb-1">
                        <strong>Private channels</strong> only appear if the bot has been invited.
                    </p>
                    <p>
                        In Slack, open the channel and type:{" "}
                        <code className="bg-background px-1 py-0.5 rounded text-foreground">/invite @FlowForge</code>
                    </p>
                </div>
            )}
        </div>
    );

    if (loading.channels) {
        return (
            <div className="flex items-center justify-center py-2">
                <LuLoader className="w-3 h-3 animate-spin text-primary" />
                <span className="ml-2 text-xs text-muted-foreground">
                    Loading channels...
                </span>
            </div>
        );
    }

    if (channels.length === 0) {
        return (
            <div className="space-y-2">
                <Typography variant="caption" className="text-muted-foreground text-xs">
                    No channels found. The bot may need to be added to channels first.
                </Typography>
                <Button
                    type="button"
                    onClick={() => onReloadChannels(connectionId)}
                    className="w-full gap-2 text-xs"
                >
                    <LuRefreshCw className="w-3 h-3" />
                    Reload Channels
                </Button>
                <HelpTip />
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Dropdown
                options={channelOptions}
                value={pendingChannelUpdate || selectedChannelId || ""}
                onChange={handleChannelChange}
                disabled={isUpdatingChannel}
                placeholder="Select a channel..."
                aria-label="Select Slack channel"
            />

            {!selectedChannelId && !pendingChannelUpdate && (
                <Typography variant="caption" className="text-warning text-xs">
                    ⚠️ Please select a channel to enable message sending
                </Typography>
            )}

            {selectedChannelId && (
                <div className="space-y-2">
                    <Button
                        type="button"
                        onClick={() => onTestConnection(connectionId, selectedChannelId)}
                        disabled={loading.processing}
                        className="w-full gap-2 text-xs"
                    >
                        {loading.processing ? (
                            <>
                                <LuLoader className="w-3 h-3 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <LuSend className="w-3 h-3" />
                                Test Message
                            </>
                        )}
                    </Button>

                    <SlackNotificationBanner notification={notification} variant="compact" />
                </div>
            )}

            {/* Collapsible Help Tip */}
            <HelpTip />
        </div>
    );
});
