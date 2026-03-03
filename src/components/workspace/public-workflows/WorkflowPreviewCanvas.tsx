"use client";

import React from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { nodeTypes } from "../nodeTypes";
import {
  PREVIEW_EDGE_OPTIONS,
  PREVIEW_BACKGROUND_CONFIG,
} from "@/constants/workflow";

interface WorkflowPreviewCanvasProps {
  nodes: Node[];
  edges: Edge[];
}

export function WorkflowPreviewCanvas({
  nodes,
  edges,
}: WorkflowPreviewCanvasProps) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      nodesFocusable={false}
      edgesFocusable={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      panOnScroll={false}
      panOnDrag={true}
      defaultEdgeOptions={PREVIEW_EDGE_OPTIONS}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={PREVIEW_BACKGROUND_CONFIG.gap}
        size={PREVIEW_BACKGROUND_CONFIG.size}
        color={PREVIEW_BACKGROUND_CONFIG.color}
      />
    </ReactFlow>
  );
}

