"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { WorkflowSummary } from "@/types/workflow";
import { LuPlay, LuPencil, LuTrash2, LuClock } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { getStatusColor, getStatusIcon } from "./workflow-utils";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { ReactFlowProvider, type Node, type Edge } from "reactflow";
import { getWorkflow, transformWorkflowToCanvas } from "@/utils/workflow-api";
import { WorkflowPreviewCanvas } from "../public-workflows/WorkflowPreviewCanvas";

interface WorkflowCardProps {
    workflow: WorkflowSummary;
    viewMode: "grid" | "list";
    isDeleting: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onRun: () => void;
    getAccessToken: () => Promise<string | null>;
}

function formatDate(dateString: string | null) {
    if (!dateString) return "Never";
    try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
        return "Unknown";
    }
}

const iconBtn =
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/40 outline-none transition-colors hover:bg-white/8 hover:text-white focus-visible:ring-2 focus-visible:ring-white/30";

function WorkflowCardPreviewInner({ workflowId, getAccessToken }: { workflowId: string; getAccessToken: () => Promise<string | null> }) {
    const [nodes, setNodes] = React.useState<Node[]>([]);
    const [edges, setEdges] = React.useState<Edge[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        let cancelled = false;

        const fetchWorkflow = async () => {
            setIsLoading(true);
            try {
                const accessToken = await getAccessToken();
                if (!accessToken || cancelled) return;
                const result = await getWorkflow({ workflowId, accessToken });
                if (!cancelled && result.success && result.data) {
                    const { nodes, edges } = transformWorkflowToCanvas(result.data);
                    setNodes(nodes);
                    setEdges(edges);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchWorkflow();

        return () => {
            cancelled = true;
        };
    }, [workflowId, getAccessToken]);

    if (isLoading) {
        return (
            <div className="relative flex h-full items-center justify-center text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">
                Workflow preview
            </div>
        );
    }

    if (!nodes.length && !edges.length) {
        return (
            <div className="relative flex h-full items-center justify-center text-[11px] font-medium uppercase tracking-[0.18em] text-white/30">
                No preview available
            </div>
        );
    }

    return (
        <WorkflowPreviewCanvas nodes={nodes} edges={edges} />
    );
}

function WorkflowCardPreview({ workflowId, getAccessToken }: { workflowId: string; getAccessToken: () => Promise<string | null> }) {
    return (
        <ReactFlowProvider>
            <WorkflowCardPreviewInner workflowId={workflowId} getAccessToken={getAccessToken} />
        </ReactFlowProvider>
    );
}

export const WorkflowCard = React.memo(function WorkflowCard({
    workflow,
    viewMode,
    isDeleting,
    onEdit,
    onDelete,
    onRun,
    getAccessToken,
}: WorkflowCardProps) {
    const hasTags = workflow.tags && workflow.tags.length > 0;
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDeleteClick = () => setShowDeleteDialog(true);
    const handleDeleteConfirm = () => {
        onDelete();
        setShowDeleteDialog(false);
    };
    const handleDeleteCancel = () => setShowDeleteDialog(false);

    if (viewMode === "list") {
        return (
            <>
                <div
                    className={cn(
                        "group flex items-center gap-5 rounded-xl border border-white/6 bg-white/2 px-6 py-4 transition-colors hover:border-white/10 hover:bg-white/4",
                        isDeleting && "pointer-events-none opacity-50"
                    )}
                >
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[15px] font-medium tracking-tight text-white">
                            {workflow.name}
                        </h3>
                        <p className="mt-0.5 truncate text-[13px] text-white/45">
                            {workflow.description || "No description"}
                        </p>
                    </div>

                    <div className="hidden shrink-0 items-center gap-5 text-[13px] text-white/40 md:flex">
                        <span className={cn("flex items-center gap-1.5", getStatusColor(workflow.last_execution_status))}>
                            {getStatusIcon(workflow.last_execution_status)}
                            <span className="capitalize">{workflow.last_execution_status?.toLowerCase() ?? "—"}</span>
                        </span>
                        <span>{workflow.execution_count} runs</span>
                        <span className="flex items-center gap-1">
                            <LuClock className="h-3.5 w-3.5" />
                            {formatDate(workflow.updated_at)}
                        </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                        <button type="button" onClick={onRun} title="Run" className={iconBtn}>
                            <LuPlay className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={onEdit} title="Edit" className={iconBtn}>
                            <LuPencil className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            disabled={isDeleting}
                            title="Delete"
                            className={iconBtn}
                            aria-label="Delete workflow"
                        >
                            <LuTrash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <DeleteConfirmDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    onConfirm={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                    title="Delete workflow?"
                    description="This workflow will be permanently deleted and cannot be recovered."
                />
            </>
        );
    }

    // ——— Grid: editorial, minimal card with left accent ———
    return (
        <>
            <article
                className={cn(
                    "relative flex flex-col overflow-hidden rounded-xl border border-white/6 bg-white/2 transition-colors hover:border-white/10 hover:bg-white/4",
                    isDeleting && "pointer-events-none opacity-50"
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Preview area */}
                    <div className="relative mx-4 mt-4 mb-3">
                        <div className="w-full h-40 rounded-xl border border-white/8 bg-black/40 overflow-hidden relative">
                            <div className="relative h-full">
                                <WorkflowCardPreview workflowId={workflow.id} getAccessToken={getAccessToken} />
                            </div>
                        </div>
                    </div>

                    <div className="pl-6 pr-6 pt-1 pb-6">
                        {/* Top: actions only */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h3 className="truncate text-[15px] font-semibold tracking-tight text-white">
                                    {workflow.name}
                                </h3>
                                <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-white/45">
                                    {workflow.description || "No description"}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-0.5">
                                <button type="button" onClick={onRun} title="Run" className={iconBtn}>
                                    <LuPlay className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={onEdit} title="Edit" className={iconBtn}>
                                    <LuPencil className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteClick}
                                    disabled={isDeleting}
                                    title="Delete"
                                    className={iconBtn}
                                    aria-label="Delete workflow"
                                >
                                    <LuTrash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Meta: one line */}
                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/6 pt-4 text-[12px] text-white/40">
                            <span className={cn("flex items-center gap-1.5", getStatusColor(workflow.last_execution_status))}>
                                {getStatusIcon(workflow.last_execution_status)}
                                <span className="capitalize">{workflow.last_execution_status?.toLowerCase() ?? "—"}</span>
                            </span>
                            <span>{workflow.execution_count} runs</span>
                            {workflow.execution_count > 0 && (
                                <span>
                                    <span className="text-emerald-400/80">{workflow.success_count}</span>
                                    <span className="text-white/25"> / </span>
                                    <span className="text-red-400/80">{workflow.failed_count}</span>
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <LuClock className="h-3 w-3" />
                                {formatDate(workflow.updated_at)}
                            </span>
                        </div>

                        {/* Tags */}
                        {hasTags && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {(workflow.tags ?? []).slice(0, 3).map((t) => (
                                    <span
                                        key={t}
                                        className="rounded-md border border-white/6 bg-white/3 px-2 py-0.5 text-[11px] text-white/45"
                                    >
                                        {t}
                                    </span>
                                ))}
                                {(workflow.tags?.length ?? 0) > 3 && (
                                    <span className="text-[11px] text-white/35">+{(workflow.tags?.length ?? 0) - 3}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </article>
            <DeleteConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                title="Delete workflow?"
                description="This workflow will be permanently deleted and cannot be recovered."
            />
        </>
    );
});
