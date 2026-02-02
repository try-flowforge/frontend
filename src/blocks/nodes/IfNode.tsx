"use client";

import React from "react";
import { Position, NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { ConnectionHandle } from "./ConnectionHandle";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { generateIconRegistry } from "../registry";

export interface IfNodeData {
  label: string;
  description?: string;
  /** Icon name from iconRegistry - serializable */
  iconName?: string;
  status?: "idle" | "running" | "success" | "error";
  blockId?: string;
  leftPath?: string;
  operator?: string;
  rightValue?: string;
  [key: string]: unknown;
}

export interface IfNodeProps extends NodeProps<IfNodeData> {
  showHandles?: boolean;
  sourcePosition?: Position;
  targetPosition?: Position;
}

/**
 * IfNode - Conditional branching node for workflow canvas
 *
 * Features:
 * - Card-based surface design (diamond shape via CSS)
 * - 1 input handle (target)
 * - 2 output handles (true/false sources)
 * - Icon support via iconName (serializable)
 * - Token-based styling
 * - Memoized for performance
 */
export function IfNode({
  id,
  data,
  selected,
  showHandles = true,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
}: IfNodeProps) {
  const { edges } = useWorkflow();
  const hasEdges = edges.some((e) => e.source === id || e.target === id);
  // Resolve icon: prefer iconName (serializable)
  const iconRegistry = generateIconRegistry();
  const IconComponent = data.iconName ? iconRegistry[data.iconName] : null;
  const renderedIcon = IconComponent ? (
    <IconComponent className="w-6 h-6" />
  ) : null;

  return (
    <div className={cn("relative group overflow-visible", hasEdges && "has-edges")}>
      {showHandles && (
        <>
          {/* Input: where to connect an edge */}
          <ConnectionHandle
            type="target"
            position={targetPosition}
            label="I"
          />

          {/* Output: start edge (true branch) */}
          <ConnectionHandle
            type="source"
            position={sourcePosition}
            id="true"
            label="T"
            variant="true"
            style={{ top: "25%", transform: "translateY(-50%)" }}
          />

          {/* Output: start edge (false branch) */}
          <ConnectionHandle
            type="source"
            position={sourcePosition}
            id="false"
            label="F"
            variant="false"
            style={{ top: "75%", transform: "translateY(-50%)" }}
          />
        </>
      )}

      <SimpleCard
        className={cn(
          "w-16 h-16 transition-all relative",
          "border border-white/10 bg-white/5 rounded-lg",
          selected && "ring-0.5 ring-white/30 border-white/40 shadow-md"
        )}
      >
        {/* Icon container */}
        <div className="flex items-center justify-center p-2 w-full h-full">
          {renderedIcon ? (
            <div className="w-full h-full flex items-center justify-center rounded-lg bg-background">
              {renderedIcon}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center rounded-lg bg-muted/20">
              <span className="text-xs font-bold text-muted-foreground">IF</span>
            </div>
          )}
        </div>
      </SimpleCard>
    </div>
  );
}

export default IfNode;

