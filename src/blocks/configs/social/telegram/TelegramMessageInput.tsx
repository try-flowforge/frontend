"use client";

import React, { useRef } from "react";
import { LuLoader, LuSend, LuMessageSquare } from "react-icons/lu";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { TemplateFieldSelector } from "@/blocks/configs/shared/TemplateFieldSelector";
import type { TelegramConnection } from "@/types/telegram";

interface TelegramMessageInputProps {
  /** Selected connection for display */
  selectedConnection: TelegramConnection;
  /** Current message value */
  message: string;
  /** Loading state for sending */
  isSending: boolean;
  /** Step number for display */
  stepNumber?: number;
  /** Current node ID for template field selector */
  currentNodeId: string;
  /** Called when message changes */
  onMessageChange: (message: string) => void;
  /** Called to send preview message */
  onSendPreview: () => void;
  /** Called to open message viewer */
  onViewMessages: () => void;
}

/**
 * TelegramMessageInput - Message template configuration for Telegram
 *
 * Features:
 * - Message input with character display
 * - Preview send functionality
 * - View incoming messages button
 */
export const TelegramMessageInput = React.memo(function TelegramMessageInput({
  selectedConnection,
  message,
  isSending,
  stepNumber = 3,
  currentNodeId,
  onMessageChange,
  onSendPreview,
  onViewMessages,
}: TelegramMessageInputProps) {
  const canSend = message.trim().length > 0 && !isSending;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <SimpleCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Typography
          variant="bodySmall"
          className="font-semibold text-foreground"
        >
          {stepNumber}. Message Template
        </Typography>
        <Button
          onClick={onViewMessages}
          className="gap-1"
        >
          <LuMessageSquare className="w-3 h-3" aria-hidden="true" />
          View Messages
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        Sending to:{" "}
        <span className="font-medium text-foreground">
          {selectedConnection.chatTitle}
        </span>
      </div>

      {/* Template Field Selector */}
      <TemplateFieldSelector
        currentNodeId={currentNodeId}
        onInsertField={(placeholder) => {
          if (textareaRef.current) {
            const textarea = textareaRef.current;
            const start = textarea.selectionStart || 0;
            const end = textarea.selectionEnd || 0;
            const newValue =
              message.substring(0, start) +
              placeholder +
              message.substring(end);
            onMessageChange(newValue);
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
            }, 0);
          } else {
            onMessageChange(message + placeholder);
          }
        }}
        inputRef={textareaRef}
      />

      <div className="space-y-2">
        <label htmlFor="telegram-message" className="sr-only">
          Telegram message template
        </label>
        <textarea
          ref={textareaRef}
          id="telegram-message"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Hello from FlowForge! 🚀 Use the field selector above to insert dynamic values."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          aria-describedby="telegram-message-hint"
        />
        <Typography
          id="telegram-message-hint"
          variant="caption"
          className="text-muted-foreground"
        >
          {message.length} characters
        </Typography>
      </div>

      <Button
        onClick={onSendPreview}
        disabled={!canSend}
        className="w-full gap-2"
      >
        {isSending ? (
          <>
            <LuLoader className="w-4 h-4 animate-spin" aria-hidden="true" />
            Sending...
          </>
        ) : (
          <>
            <LuSend className="w-4 h-4" aria-hidden="true" />
            Send Preview
          </>
        )}
      </Button>
    </SimpleCard>
  );
});
