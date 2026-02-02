import type { BlockDefinition } from "../../types";

/**
 * Telegram Block
 * Allows sending messages via Telegram
 */
export const telegramBlock: BlockDefinition = {
  id: "telegram",
  label: "Telegram",
  iconName: "TelegramLogo",
  description: "Send messages via Telegram",
  category: "social",
  nodeType: "telegram",
  backendType: "TELEGRAM",
  configComponentProps: {
    requiresAuth: true,
  },
  defaultData: {
    label: "Telegram",
    description: "Send Telegram message",
    status: "idle" as const,
    telegramConnectionId: undefined,
    telegramConnectionName: undefined,
    telegramBotUsername: undefined,
    telegramChatId: undefined,
    telegramChatTitle: undefined,
    telegramChatType: undefined,
    telegramMessage: "Hello from FlowForge! 🚀",
  },
};

export default telegramBlock;
