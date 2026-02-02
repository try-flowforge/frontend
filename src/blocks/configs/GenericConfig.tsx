/**
 * Generic Configuration Component
 * Fallback configuration UI for blocks without custom config components
 */

"use client";

import { SimpleCard } from "@/components/ui/SimpleCard";
import { Typography } from "@/components/ui/Typography";
import type { NodeConfigurationProps } from "../types";

export function GenericConfig({
  nodeData,
  handleDataChange,
  nodeId,
}: NodeConfigurationProps) {
  return (
    <SimpleCard className="p-4 space-y-4">
      <Typography variant="bodySmall" className="font-semibold text-foreground">
        Parameters
      </Typography>

      {/* Label */}
      <div className="space-y-2">
        <label className="block">
          <Typography variant="caption" className="text-muted-foreground mb-1">
            Label
          </Typography>
          <input
            type="text"
            value={(nodeData.label as string) || ""}
            onChange={(e) => handleDataChange({ label: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter block label"
          />
        </label>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block">
          <Typography variant="caption" className="text-muted-foreground mb-1">
            Description
          </Typography>
          <textarea
            value={(nodeData.description as string) || ""}
            onChange={(e) => handleDataChange({ description: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Enter block description"
            rows={3}
          />
        </label>
      </div>

      {/* Status */}
      {nodeData.status !== undefined && (
        <div className="space-y-2">
          <label className="block">
            <Typography variant="caption" className="text-muted-foreground mb-1">
              Status
            </Typography>
            <select
              value={(nodeData.status as string) || "idle"}
              onChange={(e) => handleDataChange({ status: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Block status"
            >
              <option value="idle">Idle</option>
              <option value="running">Running</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
          </label>
        </div>
      )}

      {/* Node ID (read-only) */}
      {nodeId && (
        <div className="space-y-2 pt-2 border-t border-border">
          <Typography variant="caption" className="text-muted-foreground">
            Node ID
          </Typography>
          <Typography
            variant="caption"
            className="text-foreground font-mono text-xs break-all"
          >
            {nodeId}
          </Typography>
        </div>
      )}
    </SimpleCard>
  );
}
