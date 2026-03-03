"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import type { PublicWorkflowSummary } from "@/types/workflow";
import { LuExternalLink, LuClock } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { ReactFlowProvider, type Node, type Edge } from "reactflow";
import { getPublicWorkflow, transformWorkflowToCanvas } from "@/utils/workflow-api";
import { WorkflowPreviewCanvas } from "./WorkflowPreviewCanvas";

interface PublicWorkflowCardProps {
    workflow: PublicWorkflowSummary;
    viewMode: "grid" | "list";
    onView: () => void;
}

function formatDate(dateString: string | null) {
    if (!dateString) return "—";
    try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
        return "—";
    }
}

const iconBtn =
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/40 outline-none transition-colors hover:bg-white/8 hover:text-white focus-visible:ring-2 focus-visible:ring-white/30";

function PublicWorkflowCardPreviewInner({ workflowId }: { workflowId: string }) {
    const [nodes, setNodes] = React.useState<Node[]>([]);
    const [edges, setEdges] = React.useState<Edge[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        let cancelled = false;

        const fetchWorkflow = async () => {
            setIsLoading(true);
            try {
                const result = await getPublicWorkflow({ workflowId });
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
    }, [workflowId]);

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

function PublicWorkflowCardPreview({ workflowId }: { workflowId: string }) {
    return (
        <ReactFlowProvider>
            <PublicWorkflowCardPreviewInner workflowId={workflowId} />
        </ReactFlowProvider>
    );
}

export const PublicWorkflowCard = React.memo(function PublicWorkflowCard({
    workflow,
    viewMode,
    onView,
}: PublicWorkflowCardProps) {
    const hasTags = workflow.tags && workflow.tags.length > 0;

    if (viewMode === "list") {
        return (
            <div
                className={cn(
                    "group flex items-center gap-5 rounded-xl border border-white/6 bg-white/2 px-6 py-4 transition-colors hover:border-white/10 hover:bg-white/4 cursor-pointer",
                )}
                onClick={onView}
                onKeyDown={(e) => e.key === "Enter" && onView()}
                role="button"
                tabIndex={0}
                aria-label={`View workflow ${workflow.name}`}
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
                    <span>{workflow.usage_count} use{workflow.usage_count !== 1 ? "s" : ""}</span>
                    <span className="flex items-center gap-1">
                        <LuClock className="h-3.5 w-3.5" />
                        {formatDate(workflow.published_at ?? workflow.updated_at)}
                    </span>
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onView(); }}
                        title="View"
                        className={iconBtn}
                        aria-label="View workflow"
                    >
                        <LuExternalLink className="h-4 w-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <article
            className={cn(
                "relative flex flex-col overflow-hidden rounded-xl border border-white/6 bg-white/2 transition-colors hover:border-white/10 hover:bg-white/4 cursor-pointer",
            )}
            onClick={onView}
            onKeyDown={(e) => e.key === "Enter" && onView()}
            role="button"
            tabIndex={0}
            aria-label={`View workflow ${workflow.name}`}
        >
            <div className="flex h-full flex-col">
                {/* Preview area */}
                <div className="relative mx-4 mt-4 mb-3">
                    <div className="w-full h-40 rounded-xl border border-white/8 bg-black/40 overflow-hidden relative">
                        <div className="relative h-full">
                            <PublicWorkflowCardPreview workflowId={workflow.id} />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col px-6 pb-6 pt-1">
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
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onView(); }}
                                title="View"
                                className={iconBtn}
                                aria-label="View workflow"
                            >
                                <LuExternalLink className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/6 pt-4 text-[12px] text-white/40">
                        <span>{workflow.usage_count} use{workflow.usage_count !== 1 ? "s" : ""}</span>
                        <span className="flex items-center gap-1">
                            <LuClock className="h-3 w-3" />
                            {formatDate(workflow.published_at ?? workflow.updated_at)}
                        </span>
                    </div>

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
    );
});
