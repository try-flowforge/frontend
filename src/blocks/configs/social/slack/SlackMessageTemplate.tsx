"use client";

import React, { useState, useCallback, useRef } from "react";
import { LuLoader, LuSend, LuMessageSquare, LuCircleCheck } from "react-icons/lu";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { SlackNotificationBanner } from "./SlackNotificationBanner";
import { TemplateFieldSelector } from "@/blocks/configs/shared/TemplateFieldSelector";
import { useWorkflow } from "@/contexts/WorkflowContext";
import type { SlackNotification, SlackLoadingState } from "@/types/slack";

interface SlackMessageTemplateProps {
    /** Current message template value */
    messageTemplate: string;
    /** Connection display name */
    connectionName: string;
    /** Connection type (webhook or oauth) */
    connectionType: "webhook" | "oauth";
    /** Channel name for OAuth connections */
    channelName?: string;
    /** Channel ID for OAuth connections */
    channelId?: string;
    /** Loading state */
    loading: SlackLoadingState;
    /** Notification to display */
    notification: SlackNotification | null;
    /** Called when message template changes */
    onMessageChange: (message: string) => void;
    /** Called to send a preview message */
    onSendPreview: () => Promise<void>;
    /** Current node ID for template field selector */
    currentNodeId: string;
}

/**
 * Message Template Card for Slack workflow configuration
 * 
 * This component allows users to configure the message that will be sent
 * when the workflow executes. It appears after a connection is selected.
 * 
 * Features:
 * - Message template input with placeholder support
 * - Connection summary display
 * - Preview/test functionality
 * - Character count hint
 */
export const SlackMessageTemplate = React.memo(function SlackMessageTemplate({
    messageTemplate,
    connectionName,
    connectionType,
    channelName,
    channelId,
    loading,
    notification,
    onMessageChange,
    onSendPreview,
    currentNodeId,
}: SlackMessageTemplateProps) {
    const [isSending, setIsSending] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { nodes, edges } = useWorkflow();

    const isOAuthWithoutChannel = connectionType === "oauth" && !channelId;
    const canSend = messageTemplate.trim() && !loading.processing && !isSending && !isOAuthWithoutChannel;
    const messageLength = messageTemplate.length;

    // Remove redundant "OAuth" suffix from connection name (we show it in the badge)
    const displayName = connectionName?.replace(/\s*OAuth\s*$/i, "").trim() || connectionName;

    // Auto-detect upstream AI nodes and suggest template
    const upstreamAiNodes = React.useMemo(() => {
        const getAllUpstreamNodes = (nodeId: string): typeof nodes => {
            const visited = new Set<string>();
            const queue: string[] = [nodeId];
            const upstreamNodes: typeof nodes = [];

            while (queue.length > 0) {
                const currentId = queue.shift()!;

                if (visited.has(currentId)) {
                    continue;
                }

                visited.add(currentId);

                const incomingEdges = edges.filter((edge) => edge.target === currentId);

                for (const edge of incomingEdges) {
                    const sourceNodeId = edge.source;

                    if (sourceNodeId !== nodeId && !visited.has(sourceNodeId)) {
                        const sourceNode = nodes.find((n) => n.id === sourceNodeId);
                        if (sourceNode) {
                            upstreamNodes.push(sourceNode);
                            queue.push(sourceNodeId);
                        }
                    }
                }
            }

            return upstreamNodes;
        };

        const upstream = getAllUpstreamNodes(currentNodeId);
        return upstream.filter((node) => node.type === "ai-transform");
    }, [nodes, edges, currentNodeId]);

    // Auto-fill template if message is empty or default and there's an AI node upstream
    // Use ref to track if we've already auto-filled to prevent overwriting user edits
    const hasAutoFilledRef = useRef(false);

    React.useEffect(() => {
        // Skip if we've already auto-filled or if there are no AI nodes
        if (hasAutoFilledRef.current || upstreamAiNodes.length === 0) {
            return;
        }

        const isDefaultMessage = !messageTemplate ||
            messageTemplate === "Hello from FlowForge! 🚀" ||
            messageTemplate === "Hello from FlowForge!";

        // Only auto-fill if message is default AND doesn't already contain a template
        const hasTemplate = messageTemplate && messageTemplate.includes("{{");

        if (isDefaultMessage && !hasTemplate) {
            const aiNodeId = upstreamAiNodes[0].id;
            const suggestedTemplate = `{{blocks.${aiNodeId}.text}}`;
            hasAutoFilledRef.current = true;
            onMessageChange(suggestedTemplate);
        }
    }, [messageTemplate, upstreamAiNodes, onMessageChange]);

    const handleSendPreview = useCallback(async () => {
        if (!canSend) return;
        setIsSending(true);
        try {
            await onSendPreview();
        } finally {
            setIsSending(false);
        }
    }, [canSend, onSendPreview]);

    return (
        <SimpleCard className="p-4 space-y-4">
            {/* Header with connection summary */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <LuMessageSquare className="w-4 h-4 text-primary" />
                    <Typography variant="bodySmall" className="font-semibold text-foreground">
                        Message Configuration
                    </Typography>
                </div>

                {/* Connection Summary */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                    <LuCircleCheck className="w-3.5 h-3.5 text-success shrink-0" />
                    <div className="flex-1 min-w-0">
                        <Typography variant="caption" className="text-foreground font-medium truncate block">
                            {displayName}
                        </Typography>
                        <Typography variant="caption" className="text-muted-foreground">
                            {connectionType === "oauth" && channelName ? (
                                <>#{channelName}</>
                            ) : connectionType === "oauth" ? (
                                <span className="text-warning">⚠️ No channel selected</span>
                            ) : null}
                        </Typography>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${connectionType === "oauth"
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-secondary-foreground"
                        }`}>
                        {connectionType === "oauth" ? "OAuth" : "Webhook"}
                    </span>
                </div>
            </div>

            {/* OAuth without channel warning */}
            {isOAuthWithoutChannel && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20">
                    <Typography variant="caption" className="text-warning">
                        Please select a channel.
                    </Typography>
                </div>
            )}

            {/* Template Field Selector */}
            <TemplateFieldSelector
                currentNodeId={currentNodeId}
                onInsertField={(placeholder) => {
                    // Insert at cursor or append
                    if (textareaRef.current) {
                        const textarea = textareaRef.current;
                        const start = textarea.selectionStart || 0;
                        const end = textarea.selectionEnd || 0;
                        const newValue =
                            messageTemplate.substring(0, start) +
                            placeholder +
                            messageTemplate.substring(end);
                        onMessageChange(newValue);
                        // Set cursor after inserted text
                        setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
                        }, 0);
                    } else {
                        onMessageChange(messageTemplate + placeholder);
                    }
                }}
                inputRef={textareaRef}
            />

            {/* Message Template Input */}
            <div className="space-y-2">
                <label className="block">
                    <div className="flex items-center justify-between mb-1">
                        <Typography variant="caption" className="text-muted-foreground">
                            Message to Send
                        </Typography>
                        <Typography variant="caption" className="text-muted-foreground">
                            {messageLength > 0 && `${messageLength} chars`}
                        </Typography>
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={messageTemplate}
                        onChange={(e) => onMessageChange(e.target.value)}
                        disabled={isOAuthWithoutChannel}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter the message you want to send when this workflow runs... Use the field selector above to insert dynamic values."
                        rows={4}
                        aria-label="Slack message template"
                    />
                </label>
            </div>

            {/* Send Preview Button */}
            <div className="space-y-2">
                <Button
                    type="button"
                    onClick={handleSendPreview}
                    disabled={!canSend}
                    className="w-full gap-2"
                >
                    {isSending || loading.processing ? (
                        <>
                            <LuLoader className="w-4 h-4 animate-spin" />
                            Sending Preview...
                        </>
                    ) : (
                        <>
                            <LuSend className="w-4 h-4" />
                            Send Preview Message
                        </>
                    )}
                </Button>
            </div>

            {/* Notification Banner */}
            <SlackNotificationBanner notification={notification} />
        </SimpleCard>
    );
});
