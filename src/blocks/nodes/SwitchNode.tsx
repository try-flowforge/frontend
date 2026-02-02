"use client";

import React from "react";
import { Position, NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import { SimpleCard } from "@/components/ui/SimpleCard";
import type { SwitchCaseData } from "@/blocks/definitions/control/switch";
import { ConnectionHandle } from "./ConnectionHandle";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { generateIconRegistry } from "../registry";

export interface SwitchNodeData {
  label: string;
  description?: string;
  /** Icon name from iconRegistry - serializable */
  iconName?: string;
  status?: "idle" | "running" | "success" | "error";
  blockId?: string;
  valuePath?: string;
  cases?: SwitchCaseData[];
  [key: string]: unknown;
}

export interface SwitchNodeProps extends NodeProps<SwitchNodeData> {
  showHandles?: boolean;
  sourcePosition?: Position;
  targetPosition?: Position;
}

/**
 * SwitchNode - Multi-branch routing node for workflow canvas
 *
 * Features:
 * - Card-based surface design
 * - 1 input handle (target)
 * - Dynamic output handles based on configured cases (max 5)
 * - Icon support via iconName (serializable)
 * - Token-based styling
 * - Memoized for performance
 */
export function SwitchNode({
  id,
  data,
  selected,
  showHandles = true,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
}: SwitchNodeProps) {
  const { edges } = useWorkflow();
  const hasEdges = edges.some((e) => e.source === id || e.target === id);
  // Resolve icon: prefer iconName (serializable)
  const iconRegistry = generateIconRegistry();
  const IconComponent = data.iconName ? iconRegistry[data.iconName] : null;
  const renderedIcon = IconComponent ? (
    <IconComponent className="w-6 h-6" />
  ) : null;

  const cases = data.cases || [];

  // Ensure default case is always first
  const sortedCases = [...cases].sort((a, b) => {
    if (a.isDefault) return -1;
    if (b.isDefault) return 1;
    return 0;
  });

  const caseCount = sortedCases.length || 1;

  const getHandleTopPosition = (index: number, total: number): string => {
    if (total === 1) return "50%";
    const step = 100 / (total + 1);
    return `${step * (index + 1)}%`;
  };

  return (
    <div className={cn("relative group overflow-visible", hasEdges && "has-edges")}>
      {showHandles && (
        <>
          {/* Input: where to connect an edge */}
          <ConnectionHandle
            type="target"
            position={targetPosition}
            label="S"
          />

          {/* Output: start edge (per case) */}
          {sortedCases.length > 0 ? (
            sortedCases.map((switchCase, index) => (
              <ConnectionHandle
                key={switchCase.id}
                type="source"
                position={sourcePosition}
                id={switchCase.id}
                label={switchCase.isDefault ? "D" : String(index)}
                style={{
                  top: getHandleTopPosition(index, caseCount),
                  transform: "translateY(-50%)",
                }}
              />
            ))
          ) : (
            <ConnectionHandle
              type="source"
              position={sourcePosition}
              id="default"
              label="D"
              style={{ top: "50%", transform: "translateY(-50%)" }}
            />
          )}
        </>
      )}

      <SimpleCard
        className={cn(
          "w-16 transition-all relative",
          "border border-foreground/20 bg-card",
          "rounded-lg",
          selected && "ring-2 ring-primary/50 shadow-lg border-primary/30"
        )}
        style={{
          // Dynamic height based on case count
          height: `${Math.max(64, Math.min(120, caseCount * 24 + 16))}px`,
        }}
      >
        {/* Icon container */}
        <div className="flex items-center justify-center p-2 w-full h-full">
          {renderedIcon ? (
            <div className="w-full h-full flex items-center justify-center rounded-lg bg-background">
              {renderedIcon}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center rounded-lg bg-muted/20">
              <span className="text-xs font-bold text-muted-foreground">
                SW
              </span>
              {caseCount > 1 && (
                <span className="text-[10px] text-muted-foreground/70">
                  {caseCount}
                </span>
              )}
            </div>
          )}
        </div>
      </SimpleCard>
    </div>
  );
}

export default SwitchNode;
