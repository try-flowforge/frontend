"use client";

import React, { useCallback } from "react";
import { LuBot, LuLoader, LuRefreshCw, LuTrash2 } from "react-icons/lu";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import type { TelegramChat, TelegramConnection } from "@/types/telegram";

interface TelegramChatSelectorProps {
  /** Available chats from bot discovery */
  chats: TelegramChat[];
  /** Saved connections for this user */
  connections: TelegramConnection[];
  /** Currently selected connection */
  selectedConnection: TelegramConnection | null;
  /** Loading states */
  loading: {
    chats: boolean;
    saving: boolean;
  };
  /** Step number for display */
  stepNumber?: number;
  /** Called to search for chats */
  onFindChats: () => void;
  /** Called when a chat is selected to create connection */
  onSelectChat: (chat: TelegramChat) => void;
  /** Called when an existing connection is selected */
  onSelectConnection: (connection: TelegramConnection) => void;
  /** Called to delete a connection */
  onDeleteConnection: (connectionId: string) => void;
}

/**
 * TelegramChatSelector - Component for selecting Telegram chats
 *
 * Features:
 * - Search for new chats where bot is added
 * - View saved connections
 * - Select existing connection
 * - Delete connections
 * - Proper keyboard accessibility
 */
export const TelegramChatSelector = React.memo(function TelegramChatSelector({
  chats,
  connections,
  selectedConnection,
  loading,
  stepNumber = 2,
  onFindChats,
  onSelectChat,
  onSelectConnection,
  onDeleteConnection,
}: TelegramChatSelectorProps) {
  // Handle keyboard navigation for connection items
  const handleConnectionKeyDown = useCallback(
    (e: React.KeyboardEvent, connection: TelegramConnection) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelectConnection(connection);
      }
    },
    [onSelectConnection]
  );

  // Handle keyboard navigation for chat items
  const handleChatKeyDown = useCallback(
    (e: React.KeyboardEvent, chat: TelegramChat) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelectChat(chat);
      }
    },
    [onSelectChat]
  );

  return (
    <SimpleCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Typography
          variant="bodySmall"
          className="font-semibold text-foreground"
        >
          {stepNumber}. Select Chat
        </Typography>
        <Button
          onClick={onFindChats}
          disabled={loading.chats}
          className="gap-1"
        >
          {loading.chats ? (
            <LuLoader className="w-3 h-3 animate-spin" aria-hidden="true" />
          ) : (
            <LuRefreshCw className="w-3 h-3" aria-hidden="true" />
          )}
          Find Chats
        </Button>
      </div>

      {/* Available chats dropdown */}
      {chats.length > 0 && (
        <div className="space-y-2">
          <Typography variant="caption" className="text-muted-foreground">
            Select a chat to connect:
          </Typography>
          <div
            className="space-y-1"
            role="listbox"
            aria-label="Available chats"
          >
            {chats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                role="option"
                onClick={() => onSelectChat(chat)}
                onKeyDown={(e) => handleChatKeyDown(e, chat)}
                disabled={loading.saving}
                className="w-full p-2 text-left rounded-lg border border-border hover:bg-secondary/30 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-selected={false}
              >
                {chat.type === "channel"
                  ? "# "
                  : chat.type === "private"
                    ? "@ "
                    : ""}
                {chat.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Saved connections */}
      {connections.length > 0 && (
        <div className="space-y-2">
          <Typography variant="caption" className="text-muted-foreground">
            Your connections:
          </Typography>
          <div role="listbox" aria-label="Saved connections">
            {connections.map((conn) => (
              <div
                key={conn.id}
                role="option"
                tabIndex={0}
                aria-selected={selectedConnection?.id === conn.id}
                className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${selectedConnection?.id === conn.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-secondary/30"
                  }`}
                onClick={() => onSelectConnection(conn)}
                onKeyDown={(e) => handleConnectionKeyDown(e, conn)}
              >
                <div className="flex items-center gap-2">
                  <LuBot
                    className="w-4 h-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="text-sm">{conn.chatTitle}</span>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConnection(conn.id);
                  }}
                  className="p-1 h-auto text-muted-foreground hover:text-destructive"
                  aria-label={`Delete connection to ${conn.chatTitle}`}
                >
                  <LuTrash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No connections */}
      {connections.length === 0 && chats.length === 0 && !loading.chats && (
        <Typography
          variant="caption"
          className="text-muted-foreground text-center py-2"
        >
          Click &quot;Find Chats&quot; after adding the bot to your chat
        </Typography>
      )}
    </SimpleCard>
  );
});
