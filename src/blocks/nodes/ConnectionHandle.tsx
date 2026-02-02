"use client";

import React from "react";
import { Handle, Position } from "reactflow";
import { cn } from "@/lib/utils";

export type HandleType = "source" | "target";

export interface ConnectionHandleProps {
  type: HandleType;
  position: Position;
  id?: string;
  /** Single character or short label shown inside the circle (e.g. "T" for Text) */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Optional variant for IfNode (true/false) or SwitchNode cases */
  variant?: "default" | "true" | "false" | "case";
}

/**
 * Custom connection handle matching reference: visible circle on node edge
 * indicating where to start an edge (source) or connect it (target).
 * Shows an optional label inside the circle (e.g. "T").
 */
export const ConnectionHandle = React.memo(function ConnectionHandle({
  type,
  position,
  id,
  label,
  className,
  style,
  variant = "default",
}: ConnectionHandleProps) {
  const isLeft = position === Position.Left;
  const positionStyle: React.CSSProperties = {
    left: isLeft ? "-12px" : undefined,
    right: !isLeft ? "-12px" : undefined,
    top: "50%",
    transform: "translateY(-50%)",
    ...style,
  };

  return (
    <Handle
      type={type}
      position={position}
      id={id}
      className={cn(
        "connection-handle w-3! h-3! border! rounded-full! flex! items-center! justify-center! text-[7px]! font-semibold! cursor-crosshair!",
        type === "source" && "connection-handle-source",
        type === "target" && "connection-handle-target",
        variant === "true" && "connection-handle-true",
        variant === "false" && "connection-handle-false",
        className
      )}
      isConnectable={true}
      style={positionStyle}
    >
      {label ? (
        <span className="connection-handle-label pointer-events-none select-none">
          {label}
        </span>
      ) : (
        <span className="connection-handle-dot pointer-events-none" />
      )}
    </Handle>
  );
});
