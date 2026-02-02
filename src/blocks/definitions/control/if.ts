import type { BlockDefinition } from "../../types";

/**
 * If/Else Block
 * Allows conditional branching in workflows
 */
export const ifBlock: BlockDefinition = {
  id: "if",
  label: "If/Else",
  iconName: "IfElseLogo",
  description: "Conditional branching based on a rule",
  category: "control",
  nodeType: "if",
  backendType: "IF",
  defaultData: {
    label: "If/Else",
    description: "Branch based on condition",
    status: "idle" as const,
    // Default condition configuration
    leftPath: "",
    operator: "equals",
    rightValue: "",
  },
};

export default ifBlock;
