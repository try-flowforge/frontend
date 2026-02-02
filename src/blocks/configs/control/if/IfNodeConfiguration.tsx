"use client";

import { useCallback } from "react";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Typography } from "@/components/ui/Typography";
import { FormInput } from "@/components/ui/FormInput";
import { Dropdown } from "@/components/ui/Dropdown";
import type { IfNodeData } from "@/types/node-data";

interface IfNodeConfigurationProps {
  nodeData: IfNodeData;
  handleDataChange: (updates: Partial<IfNodeData>) => void;
}

const OPERATORS = [
  { value: "equals", label: "Equals (==)" },
  { value: "notEquals", label: "Not Equals (!=)" },
  { value: "contains", label: "Contains" },
  { value: "gt", label: "Greater Than (>)" },
  { value: "lt", label: "Less Than (<)" },
  { value: "gte", label: "Greater or Equal (>=)" },
  { value: "lte", label: "Less or Equal (<=)" },
  { value: "isEmpty", label: "Is Empty" },
];

function IfNodeConfigurationInner({
  nodeData,
  handleDataChange,
}: IfNodeConfigurationProps) {
  const leftPath = nodeData.leftPath || "";
  const operator = nodeData.operator || "equals";
  const rightValue = nodeData.rightValue || "";

  const handleLeftPathChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleDataChange({ leftPath: e.target.value });
    },
    [handleDataChange]
  );

  const handleOperatorChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      handleDataChange({ operator: e.target.value as IfNodeData["operator"] });
    },
    [handleDataChange]
  );

  const handleRightValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleDataChange({ rightValue: e.target.value });
    },
    [handleDataChange]
  );

  return (
    <SimpleCard className="space-y-4 p-5">
      <div className="space-y-1 mb-4">
        <Typography
          variant="h5"
          className="font-semibold text-foreground"
        >
          Condition Configuration
        </Typography>
        <Typography
          variant="bodySmall"
          className="text-muted-foreground"
        >
          Configure conditional logic for your workflow automation
        </Typography>
      </div>

      <div className="space-y-3">
        {/* Left Path Input */}
        <FormInput
          label="Value Path(Value to compare)"
          type="text"
          value={leftPath}
          onChange={handleLeftPathChange}
          placeholder="100"
        // helperText="Value to compare"
        />

        {/* Operator Selector */}
        <div className="space-y-1.5">
          <Dropdown
            id="if-operator"
            label="Operator"
            value={operator}
            onChange={handleOperatorChange}
            options={OPERATORS}
            placeholder="Select operator"
            aria-label="Comparison operator"
          />
        </div>

        {/* Right Value Input (disabled for isEmpty) */}
        {operator !== "isEmpty" && (
          <FormInput
            label="Compare Value(Value to compare against)"
            type="text"
            value={rightValue}
            onChange={handleRightValueChange}
            placeholder="100"
          />
        )}
      </div>
    </SimpleCard>
  );
}

export function IfNodeConfiguration(props: IfNodeConfigurationProps) {
  return (
    <IfNodeConfigurationInner {...props} />
  );
}
