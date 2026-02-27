"use client";

import React, { useState, useMemo } from "react";
import { LuChevronDown, LuChevronUp, LuZap, LuPlus } from "react-icons/lu";
import { Typography } from "@/components/ui/Typography";
import { useWorkflow } from "@/context/WorkflowContext";
import type { Node, Edge } from "reactflow";

/**
 * Available field from a previous block
 */
interface AvailableField {
  path: string; // e.g., "json.summary" or "subject"
  label: string; // e.g., "Summary" or "Subject"
  blockName: string; // e.g., "AI Transform" or "Mail"
  blockType: string; // e.g., "ai-transform" or "mail"
}

interface TemplateFieldSelectorProps {
  /** Current node ID */
  currentNodeId: string;
  /** Callback when a field is selected to insert */
  onInsertField: (fieldPath: string) => void;
  /** Optional: specific input field ref for inserting at cursor */
  inputRef?: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
}

/**
 * Template Field Selector Component
 * 
 * Shows available fields from previous blocks and allows users to
 * easily insert template placeholders like {{fieldName}}
 * 
 * Features:
 * - Lists all connected previous blocks
 * - Shows available fields from each block
 * - One-click insertion of template placeholders
 * - Collapsible sections for each block
 */
export function TemplateFieldSelector({
  currentNodeId,
  onInsertField,
  // inputRef,
}: TemplateFieldSelectorProps) {
  const { nodes, edges } = useWorkflow();
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  // Get ALL upstream nodes (transitive) - not just direct parents
  const previousNodes = useMemo(() => {
    const getAllUpstreamNodes = (nodeId: string): Node[] => {
      const visited = new Set<string>();
      const queue: string[] = [nodeId];
      const upstreamNodes: Node[] = [];

      while (queue.length > 0) {
        const currentId = queue.shift()!;

        if (visited.has(currentId)) {
          continue;
        }

        visited.add(currentId);

        // Find all edges pointing to the current node
        const incomingEdges = edges.filter(
          (edge: Edge) => edge.target === currentId
        );

        for (const edge of incomingEdges) {
          const sourceNodeId = edge.source;

          // Don't include the starting node itself
          if (sourceNodeId !== nodeId && !visited.has(sourceNodeId)) {
            const sourceNode = nodes.find((n: Node) => n.id === sourceNodeId);
            if (sourceNode) {
              upstreamNodes.push(sourceNode);
              queue.push(sourceNodeId);
            }
          }
        }
      }

      return upstreamNodes;
    };

    return getAllUpstreamNodes(currentNodeId);
  }, [nodes, edges, currentNodeId]);

  // Get available fields for each previous node
  const availableFields = useMemo(() => {
    const fields: Record<string, AvailableField[]> = {};

    previousNodes.forEach((node) => {
      const blockType = node.type || "";
      const blockName = (node.data?.label as string) || blockType || "Unknown";
      const nodeFields: AvailableField[] = [];

      // Common fields based on node type
      switch (blockType) {
        case "mail":
          nodeFields.push(
            { path: "subject", label: "Subject", blockName, blockType },
            { path: "body", label: "Body", blockName, blockType },
            { path: "to", label: "Recipient", blockName, blockType },
            { path: "sentAt", label: "Sent At", blockName, blockType }
          );
          break;

        case "ai-transform":
          nodeFields.push(
            { path: "text", label: "AI Response Text (Always Available)", blockName, blockType },
            { path: "json.summary", label: "Summary (Requires Output Schema)", blockName, blockType },
            { path: "json.totalRevenue", label: "Total Revenue (Requires Output Schema)", blockName, blockType },
            { path: "json.totalExpenses", label: "Total Expenses (Requires Output Schema)", blockName, blockType },
            { path: "json.netProfit", label: "Net Profit (Requires Output Schema)", blockName, blockType },
            { path: "usage.totalTokens", label: "Total Tokens", blockName, blockType }
          );
          break;

        case "slack":
          nodeFields.push(
            { path: "message", label: "Message", blockName, blockType },
            { path: "sentAt", label: "Sent At", blockName, blockType }
          );
          break;

        case "telegram":
          nodeFields.push(
            { path: "message", label: "Message", blockName, blockType },
            { path: "sentAt", label: "Sent At", blockName, blockType }
          );
          break;
        case "lifi":
        case "uniswap":
          nodeFields.push(
            { path: "txHash", label: "Transaction Hash", blockName, blockType },
            { path: "amountIn", label: "Amount In", blockName, blockType },
            { path: "amountOut", label: "Amount Out", blockName, blockType },
            { path: "fromToken.symbol", label: "From Token", blockName, blockType },
            { path: "toToken.symbol", label: "To Token", blockName, blockType }
          );
          break;

        case "start":
          // Start node passes through initial input
          nodeFields.push(
            { path: "triggeredAt", label: "Triggered At", blockName, blockType }
          );
          break;
      }

      // Always add fields (even if empty) so we can show "Insert entire output"
      fields[node.id] = nodeFields;
    });

    return fields;
  }, [previousNodes]);

  const toggleBlock = (nodeId: string) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleInsertField = (fieldPath: string) => {
    const placeholder = `{{${fieldPath}}}`;
    onInsertField(placeholder);
  };

  /**
   * Get the best default field for a node type.
   * This ensures users get readable content instead of raw JSON.
   */
  const getDefaultFieldForNodeType = (nodeType: string): string | null => {
    switch (nodeType) {
      case "ai-transform":
        return "text"; // AI response text
      case "mail":
        return "body"; // Email body content
      case "slack":
      case "telegram":
        return "message"; // Message content
      case "uniswap":
        return "txHash"; // Transaction hash
      default:
        return null; // Fall back to entire output
    }
  };

  const handleInsertEntireOutput = (nodeId: string, nodeType: string) => {
    const defaultField = getDefaultFieldForNodeType(nodeType);
    const placeholder = defaultField
      ? `{{blocks.${nodeId}.${defaultField}}}`
      : `{{blocks.${nodeId}}}`;
    onInsertField(placeholder);
  };

  if (previousNodes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-3">
        <Typography variant="caption" className="text-muted-foreground text-center text-xs leading-relaxed">
          No previous blocks connected. Connect blocks to see available fields.
        </Typography>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
        <LuZap className="w-3.5 h-3.5 text-primary shrink-0" />
        <Typography variant="caption" className="font-semibold text-foreground">
          Previous blocks output
        </Typography>
      </div>
      <p className="px-3 pt-1.5 pb-2 text-muted-foreground text-xs">
        Click a field to insert it into your prompt.
      </p>

      {/* Block list */}
      <div className="space-y-1.5 px-2 pb-2 max-h-56 overflow-y-auto">
        {previousNodes.map((node) => {
          const nodeId = node.id;
          const blockName = (node.data?.label as string) || node.type || "Unknown Block";
          const fields = availableFields[nodeId] || [];
          const isExpanded = expandedBlocks.has(nodeId);

          return (
            <div
              key={nodeId}
              className="rounded-lg border border-white/15 overflow-hidden bg-black/20"
            >
              <button
                type="button"
                onClick={() => toggleBlock(nodeId)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-2 text-left hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <Typography variant="caption" className="font-medium text-foreground truncate">
                  {blockName}
                </Typography>
                {isExpanded ? (
                  <LuChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <LuChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="px-2 pb-2 pt-0.5 space-y-1 border-t border-white/15">
                  {/* Recommended insert — Swap-style panel */}
                  {(() => {
                    const nodeType = node.type || "";
                    const defaultField = getDefaultFieldForNodeType(nodeType);
                    const placeholderPreview = defaultField
                      ? `{{blocks.${nodeId}.${defaultField}}}`
                      : `{{blocks.${nodeId}}}`;
                    const buttonLabel = defaultField
                      ? `Insert ${defaultField.charAt(0).toUpperCase() + defaultField.slice(1)}`
                      : "Insert entire output (JSON)";

                    return (
                      <button
                        type="button"
                        onClick={() => handleInsertEntireOutput(nodeId, nodeType)}
                        className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/15 transition-colors group text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-foreground block truncate">
                            {buttonLabel}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono block truncate mt-0.5">
                            {placeholderPreview}
                          </span>
                        </div>
                        <LuPlus className="w-3.5 h-3.5 text-foreground shrink-0" />
                      </button>
                    );
                  })()}

                  {/* Specific fields */}
                  {fields.length > 0 && (
                    <>
                      <Typography variant="caption" className="text-muted-foreground text-xs font-medium pt-1 px-0.5 block">
                        Or specific fields:
                      </Typography>
                      <div className="space-y-0.5">
                        {fields.map((field) => (
                          <button
                            key={field.path}
                            type="button"
                            onClick={() => handleInsertField(`blocks.${nodeId}.${field.path}`)}
                            className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md hover:bg-white/5 active:bg-white/10 transition-colors group text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-foreground block truncate">
                                {field.label}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-mono block truncate">
                                {`{{blocks.${nodeId}.${field.path}}}`}
                              </span>
                            </div>
                            <LuPlus className="w-3 h-3 text-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}