"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePrivyWallet } from "./usePrivyWallet";
import { API_CONFIG, buildApiUrl } from "@/config/api";
import type {
    TelegramBotInfo,
    TelegramConnection,
    TelegramChat,
    TelegramNotification,
    TelegramLoadingState,
    TelegramVerificationCode,
    TelegramVerificationStatus,
} from "@/types/telegram";

interface UseTelegramConnectionProps {
    nodeData: Record<string, unknown>;
    onDataChange: (updates: Record<string, unknown>) => void;
    authenticated: boolean;
}

interface UseTelegramConnectionReturn {
    // Data
    botInfo: TelegramBotInfo | null;
    connections: TelegramConnection[];
    chats: TelegramChat[];
    loading: TelegramLoadingState;
    notification: TelegramNotification | null;

    // Selected state
    selectedConnection: TelegramConnection | null;

    // Message
    telegramMessage: string;

    // Verification
    verificationCode: TelegramVerificationCode | null;
    verificationStatus: TelegramVerificationStatus | null;

    // Actions
    actions: {
        loadBotInfo: () => Promise<void>;
        loadChats: () => Promise<void>;
        loadConnections: () => Promise<TelegramConnection[] | undefined>;
        saveConnection: (chat: TelegramChat) => Promise<void>;
        deleteConnection: (connectionId: string) => Promise<void>;
        sendPreviewMessage: () => Promise<void>;
        updateMessage: (message: string) => void;
        selectConnection: (connection: TelegramConnection) => void;
        clearNotification: () => void;
        // Verification actions
        generateVerificationCode: () => Promise<void>;
        checkVerificationStatus: () => Promise<void>;
        cancelVerificationCode: () => Promise<void>;
    };
}

/**
 * Custom hook for Telegram integration using centralized bot
 */
export function useTelegramConnection({
    nodeData,
    onDataChange,
    authenticated,
}: UseTelegramConnectionProps): UseTelegramConnectionReturn {
    const { getPrivyAccessToken } = usePrivyWallet();

    // State
    const [botInfo, setBotInfo] = useState<TelegramBotInfo | null>(null);
    const [connections, setConnections] = useState<TelegramConnection[]>([]);
    const [chats, setChats] = useState<TelegramChat[]>([]);
    const [selectedConnection, setSelectedConnection] = useState<TelegramConnection | null>(null);
    const [telegramMessage, setTelegramMessage] = useState(
        (nodeData.telegramMessage as string) || ""
    );
    const [notification, setNotification] = useState<TelegramNotification | null>(null);
    const [loading, setLoading] = useState<TelegramLoadingState>({
        bot: false,
        chats: false,
        connections: false,
        saving: false,
        sending: false,
        verification: false,
    });

    // Verification state
    const [verificationCode, setVerificationCode] = useState<TelegramVerificationCode | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<TelegramVerificationStatus | null>(null);

    const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup
    useEffect(() => {
        return () => {
            if (notificationTimeoutRef.current) {
                clearTimeout(notificationTimeoutRef.current);
            }
        };
    }, []);

    // Show notification
    const showNotification = useCallback((type: TelegramNotification["type"], message: string) => {
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }
        setNotification({ type, message });
        notificationTimeoutRef.current = setTimeout(() => {
            setNotification(null);
        }, type === "error" ? 5000 : 3000);
    }, []);

    const clearNotification = useCallback(() => {
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }
        setNotification(null);
    }, []);

    // Load bot info
    const loadBotInfo = useCallback(async () => {
        setLoading((prev) => ({ ...prev, bot: true }));
        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) return;

            const response = await fetch(
                buildApiUrl(`${API_CONFIG.ENDPOINTS.TELEGRAM.CONNECTIONS}/../bot`),
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setBotInfo(data.data);
            } else {
                const errData = await response.json().catch(() => ({}));
                showNotification("error", errData.error?.message || "Failed to load bot info");
            }
        } catch {
            // console.error("Failed to load bot info:", error);
        } finally {
            setLoading((prev) => ({ ...prev, bot: false }));
        }
    }, [getPrivyAccessToken, showNotification]);

    // Load available chats
    const loadChats = useCallback(async () => {
        setLoading((prev) => ({ ...prev, chats: true }));
        clearNotification();
        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) return;

            const response = await fetch(
                buildApiUrl(`${API_CONFIG.ENDPOINTS.TELEGRAM.CONNECTIONS}/../chats`),
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setChats(data.data.chats || []);
                if (data.data.chats.length === 0) {
                    showNotification("info", "No chats found. Add the bot to a chat and send a message first.");
                }
            } else {
                showNotification("error", "Failed to load chats");
            }
        } catch {
            // console.error("Failed to load chats:", error);
            showNotification("error", "Failed to load chats");
        } finally {
            setLoading((prev) => ({ ...prev, chats: false }));
        }
    }, [getPrivyAccessToken, showNotification, clearNotification]);

    // Load user's connections. Returns the connections array when successful (for callers that need to pick one).
    const loadConnections = useCallback(async (): Promise<TelegramConnection[] | undefined> => {
        setLoading((prev) => ({ ...prev, connections: true }));
        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) return undefined;

            const response = await fetch(
                buildApiUrl(API_CONFIG.ENDPOINTS.TELEGRAM.CONNECTIONS),
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (response.ok) {
                const data = await response.json();
                const list = data.data.connections || [];
                setConnections(list);

                // Auto-select if nodeData has a connection
                if (nodeData.telegramConnectionId) {
                    const conn = list.find(
                        (c: TelegramConnection) => c.id === nodeData.telegramConnectionId
                    );
                    if (conn) {
                        setSelectedConnection(conn);
                    }
                }
                return list;
            }
            return undefined;
        } catch {
            // console.error("Failed to load connections:", error);
            return undefined;
        } finally {
            setLoading((prev) => ({ ...prev, connections: false }));
        }
    }, [getPrivyAccessToken, nodeData.telegramConnectionId]);

    // Save a chat as connection
    const saveConnection = useCallback(async (chat: TelegramChat) => {
        setLoading((prev) => ({ ...prev, saving: true }));
        clearNotification();
        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) {
                showNotification("error", "Please log in");
                return;
            }

            const response = await fetch(
                buildApiUrl(API_CONFIG.ENDPOINTS.TELEGRAM.CONNECTIONS),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        chatId: chat.id,
                        chatTitle: chat.title,
                        chatType: chat.type,
                    }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                const connection = data.data.connection;

                // Update node data
                onDataChange({
                    telegramConnectionId: connection.id,
                    telegramChatId: connection.chatId,
                    telegramChatTitle: connection.chatTitle,
                    telegramChatType: connection.chatType,
                });

                setSelectedConnection(connection);
                await loadConnections();
                showNotification("success", `Connected to ${chat.title}`);
            } else {
                const errData = await response.json().catch(() => ({}));
                showNotification("error", errData.error?.message || "Failed to save connection");
            }
        } catch {
            // console.error("Failed to save connection:", error);
            showNotification("error", "Failed to save connection");
        } finally {
            setLoading((prev) => ({ ...prev, saving: false }));
        }
    }, [getPrivyAccessToken, onDataChange, loadConnections, showNotification, clearNotification]);

    // Delete connection
    const deleteConnection = useCallback(async (connectionId: string) => {
        clearNotification();
        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) return;

            const response = await fetch(
                buildApiUrl(`${API_CONFIG.ENDPOINTS.TELEGRAM.CONNECTIONS}/${connectionId}`),
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );

            if (response.ok) {
                if (selectedConnection?.id === connectionId) {
                    setSelectedConnection(null);
                    onDataChange({
                        telegramConnectionId: undefined,
                        telegramChatId: undefined,
                        telegramChatTitle: undefined,
                        telegramChatType: undefined,
                    });
                }
                await loadConnections();
                showNotification("success", "Connection deleted");
            }
        } catch {
            // console.error("Failed to delete connection:", error);
            showNotification("error", "Failed to delete connection");
        }
    }, [getPrivyAccessToken, selectedConnection, onDataChange, loadConnections, showNotification, clearNotification]);

    // Send preview message
    const sendPreviewMessage = useCallback(async () => {
        if (!selectedConnection) {
            showNotification("error", "No connection selected");
            return;
        }

        const message = telegramMessage.trim();
        if (!message) {
            showNotification("error", "Please enter a message");
            return;
        }

        setLoading((prev) => ({ ...prev, sending: true }));
        clearNotification();

        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) return;

            const response = await fetch(
                buildApiUrl(API_CONFIG.ENDPOINTS.TELEGRAM.SEND),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        connectionId: selectedConnection.id,
                        text: message,
                    }),
                }
            );

            if (response.ok) {
                showNotification("success", "✅ Message sent!");
            } else {
                const errData = await response.json().catch(() => ({}));
                showNotification("error", errData.error?.message || "Failed to send message");
            }
        } catch {
            // console.error("Failed to send message:", error);
            showNotification("error", "Failed to send message");
        } finally {
            setLoading((prev) => ({ ...prev, sending: false }));
        }
    }, [selectedConnection, telegramMessage, getPrivyAccessToken, showNotification, clearNotification]);

    // Update message
    const updateMessage = useCallback((message: string) => {
        setTelegramMessage(message);
        onDataChange({ telegramMessage: message });
    }, [onDataChange]);

    // Select connection
    const selectConnection = useCallback((connection: TelegramConnection) => {
        setSelectedConnection(connection);
        onDataChange({
            telegramConnectionId: connection.id,
            telegramChatId: connection.chatId,
            telegramChatTitle: connection.chatTitle,
            telegramChatType: connection.chatType,
        });
    }, [onDataChange]);

    // ============================================
    // VERIFICATION CODE FUNCTIONS
    // ============================================

    // Generate a new verification code
    const generateVerificationCode = useCallback(async () => {
        setLoading((prev) => ({ ...prev, verification: true }));
        clearNotification();
        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) {
                showNotification("error", "Please log in to generate a code");
                return;
            }

            const response = await fetch(
                buildApiUrl(API_CONFIG.ENDPOINTS.TELEGRAM.VERIFICATION.GENERATE),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setVerificationCode(data.data);
                showNotification("success", "Verification code generated! Follow the instructions below.");
            } else {
                const errData = await response.json().catch(() => ({}));
                showNotification("error", errData.error?.message || "Failed to generate verification code");
            }
        } catch {
            // console.error("Failed to generate verification code:", error);
            showNotification("error", "Failed to generate verification code");
        } finally {
            setLoading((prev) => ({ ...prev, verification: false }));
        }
    }, [getPrivyAccessToken, showNotification, clearNotification]);

    // Check verification status
    const checkVerificationStatus = useCallback(async () => {
        setLoading((prev) => ({ ...prev, verification: true }));
        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) return;

            const response = await fetch(
                buildApiUrl(API_CONFIG.ENDPOINTS.TELEGRAM.VERIFICATION.STATUS),
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setVerificationStatus(data.data);

                // If verified, reload connections, auto-select the new connection, and show success
                if (data.data.status === 'verified') {
                    showNotification("success", `✅ Chat "${data.data.chat?.title}" verified and connected!`);
                    setVerificationCode(null); // Clear the code display
                    const connections = await loadConnections();
                    const verifiedChat = data.data.chat;
                    if (verifiedChat && connections?.length) {
                        const connection = connections.find(
                            (c) => String(c.chatId) === String(verifiedChat.id) || c.chatTitle === verifiedChat.title
                        );
                        if (connection) {
                            setSelectedConnection(connection);
                            onDataChange({
                                telegramConnectionId: connection.id,
                                telegramChatId: connection.chatId,
                                telegramChatTitle: connection.chatTitle,
                                telegramChatType: connection.chatType,
                            });
                        }
                    }
                } else if (data.data.status === 'expired') {
                    showNotification("info", "Verification code expired. Generate a new one.");
                    setVerificationCode(null);
                }
            }
        } catch {
            // console.error("Failed to check verification status:", error);
        } finally {
            setLoading((prev) => ({ ...prev, verification: false }));
        }
    }, [getPrivyAccessToken, showNotification, loadConnections, onDataChange]);

    // Cancel pending verification code
    const cancelVerificationCode = useCallback(async () => {
        setLoading((prev) => ({ ...prev, verification: true }));
        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) return;

            const response = await fetch(
                buildApiUrl(API_CONFIG.ENDPOINTS.TELEGRAM.VERIFICATION.CANCEL),
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );

            if (response.ok) {
                setVerificationCode(null);
                setVerificationStatus(null);
                showNotification("info", "Verification cancelled. You can generate a new code.");
            }
        } catch {
            // console.error("Failed to cancel verification:", error);
        } finally {
            setLoading((prev) => ({ ...prev, verification: false }));
        }
    }, [getPrivyAccessToken, showNotification]);

    // Load on mount
    useEffect(() => {
        if (authenticated) {
            loadBotInfo();
            loadConnections();
        }
    }, [authenticated, loadBotInfo, loadConnections]);

    return {
        botInfo,
        connections,
        chats,
        loading,
        notification,
        selectedConnection,
        telegramMessage,
        verificationCode,
        verificationStatus,
        actions: {
            loadBotInfo,
            loadChats,
            loadConnections,
            saveConnection,
            deleteConnection,
            sendPreviewMessage,
            updateMessage,
            selectConnection,
            clearNotification,
            // Verification actions
            generateVerificationCode,
            checkVerificationStatus,
            cancelVerificationCode,
        },
    };
}

