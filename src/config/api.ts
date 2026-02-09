/**
 * API Configuration
 * Centralized API configuration to avoid re-evaluation on every render
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL!,

  ENDPOINTS: {
    SLACK: {
      CONNECTIONS: "/integrations/slack/connections",
      WEBHOOKS: "/integrations/slack/webhooks",
      TEST: "/integrations/slack/test",
      SEND: "/integrations/slack/send",
      OAUTH_AUTHORIZE: "/integrations/slack/oauth/authorize",
    },
    TELEGRAM: {
      CONNECTIONS: "/integrations/telegram/connections",
      TEST: "/integrations/telegram/test",
      SEND: "/integrations/telegram/send",
      VERIFICATION: {
        GENERATE: "/integrations/telegram/verification/generate",
        STATUS: "/integrations/telegram/verification/status",
        CANCEL: "/integrations/telegram/verification/cancel",
      },
    },
    EMAIL: {
      TEST: "/integrations/email/test",
      SEND: "/integrations/email/send",
    },
    WORKFLOWS: {
      CREATE: "/workflows",
      LIST: "/workflows",
      GET: "/workflows/:id",
      UPDATE: "/workflows/:id",
      DELETE: "/workflows/:id",
      EXECUTE: "/workflows/:id/execute",
      EXECUTION_STATUS: "/workflows/executions/:executionId",
    },
    SWAP: {
      QUOTE: "/swaps/quote",
      BUILD_TRANSACTION: "/swaps/build-transaction",
      BUILD_SAFE_TRANSACTION: "/swaps/build-safe-transaction",
      EXECUTE_WITH_SIGNATURE: "/swaps/execute-with-signature",
      PROVIDERS: "/swaps/providers",
      EXECUTIONS: "/swaps/executions",
    },
    LENDING: {
      QUOTE: "/lending/quote",
      POSITION: "/lending/position",
      ACCOUNT: "/lending/account",
      ASSET: "/lending/asset",
      ASSETS: "/lending/assets",
      PROVIDERS: "/lending/providers",
      EXECUTIONS: "/lending/executions",
    },
    USERS: {
      ME: "/users/me",
      GET_BY_ADDRESS: "/users/address/:address",
      CREATE: "/users",
    },
    RELAY: {
      CREATE_SAFE: "/relay/create-safe",
      ENABLE_MODULE: "/relay/enable-module",
    },
    META: {
      RUNTIME_CONFIG: "/meta/runtime-config",
    },
    ORACLE: {
      FEEDS: "/oracle/feeds",
      CONFIG: "/oracle/config",
    },
    ENS: {
      SUBDOMAIN_REGISTERED: "/ens/subdomain-registered",
      SUBDOMAINS: "/ens/subdomains",
    },
  },

  // OAuth polling configuration
  OAUTH: {
    POLL_INTERVAL_MS: 1000,
    MAX_POLL_DURATION_MS: 300000,
    POPUP_WIDTH: 600,
    POPUP_HEIGHT: 700,
  },

  // Notification auto-dismiss durations
  NOTIFICATION: {
    SUCCESS_DURATION_MS: 3000,
    ERROR_DURATION_MS: 5000,
    INFO_DURATION_MS: 4000,
  },
} as const;

/**
 * Helper to build full API URL.
 * Throws if NEXT_PUBLIC_API_BASE_URL is not set so misconfiguration is obvious.
 */
export function buildApiUrl(endpoint: string): string {
  const base = API_CONFIG.BASE_URL;
  if (typeof base !== "string" || base === "" || base === "undefined") {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not set. Add it to .env.local (e.g. http://localhost:3001/api/v1)."
    );
  }
  return `${base}${endpoint}`;
}
