import type { BlockDefinition } from "../../types";

/**
 * Mail Block
 * Allows sending email notifications
 */
export const mailBlock: BlockDefinition = {
  id: "mail",
  label: "Mail",
  iconName: "MailLogo",
  description: "Send email notifications",
  category: "social",
  nodeType: "mail",
  backendType: "EMAIL",
  defaultData: {
    label: "Mail",
    description: "Send email",
    status: "idle" as const,
  },
};

export default mailBlock;
