"use client";

import React from "react";

interface WorkflowToolbarProps {
  onShare?: () => void;
  className?: string;
}

export const WorkflowToolbar = React.memo(function WorkflowToolbar({
  onShare,
  className,
}: WorkflowToolbarProps) {
  return (
    <div>Workflow Toolbar Section Here</div>
  );
});

