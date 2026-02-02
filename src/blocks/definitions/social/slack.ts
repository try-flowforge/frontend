import type { BlockDefinition } from "../../types";

/**
 * Slack Block
 * Allows sending messages via Slack
 */
export const slackBlock: BlockDefinition = {
  id: "slack",
  label: "Slack",
  iconName: "SlackLogo",
  description: "Send messages via Slack",
  category: "social",
  nodeType: "slack",
  backendType: "SLACK",
  configComponentProps: {
    requiresAuth: true,
  },
  defaultData: {
    label: "Slack",
    description: "Send Slack message",
    status: "idle" as const,
    slackConnectionType: "webhook" as "webhook" | "oauth",
    slackConnectionId: undefined,
    slackConnectionName: undefined,
    slackTeamName: undefined,
    slackChannelId: undefined,
    slackChannelName: undefined,
    testMessage: "Hello from FlowForge! 🚀",
  },
};

export default slackBlock;
