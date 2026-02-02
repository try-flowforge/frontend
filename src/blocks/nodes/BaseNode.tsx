"use client";

import React from "react";
import { Position, NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { ConnectionHandle } from "./ConnectionHandle";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { generateIconRegistry } from "../registry";

export interface BaseNodeData {
  label: string;
  description?: string;
  /** Icon name from iconRegistry - serializable */
  iconName?: string;
  icon?: React.ReactNode;
  status?: "idle" | "running" | "success" | "error";
  blockId?: string;
  [key: string]: unknown;
}

export interface BaseNodeProps extends NodeProps<BaseNodeData> {
  showHandles?: boolean;
  sourcePosition?: Position;
  targetPosition?: Position;
}

/**
 * BaseNode - Generic node component for workflow canvas
 *
 * Features:
 * - Card-based surface design
 * - Configurable handles (connection points)
 * - Icon support via iconName (serializable) or legacy icon prop
 * - Token-based styling
 * - Memoized for performance
 */
/** Derive a single-letter handle label from node type (e.g. "telegram" → "T") */
function getHandleLabel(nodeType: string | undefined, data: BaseNodeData): string {
  const custom = data.handleLabel as string | undefined;
  if (custom && custom.length > 0) return custom.charAt(0).toUpperCase();
  if (nodeType && nodeType !== "base") {
    const first = nodeType.charAt(0).toUpperCase();
    if (nodeType.includes("transform")) return "A";
    return first;
  }
  return "•";
}

export function BaseNode({
  id,
  data,
  selected,
  type: nodeType,
  showHandles = true,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
}: BaseNodeProps) {
  const { edges } = useWorkflow();
  const hasEdges = edges.some((e) => e.source === id || e.target === id);

  // Resolve icon: prefer iconName (serializable), fallback to legacy icon prop
  const iconRegistry = generateIconRegistry();
  const IconComponent = data.iconName ? iconRegistry[data.iconName] : null;
  const renderedIcon = IconComponent ? (
    <IconComponent className="w-8 h-8" />
  ) : (
    data.icon || null
  );

  const handleLabel = getHandleLabel(nodeType, data);

  return (
    <div className={cn("relative group overflow-visible", hasEdges && "has-edges")}>
      {showHandles && (
        <>
          <ConnectionHandle
            type="target"
            position={targetPosition}
            label={handleLabel}
          />
          <ConnectionHandle
            type="source"
            position={sourcePosition}
            label={handleLabel}
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
            <div className="w-full h-full flex items-center justify-center rounded-lg bg-muted/20" />
          )}
        </div>
      </SimpleCard>
    </div>
  );
}
