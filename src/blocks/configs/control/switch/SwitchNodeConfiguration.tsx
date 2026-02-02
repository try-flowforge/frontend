"use client";

import React, { useCallback, useMemo } from "react";
import { LuPlus, LuTrash2, LuCircleAlert } from "react-icons/lu";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Typography } from "@/components/ui/Typography";
import { FormInput } from "@/components/ui/FormInput";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown";
import {
  MAX_SWITCH_CASES,
  createNewCase,
  createDefaultCase,
  type SwitchCaseData,
} from "@/blocks/definitions/control/switch";
import type { SwitchNodeData } from "@/types/node-data";

interface SwitchNodeConfigurationProps {
  nodeData: SwitchNodeData;
  handleDataChange: (updates: Partial<SwitchNodeData>) => void;
}

const OPERATORS: DropdownOption[] = [
  { value: "equals", label: "Equals (==)" },
  { value: "notEquals", label: "Not Equals (!=)" },
  { value: "contains", label: "Contains" },
  { value: "gt", label: "Greater Than (>)" },
  { value: "lt", label: "Less Than (<)" },
  { value: "gte", label: "Greater or Equal (>=)" },
  { value: "lte", label: "Less or Equal (<=)" },
  { value: "isEmpty", label: "Is Empty" },
  { value: "regex", label: "Regex Match" },
];

// Color mapping for case labels/badges
const CASE_COLORS = [
  {
    bg: "bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
  },
  {
    bg: "bg-green-500/20",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-500/30",
  },
  {
    bg: "bg-yellow-500/20",
    text: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-500/30",
  },
  {
    bg: "bg-purple-500/20",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/30",
  },
];

const DEFAULT_CASE_COLOR = {
  bg: "bg-gray-500/20",
  text: "text-gray-600 dark:text-gray-400",
  border: "border-gray-500/30",
};

export const SwitchNodeConfiguration = React.memo(
  function SwitchNodeConfiguration({
    nodeData,
    handleDataChange,
  }: SwitchNodeConfigurationProps) {
    const valuePath = (nodeData.valuePath as string) || "";

    // Initialize cases with default if empty - memoized to prevent unnecessary recalculations
    const cases = useMemo<SwitchCaseData[]>(
      () => (nodeData.cases as SwitchCaseData[]) || [createDefaultCase()],
      [nodeData.cases]
    );

    // Ensure default case exists - memoized to prevent unnecessary recalculations
    const normalizedCases = useMemo(() => {
      const hasDefaultCase = cases.some((c) => c.isDefault);
      return hasDefaultCase ? cases : [...cases, createDefaultCase()];
    }, [cases]);

    // Non-default cases for counting and display
    const nonDefaultCases = useMemo(
      () => normalizedCases.filter((c) => !c.isDefault),
      [normalizedCases]
    );
    const defaultCase = useMemo(
      () => normalizedCases.find((c) => c.isDefault),
      [normalizedCases]
    );

    const canAddCase = normalizedCases.length < MAX_SWITCH_CASES;

    // Update value path
    const handleValuePathChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        handleDataChange({ valuePath: e.target.value });
      },
      [handleDataChange]
    );

    // Add a new case
    const handleAddCase = useCallback(() => {
      if (!canAddCase) return;

      const newCaseNumber = nonDefaultCases.length + 1;
      const newCase = createNewCase(newCaseNumber);

      // Insert before default case
      const updatedCases = [...nonDefaultCases, newCase];
      if (defaultCase) {
        updatedCases.push(defaultCase);
      }

      handleDataChange({ cases: updatedCases });
    }, [canAddCase, nonDefaultCases, defaultCase, handleDataChange]);

    // Remove a case
    const handleRemoveCase = useCallback(
      (caseId: string) => {
        // Cannot remove default case
        const updatedCases = normalizedCases.filter((c) => c.id !== caseId);
        handleDataChange({ cases: updatedCases });
      },
      [normalizedCases, handleDataChange]
    );

    // Update a specific case
    const handleCaseChange = useCallback(
      (caseId: string, field: keyof SwitchCaseData, value: string) => {
        const updatedCases = normalizedCases.map((c) =>
          c.id === caseId ? { ...c, [field]: value } : c
        );
        handleDataChange({ cases: updatedCases });
      },
      [normalizedCases, handleDataChange]
    );

    // Get color for a case index
    const getCaseColor = (index: number) => {
      return CASE_COLORS[index % CASE_COLORS.length];
    };

    return (
      <div className="space-y-4">
        {/* Value Path Configuration */}
        <SimpleCard className="space-y-4 p-5">
          <div className="space-y-1 mb-4">
            <Typography
              variant="h5"
              className="font-semibold text-foreground"
            >
              Switch Configuration
            </Typography>
          </div>

          <FormInput
            label="Value Path(Value to compare)"
            type="text"
            value={valuePath}
            onChange={handleValuePathChange}
            placeholder="100"
          />
        </SimpleCard>

        {/* Cases Configuration */}
        <SimpleCard className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Typography
                variant="bodySmall"
                className="font-semibold text-foreground"
              >
                Cases ({normalizedCases.length}/{MAX_SWITCH_CASES})
              </Typography>
            </div>

            <Button
              onClick={handleAddCase}
              disabled={!canAddCase}
              className="h-7 text-xs gap-1"
            >
              <LuPlus className="w-3 h-3" />
              Add Case
            </Button>
          </div>

          {!canAddCase && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
              <LuCircleAlert className="w-3.5 h-3.5" />
              Maximum {MAX_SWITCH_CASES} cases reached
            </div>
          )}

          <div className="space-y-3">
            {/* Non-default cases */}
            {nonDefaultCases.map((switchCase, index) => {
              const color = getCaseColor(index);
              return (
                <div
                  key={switchCase.id}
                  className={`pl-2 py-2 space-y-2 border-l-2 ${color.border}`}
                >
                  {/* Case header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${color.bg.replace(
                          "/20",
                          ""
                        )}`}
                      />
                      <Input
                        value={switchCase.label}
                        onChange={(e) =>
                          handleCaseChange(
                            switchCase.id,
                            "label",
                            e.target.value
                          )
                        }
                        className="h-auto text-xs font-medium bg-transparent border-none p-0 focus:ring-0 focus-visible:ring-0 shadow-none"
                        placeholder={`Case ${index + 1}`}
                      />
                    </div>
                    <Button
                      onClick={() => handleRemoveCase(switchCase.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      aria-label={`Remove ${switchCase.label}`}
                    >
                      <LuTrash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Operator selection */}
                  <Dropdown
                    label="Operator"
                    value={switchCase.operator}
                    onChange={(e) =>
                      handleCaseChange(
                        switchCase.id,
                        "operator",
                        e.target.value
                      )
                    }
                    options={OPERATORS}
                    placeholder="Select operator"
                    aria-label="Comparison operator"
                  />

                  {/* Compare value (not shown for isEmpty) */}
                  {switchCase.operator !== "isEmpty" && (
                    <FormInput
                      label="Compare Value(Value to compare against)"
                      type="text"
                      value={switchCase.compareValue}
                      onChange={(e) =>
                        handleCaseChange(
                          switchCase.id,
                          "compareValue",
                          e.target.value
                        )
                      }
                      placeholder="value to match"
                    />
                  )}
                </div>
              );
            })}

            {/* Default case - always last, cannot be removed */}
            {defaultCase && (
              <div
                className={`p-2 rounded-md border border-dashed ${DEFAULT_CASE_COLOR.border} bg-background/40`}
              >
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <LuCircleAlert className="w-3 h-3 text-amber-500" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <Typography
                        variant="bodySmall"
                        className={`font-semibold ${DEFAULT_CASE_COLOR.text}`}
                      >
                        Default path
                      </Typography>
                      <span className="text-[8px] uppercase tracking-wide text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                        Fallback
                      </span>
                    </div>
                    <Typography variant="bodySmall">
                      Used when no other case matches.
                    </Typography>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SimpleCard>
      </div>
    );
  }
);
