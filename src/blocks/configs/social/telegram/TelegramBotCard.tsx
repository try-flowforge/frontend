"use client";

import React from "react";
import { LuBot, LuLoader } from "react-icons/lu";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Typography } from "@/components/ui/Typography";

interface TelegramBotInfo {
  id: number;
  username: string;
  firstName: string;
}

interface TelegramBotCardProps {
  botInfo: TelegramBotInfo | null;
  loading: boolean;
  stepNumber?: number;
}

/**
 * TelegramBotCard - Displays the FlowForge Telegram bot information
 */
export const TelegramBotCard = React.memo(function TelegramBotCard({
  botInfo,
  loading,
  stepNumber = 1,
}: TelegramBotCardProps) {
  return (
    <SimpleCard className="p-4 space-y-3">
      <Typography variant="bodySmall" className="font-semibold text-foreground">
        {stepNumber}. FlowForge Telegram Bot
      </Typography>

      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <LuLoader className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">
            Loading bot info...
          </span>
        </div>
      ) : botInfo ? (
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="flex items-center gap-2">
            <LuBot className="w-5 h-5 text-primary" aria-hidden="true" />
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
  );
});
