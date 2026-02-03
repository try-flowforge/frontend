"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { WorkflowLayout } from "@/components/workspace/WorkflowLayout";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useWorkflow } from "@/context/WorkflowContext";
import { LuLoaderCircle } from "react-icons/lu";

function WorkflowPageContent() {
  const searchParams = useSearchParams();
  const { loadWorkflow, isLoading, resetWorkflow } = useWorkflow();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const workflowId = searchParams.get("workflowId");

    // Only load once
    if (hasLoadedRef.current) return;

    if (workflowId) {
      hasLoadedRef.current = true;
      loadWorkflow(workflowId);
    } else {
      // No workflow ID, ensure we're in a fresh state
      hasLoadedRef.current = true;
      resetWorkflow();
    }
  }, [searchParams, loadWorkflow, resetWorkflow]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <LuLoaderCircle className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  return <WorkflowLayout />;
}

// Wrap with ErrorBoundary for production error handling
export default function WorkflowPageClient() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <TooltipProvider>
          <WorkflowPageContent />
        </TooltipProvider>
      </div>
    </ErrorBoundary>
  );
}
