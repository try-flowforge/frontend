"use client";

/**
 * Nodes that require authentication:
 * - WalletNode: Uses this component to show wallet connection status
 * - SwapNode: Requires auth for wallet transactions (shows login prompt when not authenticated)
 * - LendingNode: Requires auth for wallet transactions (shows login prompt when not authenticated)
 * - EmailNode: Requires auth for email configuration (shows login prompt when not authenticated)
 * - TelegramNode: Requires auth for Telegram bot configuration (shows login prompt when not authenticated)
 * - SlackNode: Requires auth for Slack integration (uses SlackAuthenticationCard)
*/

import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { usePrivy } from "@privy-io/react-auth";
import { LuLock } from "react-icons/lu";

export function AuthenticationStatus() {
  const { authenticated } = usePrivy();

  // Don't show component if user is already authenticated
  if (authenticated) {
    return null;
  }

  return (
    <SimpleCard className="p-5">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
          <LuLock className="w-6 h-6 text-white" />
        </div>
        <div className="space-y-1">
          <Typography
            variant="bodySmall"
            align="center"
            className="font-semibold text-foreground"
          >
            Authentication Required
          </Typography>
          <Typography
            variant="caption"
            align="center"
            className="text-muted-foreground"
          >
            Sign in to build, configure, and execute your automated workflows securely
          </Typography>
        </div>
      </div>
    </SimpleCard>
  );
}
