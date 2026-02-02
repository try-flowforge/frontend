"use client";

import React from "react";
import { Position, NodeProps } from "reactflow";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { cn } from "@/lib/utils";
import { LuWallet } from "react-icons/lu";
import { ConnectionHandle } from "./ConnectionHandle";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { generateIconRegistry } from "../registry";

export interface WalletNodeData {
  label: string;
  description?: string;
  /** Icon name from iconRegistry - serializable */
  iconName?: string;
  icon?: React.ReactNode;
  status?: "idle" | "running" | "success" | "error";
  blockId?: string;
  [key: string]: unknown;
}

export interface WalletNodeProps extends NodeProps<WalletNodeData> {
  showHandles?: boolean;
  sourcePosition?: Position;
  targetPosition?: Position;
}

/**
 * WalletNode - Specialized node for wallet/account blocks
 *
 * Features:
 * - Same structure as BaseNode but with wallet-specific defaults
 * - Primary-colored fallback icon if no icon specified
 * - Serializable via iconName property
 */
export function WalletNode({
  id,
  data,
  selected,
  showHandles = true,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
}: WalletNodeProps) {
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

  return (
    <div className={cn("relative group overflow-visible", hasEdges && "has-edges")}>
      {showHandles && (
        <>
          <ConnectionHandle
            type="target"
            position={targetPosition}
            label="W"
          />
          <ConnectionHandle
            type="source"
            position={sourcePosition}
            label="W"
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
            // Wallet-specific fallback with primary color
            <div className="w-full h-full flex items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LuWallet className="w-8 h-8" />
            </div>
          )}
        </div>
      </SimpleCard>
    </div>
  );
}
