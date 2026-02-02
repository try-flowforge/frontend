"use client";

import { useState, useCallback } from "react";
import { LuLoader, LuRefreshCw, LuBot, LuSend, LuTrash2, LuMessageSquare, LuX, LuPlus, LuCopy, LuCheck, LuCircleCheck } from "react-icons/lu";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { TemplateFieldSelector } from "@/blocks/configs/shared/TemplateFieldSelector";
import { useTelegramConnection } from "@/hooks/useTelegramConnection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { API_CONFIG, buildApiUrl } from "@/config/api";
import type { TelegramConnection } from "@/types/telegram";

interface TelegramMessage {
    updateId: number;
    messageId?: number;
    text?: string;
    from?: { id: number; firstName: string; username?: string };
    date: number;
}

interface TelegramNodeConfigurationProps {
    nodeData: Record<string, unknown>;
    handleDataChange: (updates: Record<string, unknown>) => void;
    authenticated: boolean;
    login: () => void;
}

function TelegramNodeConfigurationInner({
    nodeData,
    handleDataChange,
    authenticated,
    login,
}: TelegramNodeConfigurationProps) {
    const { getPrivyAccessToken } = usePrivyWallet();
    const {
        botInfo,
        connections,
        // chats,
        loading,
        notification,
        selectedConnection,
        telegramMessage,
        verificationCode,
        verificationStatus,
        actions,
    } = useTelegramConnection({
        nodeData,
        onDataChange: handleDataChange,
        authenticated,
    });

    // Message viewer state
    const [showMessages, setShowMessages] = useState(false);
    const [messages, setMessages] = useState<TelegramMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showVerificationFlow, setShowVerificationFlow] = useState(false);

    // Copy verification code to clipboard
    const copyToClipboard = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }, []);

    // Load messages from backend
    const loadMessages = useCallback(async () => {
        if (!selectedConnection) return;

        setLoadingMessages(true);
        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) return;

            const response = await fetch(
                buildApiUrl(`${API_CONFIG.ENDPOINTS.TELEGRAM.CONNECTIONS}/${selectedConnection.id}/messages`),
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setMessages(data.data.messages || []);
            }
        } catch (error) {
            console.error("Failed to load messages:", error);
        } finally {
            setLoadingMessages(false);
        }
    }, [selectedConnection, getPrivyAccessToken]);

    // Open message viewer
    const openMessageViewer = useCallback(() => {
        setShowMessages(true);
        loadMessages();
    }, [loadMessages]);

    // Show login prompt
    if (!authenticated) {
        return (
            <SimpleCard className="p-4 space-y-3">
                <Typography variant="bodySmall" className="font-semibold text-foreground">
                    Authentication Required
                </Typography>
                <Typography variant="caption" className="text-muted-foreground">
                    Please log in to configure Telegram integration.
                </Typography>
                <Button onClick={login} className="w-full">
                    Login to Continue
                </Button>
            </SimpleCard>
        );
    }

    return (
        <div className="space-y-4">
            {/* Notification */}
            {notification && (
                <div className={`p-3 rounded-lg text-sm ${notification.type === "error" ? "bg-destructive/10 text-destructive" :
                    notification.type === "success" ? "bg-green-500/10 text-green-600" :
                        "bg-blue-500/10 text-blue-600"
                    }`}>
                    {notification.message}
                </div>
            )}

            {/* Step 1: Bot Info */}
            <SimpleCard className="p-4 space-y-3">
                <Typography variant="bodySmall" className="font-semibold text-foreground">
                    1. FlowForge Telegram Bot
                </Typography>

                {loading.bot ? (
                    <div className="flex items-center gap-2 py-2">
                        <LuLoader className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading bot info...</span>
                    </div>
                ) : botInfo ? (
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                        <div className="flex items-center gap-2">
                            <LuBot className="w-5 h-5 text-primary" />
                            <div>
                                <Typography variant="bodySmall" className="font-medium">
                                    @{botInfo.username}
                                </Typography>
                                <Typography variant="caption" className="text-muted-foreground">
                                    Add this bot to your chat, then click below
                                </Typography>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Typography variant="caption" className="text-destructive">
                        Bot not configured. Please contact support.
                    </Typography>
                )}
            </SimpleCard>

            {/* Step 2: Select Chat */}
            <SimpleCard className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <Typography variant="bodySmall" className="font-semibold text-foreground">
                        2. Connect a Chat
                    </Typography>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => {
                                setShowVerificationFlow(true);
                                actions.generateVerificationCode();
                            }}
                            disabled={loading.verification}
                            className="gap-1"
                        >
                            {loading.verification ? (
                                <LuLoader className="w-3 h-3 animate-spin" />
                            ) : (
                                <LuPlus className="w-3 h-3" />
                            )}
                            Add New Chat
                        </Button>
                        <Button
                            onClick={actions.loadConnections}
                            disabled={loading.connections}
                            className="gap-1"
                        >
                            {loading.connections ? (
                                <LuLoader className="w-3 h-3 animate-spin" />
                            ) : (
                                <LuRefreshCw className="w-3 h-3" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Verification Flow UI */}
                {showVerificationFlow && verificationCode && (
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
                        <div className="flex items-center justify-between">
                            <Typography variant="bodySmall" className="font-semibold text-primary">
                                🔐 Verify Your Chat
                            </Typography>
                            <Button
                                onClick={() => {
                                    setShowVerificationFlow(false);
                                    actions.cancelVerificationCode();
                                }}
                                className="p-1 h-auto text-muted-foreground hover:text-foreground"
                            >
                                <LuX className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Verification Code Display */}
                        <div className="flex items-center gap-2">
                            <div className="flex-1 px-4 py-3 rounded-lg bg-background border border-border font-mono text-lg text-center select-all">
                                {verificationCode.code}
                            </div>
                            <Button
                                onClick={() => copyToClipboard(verificationCode.code)}
                                className="px-3"
                            >
                                {copied ? (
                                    <LuCheck className="w-4 h-4 text-green-500" />
                                ) : (
                                    <LuCopy className="w-4 h-4" />
                                )}
                            </Button>
                        </div>

                        {/* Instructions */}
                        <div className="space-y-2">
                            {verificationCode.instructions.map((instruction, index) => (
                                <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <span className="text-primary font-medium">{index + 1}.</span>
                                    <span>{instruction.replace(/^\d+\.\s*/, '')}</span>
                                </div>
                            ))}
                        </div>

                        {/* Expiry Info */}
                        <div className="text-xs text-muted-foreground text-center">
                            Code expires in {verificationCode.remainingMinutes} minutes
                        </div>

                        {/* Check Status Button */}
                        <div className="flex gap-2">
                            <Button
                                onClick={() => {
                                    actions.checkVerificationStatus();
                                }}
                                disabled={loading.verification}
                                className="flex-1 gap-2"
                            >
                                {loading.verification ? (
                                    <LuLoader className="w-4 h-4 animate-spin" />
                                ) : (
                                    <LuCircleCheck className="w-4 h-4" />
                                )}
                                Check Verification
                            </Button>
                        </div>

                        {/* Status Display */}
                        {verificationStatus?.status === 'verified' && (
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm text-center">
                                ✅ Chat &quot;{verificationStatus.chat?.title}&quot; verified successfully!
                            </div>
                        )}
                    </div>
                )}

                {/* Saved connections */}
                {connections.length > 0 && (
                    <div className="space-y-2">
                        <Typography variant="caption" className="text-muted-foreground">
                            Your connected chats:
                        </Typography>
                        {connections.map((conn: TelegramConnection) => (
                            <div
                                key={conn.id}
                                className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${selectedConnection?.id === conn.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:bg-secondary/30"
                                    }`}
                                onClick={() => actions.selectConnection(conn)}
                            >
                                <div className="flex items-center gap-2">
                                    <LuBot className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">{conn.chatTitle}</span>
                                </div>
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        actions.deleteConnection(conn.id);
                                    }}
                                    className="p-1 h-auto"
                                >
                                    <LuTrash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* No connections - show helpful message */}
                {connections.length === 0 && !showVerificationFlow && (
                    <div className="text-center py-4 space-y-2">
                        <Typography variant="caption" className="text-muted-foreground block">
                            No chats connected yet
                        </Typography>
                        <Typography variant="caption" className="text-muted-foreground block">
                            Click &quot;Add New Chat&quot; to securely connect a Telegram chat
                        </Typography>
                    </div>
                )}
            </SimpleCard>

            {/* Step 3: Message Template */}
            {selectedConnection && (
                <SimpleCard className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <Typography variant="bodySmall" className="font-semibold text-foreground">
                            3. Message Template
                        </Typography>
                        <Button
                            onClick={openMessageViewer}
                            className="gap-1"
                        >
                            <LuMessageSquare className="w-3 h-3" />
                            View Messages
                        </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Sending to: {selectedConnection.chatTitle}
                    </div>

                    {/* Template Field Selector */}
                    <TemplateFieldSelector
                        currentNodeId={(nodeData.id as string) || ""}
                        onInsertField={(placeholder) => {
                            actions.updateMessage(telegramMessage + placeholder);
                        }}
                    />

                    <textarea
                        value={telegramMessage}
                        onChange={(e) => actions.updateMessage(e.target.value)}
                        placeholder="Hello from FlowForge! 🚀 Use the field selector above to insert dynamic values."
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        rows={3}
                    />

                    <Button
                        onClick={actions.sendPreviewMessage}
                        disabled={!telegramMessage.trim() || loading.sending}
                        className="w-full gap-2"
                    >
                        {loading.sending ? (
                            <LuLoader className="w-4 h-4 animate-spin" />
                        ) : (
                            <LuSend className="w-4 h-4" />
                        )}
                        Send Preview
                    </Button>
                </SimpleCard>
            )}

            {/* Message Viewer Popup */}
            {showMessages && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div className="flex items-center gap-2">
                                <LuMessageSquare className="w-5 h-5 text-primary" />
                                <Typography variant="bodySmall" className="font-semibold">
                                    Incoming Messages
                                </Typography>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={loadMessages}
                                    disabled={loadingMessages}
                                    className="p-1 h-auto"
                                >
                                    {loadingMessages ? (
                                        <LuLoader className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <LuRefreshCw className="w-4 h-4" />
                                    )}
                                </Button>
                                <Button
                                    onClick={() => setShowMessages(false)}
                                    className="p-1 h-auto"
                                >
                                    <LuX className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loadingMessages ? (
                                <div className="flex items-center justify-center py-8">
                                    <LuLoader className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <LuMessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <Typography variant="caption">
                                        No messages received yet.
                                    </Typography>
                                    <Typography variant="caption" className="block mt-1">
                                        Messages appear here when sent to the connected chat.
                                    </Typography>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.updateId}
                                        className="p-3 rounded-lg bg-secondary/30 border border-border"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <Typography variant="caption" className="font-medium text-primary">
                                                {msg.from?.firstName || "Unknown"}
                                                {msg.from?.username && (
                                                    <span className="text-muted-foreground ml-1">
                                                        @{msg.from.username}
                                                    </span>
                                                )}
                                            </Typography>
                                            <Typography variant="caption" className="text-muted-foreground">
                                                {new Date(msg.date * 1000).toLocaleTimeString()}
                                            </Typography>
                                        </div>
                                        <Typography variant="bodySmall" className="text-foreground">
                                            {msg.text || "[No text]"}
                                        </Typography>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-border bg-secondary/20">
                            <Typography variant="caption" className="text-muted-foreground text-center block">
                                {messages.length} message{messages.length !== 1 ? "s" : ""} • From webhook
                            </Typography>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function TelegramNodeConfiguration(props: TelegramNodeConfigurationProps) {
    return (
        <ErrorBoundary
            fallback={(error, reset) => (
                <SimpleCard className="p-4 space-y-3">
                    <Typography variant="bodySmall" className="font-semibold text-foreground">
                        Telegram Configuration Error
                    </Typography>
                    <Typography variant="caption" className="text-destructive">
                        {error.message}
                    </Typography>
                    <Button type="button" onClick={reset} className="w-full">
                        Try Again
                    </Button>
                </SimpleCard>
            )}
        >
            <TelegramNodeConfigurationInner {...props} />
        </ErrorBoundary>
    );
}
