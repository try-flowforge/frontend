import type { BlockDefinition } from "../../types";

/**
 * Time Block (Schedule Trigger)
 * Configures when a workflow should be executed on a schedule.
 */
export const timeBlock: BlockDefinition = {
  id: "time-block",
  label: "Time Block",
  iconName: "StartLogo",
  description: "Schedule when this workflow should run",
  category: "triggers",
  nodeType: "time-block",
  backendType: "TIME_BLOCK",
  defaultData: {
    label: "Time Block",
    description: "Schedule this workflow",
    status: "idle" as const,
    runAt: "",
    timezone: "",
    recurrenceType: "NONE",
    intervalSeconds: undefined,
    cronExpression: "",
    untilAt: "",
    maxRuns: undefined,
  },
};

export default timeBlock;

