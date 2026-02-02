import type { BlockDefinition } from "../../types";

/**
 * Start Block
 * The entry point of every workflow - always present on canvas
 */
export const startBlock: BlockDefinition = {
  id: "start",
  label: "Start",
  iconName: "StartLogo",
  description: "Workflow starting point",
  category: "triggers",
  nodeType: "start",
  backendType: "START",
  defaultData: {
    label: "Start",
    description: "Workflow entry point",
    status: "idle" as const,
  },
  hidden: true,
};

export default startBlock;
