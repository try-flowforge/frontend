import type { BlockDefinition } from "../../types";

/**
 * Maximum number of cases allowed per Switch node (including default)
 */
export const MAX_SWITCH_CASES = 5;

/**
 * Interface for a single Switch case
 */
export interface SwitchCaseData {
  id: string;
  label: string;
  operator: string;
  compareValue: string;
  isDefault?: boolean;
}

/**
 * Creates a default case for Switch node
 */
export const createDefaultCase = (): SwitchCaseData => ({
  id: "default",
  label: "Default",
  operator: "equals",
  compareValue: "",
  isDefault: true,
});

/**
 * Creates a new case for Switch node
 */
export const createNewCase = (caseNumber: number): SwitchCaseData => ({
  id: `case_${caseNumber}`,
  label: `Case ${caseNumber}`,
  operator: "equals",
  compareValue: "",
  isDefault: false,
});

/**
 * Switch Block
 * Allows multi-branch conditional routing in workflows
 * - One default case (always present, cannot be removed)
 * - Up to 4 additional cases (max 5 total)
 */
export const switchBlock: BlockDefinition = {
  id: "switch",
  label: "Switch",
  iconName: "SwitchLogo",
  description: "Multi-branch routing based on conditions",
  category: "control",
  nodeType: "switch",
  backendType: "SWITCH",
  defaultData: {
    label: "Switch",
    description: "Route to different branches based on conditions",
    status: "idle" as const,
    // Default configuration
    valuePath: "",
    cases: [createDefaultCase()], // Start with just the default case
  },
};

export default switchBlock;
