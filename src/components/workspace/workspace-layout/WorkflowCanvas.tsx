"use client";

import {
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";

export interface WorkflowCanvasProps {
  className?: string;
  showBackground?: boolean;
  showMiniMap?: boolean;
  backgroundVariant?: BackgroundVariant;
  fitView?: boolean;
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <p>Workflow Canvas Section Here</p>
  );
}
