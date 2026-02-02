"use client";

import React from "react";
import { Position, NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { ConnectionHandle } from "./ConnectionHandle";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { generateIconRegistry } from "../registry";

export interface StartNodeData {
  label: string;
  blockId?: string;
  iconName?: string;
  [key: string]: unknown;
}

export interface StartNodeProps extends NodeProps<StartNodeData> {
  sourcePosition?: Position;
}

/**
 * StartNode - Special workflow start point node
 *
 * Features:
 * - Same square box design as other blocks
 * - Only has source handle (right side) - no input
 * - Cannot be deleted
 * - Simple icon-centered design
 */
export function StartNode({
  id,
  data,
  selected,
  sourcePosition = Position.Right,
}: StartNodeProps) {
  const { edges } = useWorkflow();
  const hasEdges = edges.some((e) => e.source === id || e.target === id);
  // Get icon from registry
  const iconRegistry = generateIconRegistry();
  const IconComponent = data.iconName ? iconRegistry[data.iconName] : null;

  return (
    <div className={cn("relative group overflow-visible", hasEdges && "has-edges")}>
      {/* Only source handle - start drawing edge from here */}
      <ConnectionHandle
        type="source"
        position={sourcePosition}
        label="S"
      />

      <SimpleCard
        className={cn(
          "w-16 h-16 transition-all relative",
          "border border-white/10 bg-white/5 rounded-lg",
          selected && "ring-0.5 ring-white/30 border-white/40 shadow-md"
        )}
      >
        {/* Icon container */}
        <div className="flex items-center justify-center p-2 w-full h-full">
          {IconComponent ? (
            <div className="w-full h-full flex items-center justify-center rounded-lg bg-background">
              <IconComponent className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center rounded-lg bg-muted/20" />
          )}
        </div>
      </SimpleCard>
    </div>
  );
}

export default StartNode;
