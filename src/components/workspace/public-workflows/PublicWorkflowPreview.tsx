"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LuLoader, LuArrowLeft, LuCopy, LuShare2 } from "react-icons/lu";
import { usePrivy } from "@privy-io/react-auth";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import {
  getPublicWorkflow,
  getPublicWorkflowVersion,
  clonePublicWorkflow,
  transformWorkflowToCanvas,
  transformNodeToCanvas,
  transformEdgeToCanvas,
} from "@/utils/workflow-api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ReactFlowProvider, type Node, type Edge } from "reactflow";
import { WorkflowPreviewCanvas } from "./WorkflowPreviewCanvas";
import type { PublicWorkflowDetail } from "@/types/workflow";
import { PublicVersionSelector } from "./PublicVersionSelector";

interface PublicWorkflowPreviewProps {
  workflowId: string;
}

function PublicWorkflowPreviewInner({ workflowId }: PublicWorkflowPreviewProps) {
  const router = useRouter();
  const { login } = usePrivy();
  const { getPrivyAccessToken, authenticated } = usePrivyWallet();
  const [workflow, setWorkflow] = useState<PublicWorkflowDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloning, setIsCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Version state
  const [currentVersion, setCurrentVersion] = useState(1);
  const [selectedVersion, setSelectedVersion] = useState(1);
  const [versionNodes, setVersionNodes] = useState<Node[]>([]);
  const [versionEdges, setVersionEdges] = useState<Edge[]>([]);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);

  // Fetch workflow
  useEffect(() => {
    const fetchWorkflow = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getPublicWorkflow({ workflowId });

        if (result.success && result.data) {
          setWorkflow(result.data);
          const version = result.data.version || 1;
          setCurrentVersion(version);
          setSelectedVersion(version);

          // Set initial canvas data
          const { nodes, edges } = transformWorkflowToCanvas(result.data);
          setVersionNodes(nodes);
          setVersionEdges(edges);
        } else {
          setError(result.error?.message || "Failed to load workflow");
        }
      } catch {
        setError("An unexpected error occurred");
        // console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkflow();
  }, [workflowId]);

  // Load specific version
  const handleVersionChange = useCallback(async (version: number) => {
    if (version === selectedVersion) return;

    setSelectedVersion(version);
    setIsLoadingVersion(true);

    try {
      const result = await getPublicWorkflowVersion({
        workflowId,
        versionNumber: version,
      });

      if (result.success && result.data) {
        // Transform nodes and edges from version snapshot
        const nodes = result.data.nodes.map(node => transformNodeToCanvas(node));
        const edges = result.data.edges.map(edge => transformEdgeToCanvas(edge));
        setVersionNodes(nodes);
        setVersionEdges(edges);
      }
    } catch {
      // console.error("Error loading version:", err);
    } finally {
      setIsLoadingVersion(false);
    }
  }, [workflowId, selectedVersion]);

  const handleShare = async () => {
    const shareData = {
      title: workflow?.name || 'Workflow',
      text: workflow?.description || 'Check out this automation workflow',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        // alert('Link copied to clipboard!');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        // Try clipboard as fallback
        try {
          await navigator.clipboard.writeText(window.location.href);
          // alert('Link copied to clipboard!');
        } catch {
          // console.error('Failed to share:', clipboardErr);
        }
      }
    }
  };

  const handleUseWorkflow = async () => {
    if (!authenticated) {
      // Prompt user to log in
      login();
      return;
    }

    setIsCloning(true);

    try {
      const accessToken = await getPrivyAccessToken();
      if (!accessToken) {
        // alert("Unable to authenticate. Please try logging in again.");
        setIsCloning(false);
        return;
      }

      const result = await clonePublicWorkflow({
        workflowId,
        accessToken,
      });

      if (result.success && result.newWorkflowId) {
        // Navigate to the builder with the new workflow
        router.push(`/automation-builder?workflowId=${result.newWorkflowId}`);
      } else {
        // alert(
        //   `Failed to clone workflow: ${result.error?.message || "Unknown error"}`
        // );
        setIsCloning(false);
      }
    } catch {
      // console.error("Error cloning workflow:", error);
      // alert(
      //   `Error cloning workflow: ${error instanceof Error ? error.message : String(error)}`
      // );
      setIsCloning(false);
    }
  };

  const handleBack = () => {
    router.push("/public-workflows");
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LuLoader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error State
  if (error || !workflow) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center space-y-4">
            <p className="text-destructive text-lg font-medium">
              {error || "Workflow not found"}
            </p>
            <Button onClick={handleBack} className="gap-2">
              <LuArrowLeft className="w-4 h-4" />
              Back to Gallery
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <Button onClick={handleBack} className="gap-2">
                <LuArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex-1 flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  {workflow.name}
                </h1>
                <PublicVersionSelector
                  workflowId={workflowId}
                  currentVersion={currentVersion}
                  selectedVersion={selectedVersion}
                  onVersionChange={handleVersionChange}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleShare}
                  className="gap-2"
                  border
                  title="Share this workflow"
                >
                  <LuShare2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
                <Button
                  onClick={handleUseWorkflow}
                  disabled={isCloning}
                  className="bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 over:to-orange-600 gap-2"
                >
                  {isCloning ? (
                    <>
                      <LuLoader className="w-4 h-4 animate-spin" />
                      Cloning...
                    </>
                  ) : (
                    <>
                      <LuCopy className="w-4 h-4" />
                      <span className="hidden sm:inline">Use This Workflow</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-3">
              {workflow.description && (
                <p className="text-muted-foreground">{workflow.description}</p>
              )}
              {workflow.tags && workflow.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {workflow.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-sm px-3 py-1.5 bg-primary/20 text-primary rounded-full font-medium border border-primary/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Canvas */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 m-4">
          <div className="w-full h-full rounded-xl border border-border bg-card overflow-hidden relative">
            {/* Version loading overlay */}
            {isLoadingVersion && (
              <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                <div className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-lg">
                  <LuLoader className="w-4 h-4 animate-spin text-blue-400" />
                  <span className="text-sm text-white">Loading version...</span>
                </div>
              </div>
            )}
            <WorkflowPreviewCanvas nodes={versionNodes} edges={versionEdges} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicWorkflowPreview(props: PublicWorkflowPreviewProps) {
  return (
    <ReactFlowProvider>
      <PublicWorkflowPreviewInner {...props} />
    </ReactFlowProvider>
  );
}
