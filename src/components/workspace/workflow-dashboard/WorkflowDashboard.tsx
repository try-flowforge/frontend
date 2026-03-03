"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { WorkflowCard } from "./WorkflowCard";
import { WorkflowCardSkeleton } from "./WorkflowCardSkeleton";
import { listWorkflows, deleteWorkflow } from "@/utils/workflow-api";
import type { WorkflowSummary } from "@/types/workflow";
import { LuPlus, LuSearch, LuLayoutGrid, LuList, LuRefreshCw, LuWorkflow, LuSearchX, LuSparkles, LuX, LuFilter } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

// localStorage key for view mode persistence
const VIEW_MODE_KEY = "workflow-dashboard-view-mode";

type SortOrder = "newest" | "oldest";
type StatusFilter = "all" | "success" | "failed" | "never_run";

export function WorkflowDashboard() {
    const router = useRouter();
    const { getPrivyAccessToken, authenticated, ready } = usePrivyWallet();

    const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const filterDropdownRef = useRef<HTMLDivElement>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Close filter dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
                setFilterDropdownOpen(false);
            }
        };
        if (filterDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [filterDropdownOpen]);

    // Debounce search query by 300ms
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // Load view mode from localStorage on mount
    useEffect(() => {
        const savedViewMode = localStorage.getItem(VIEW_MODE_KEY);
        if (savedViewMode === "grid" || savedViewMode === "list") {
            setViewMode(savedViewMode);
        }
    }, []);

    // Persist view mode to localStorage
    const handleViewModeChange = useCallback((mode: "grid" | "list") => {
        setViewMode(mode);
        localStorage.setItem(VIEW_MODE_KEY, mode);
    }, []);

    const fetchWorkflows = useCallback(async () => {
        if (!authenticated) return;

        setIsLoading(true);
        // setError(null);

        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) {
                // setError("Unable to authenticate. Please log in again.");
                setIsLoading(false);
                return;
            }

            const result = await listWorkflows({ accessToken });

            if (result.success) {
                setWorkflows(result.data || []);
            } else {
                // setError(result.error?.message || "Failed to load workflows");
                // console.error(result.error?.message);
            }
        } catch {
            // setError("An unexpected error occurred");
            // console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [authenticated, getPrivyAccessToken]);

    useEffect(() => {
        if (ready && authenticated) {
            fetchWorkflows();
        } else if (ready && !authenticated) {
            setIsLoading(false);
        }
    }, [ready, authenticated, fetchWorkflows]);

    const handleCreateNew = useCallback(() => {
        router.push("/automation-builder");
    }, [router]);

    const handleEdit = useCallback((workflowId: string) => {
        router.push(`/automation-builder?workflowId=${workflowId}`);
    }, [router]);

    const handleDelete = useCallback(async (workflowId: string) => {
        setIsDeleting(workflowId);

        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) {
                // alert("Unable to authenticate. Please log in again.");
                return;
            }

            const result = await deleteWorkflow({ workflowId, accessToken });

            if (result.success) {
                setWorkflows((prev) => prev.filter((w) => w.id !== workflowId));
            } else {
                // alert(result.error?.message || "Failed to delete workflow");
            }
        } catch {
            // alert("An unexpected error occurred");
            // console.error(err);
        } finally {
            setIsDeleting(null);
        }
    }, [getPrivyAccessToken]);

    const handleRun = useCallback((workflowId: string) => {
        router.push(`/automation-builder?workflowId=${workflowId}&autoRun=true`);
    }, [router]);

    // Memoize filtered and sorted workflows
    const filteredWorkflows = useMemo(() => {
        const query = debouncedSearchQuery.toLowerCase();
        let result = workflows;

        // Search filter
        if (query) {
            result = result.filter((workflow) =>
                workflow.name.toLowerCase().includes(query) ||
                workflow.description?.toLowerCase().includes(query)
            );
        }

        // Status filter: last run success / failed / never run
        if (statusFilter !== "all") {
            result = result.filter((workflow) => {
                const status = workflow.last_execution_status;
                if (statusFilter === "success") return status === "SUCCESS";
                if (statusFilter === "failed") return status === "FAILED";
                if (statusFilter === "never_run") return status == null || workflow.execution_count === 0;
                return true;
            });
        }

        // Sort by updated_at
        result = [...result].sort((a, b) => {
            const dateA = new Date(a.updated_at).getTime();
            const dateB = new Date(b.updated_at).getTime();
            return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [workflows, debouncedSearchQuery, statusFilter, sortOrder]);

    // Show login prompt if not authenticated
    if (ready && !authenticated) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <LuLayoutGrid className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">Sign in to view your workflows</h2>
                    <p className="text-muted-foreground max-w-md">
                        Connect your wallet to access your saved workflows and create new automations.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-4 sm:px-6 lg:px-8 w-full">
            {/* Header */}
            <div className="pt-32 pb-12">
                <h1 className="text-[5vw] text-center font-bold">
                    Your Automations
                </h1>
            </div>

            {/* Search and View Toggle */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-8 w-full">
                <div className="flex items-center gap-2 w-full flex-wrap">
                    <div className="relative flex items-center justify-start rounded-full border border-white/20 px-4 h-[44px] group hover:border-white/30 transition-all duration-300 flex-1 min-w-[200px] max-w-xl">
                        <input
                            type="text"
                            placeholder="Search your flows..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-semibold text-white placeholder:text-white/50 w-full pr-10"
                            aria-label="Search workflows"
                        />
                        <Button
                            type="button"
                            className="absolute right-0 p-0! w-[42px]! h-[42px]!"
                            title="Search"
                            aria-label="Search"
                        >
                            <LuSearch className="w-4 h-4" />
                        </Button>
                    </div>


                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={fetchWorkflows}
                            disabled={isLoading}
                            className="w-10 h-10 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-amber-600/50"
                            title="Refresh"
                            aria-label="Refresh workflows"
                        >
                            <LuRefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                        </button>

                        <div className="flex p-1 rounded-full border border-white/20 h-[44px]">
                            <button
                                type="button"
                                onClick={() => handleViewModeChange("grid")}
                                className={cn(
                                    "p-2.5 rounded-full transition-all duration-200",
                                    viewMode === "grid"
                                        ? "bg-white/20 text-white"
                                        : "text-white/70 hover:text-white hover:bg-white/10"
                                )}
                                title="Grid view"
                                aria-label="Grid view"
                                aria-pressed={viewMode === "grid"}
                            >
                                <LuLayoutGrid className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleViewModeChange("list")}
                                className={cn(
                                    "p-2.5 rounded-full transition-all duration-200",
                                    viewMode === "list"
                                        ? "bg-white/20 text-white"
                                        : "text-white/70 hover:text-white hover:bg-white/10"
                                )}
                                title="List view"
                                aria-label="List view"
                                aria-pressed={viewMode === "list"}
                            >
                                <LuList className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>


                        {/* Filter dropdown beside search */}
                        <div className="relative h-[44px] shrink-0" ref={filterDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setFilterDropdownOpen((o) => !o)}
                                className={cn(
                                    "h-full aspect-square flex items-center justify-center rounded-full border border-white/20 text-sm font-medium transition-all duration-200",
                                    filterDropdownOpen
                                        ? "bg-white/20 text-white border-white/30"
                                        : "text-white/70 hover:text-white hover:bg-white/10 hover:border-white/25"
                                )}
                                aria-expanded={filterDropdownOpen}
                                aria-haspopup="true"
                                title="Filter & sort"
                            >
                                <LuFilter className="w-4 h-4 shrink-0" />
                            </button>
                            {filterDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 min-w-[220px] rounded-xl border border-white/20 bg-[#121212] shadow-xl z-50 overflow-hidden">
                                    <div className="p-2">
                                        <p className="px-3 py-1.5 text-xs font-semibold text-white/50 uppercase tracking-wider">Sort</p>
                                        {(
                                            [
                                                { value: "newest" as const, label: "Newest first" },
                                                { value: "oldest" as const, label: "Oldest first" },
                                            ] as const
                                        ).map(({ value, label }) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setSortOrder(value)}
                                                className={cn(
                                                    "w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors",
                                                    sortOrder === value ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                                                )}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="border-t border-white/10 p-2">
                                        <p className="px-3 py-1.5 text-xs font-semibold text-white/50 uppercase tracking-wider">Status</p>
                                        {(
                                            [
                                                { value: "all" as const, label: "All" },
                                                { value: "success" as const, label: "Successful" },
                                                { value: "failed" as const, label: "Failed" },
                                                { value: "never_run" as const, label: "Never run" },
                                            ] as const
                                        ).map(({ value, label }) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setStatusFilter(value)}
                                                className={cn(
                                                    "w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors",
                                                    statusFilter === value ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                                                )}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Button
                    onClick={() => router.push("/public-workflows")}
                    className="shrink-0"
                    border
                    borderColor="#ffffff"
                    title="Checkout Public Automations"
                    aria-label="Checkout Public Automations"
                >
                    Checkout Public Automations
                </Button>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className={cn(
                    viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        : "space-y-3"
                )}>
                    {[...Array(3)].map((_, i) => (
                        <WorkflowCardSkeleton key={i} viewMode={viewMode} />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredWorkflows.length === 0 && (
                <div className="min-h-[50vh] flex items-center justify-center px-4 overflow-hidden w-full">
                    <div
                        className={cn(
                            "group relative w-full max-w-md rounded-2xl border border-white/20 bg-white/5 p-8 sm:p-10 overflow-hidden",
                            "shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]",
                            "transition-all duration-300 ease-out",
                            "hover:border-white/30 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_8px_32px_-8px_rgba(0,0,0,0.4)]"
                        )}
                    >
                        {/* Accent line */}
                        <div
                            className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-80"
                            style={{
                                background: "linear-gradient(180deg, rgba(249,115,22,0.95) 0%, rgba(251,146,60,0.7) 50%, rgba(249,115,22,0.25) 100%)",
                                boxShadow: "0 0 12px rgba(249,115,22,0.25)",
                            }}
                        />

                        <div
                            className="absolute right-0 top-0 bottom-0 w-0.5 rounded-r-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-80"
                            style={{
                                background: "linear-gradient(180deg, rgba(249,115,22,0.95) 0%, rgba(251,146,60,0.7) 50%, rgba(249,115,22,0.25) 100%)",
                                boxShadow: "0 0 12px rgba(249,115,22,0.25)",
                            }}
                        />
                        <div className="relative text-center space-y-7">
                            <div
                                className={cn(
                                    "mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10",
                                    "bg-linear-to-br from-white/6 to-transparent",
                                    "ring-1 ring-white/5 transition-all duration-300",
                                    "shadow-[0_0_24px_-4px_rgba(249,115,22,0.15)]",
                                    !searchQuery && "group-hover:shadow-[0_0_32px_-4px_rgba(249,115,22,0.2)] group-hover:border-amber-500/20"
                                )}
                            >
                                {searchQuery ? (
                                    <LuSearchX className="h-11 w-11 text-white/50" strokeWidth={1.5} />
                                ) : (
                                    <LuWorkflow className="h-11 w-11 text-amber-500/95" strokeWidth={1.5} />
                                )}
                            </div>
                            <div className="space-y-2.5">
                                <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                                    {searchQuery ? "No workflows found" : "No workflows yet"}
                                </h3>
                                <p className="text-sm text-white/55 max-w-sm mx-auto leading-relaxed">
                                    {searchQuery
                                        ? "No automations match your search. Try a different term or clear the search to see all workflows."
                                        : "Create your first workflow to automate tasks and connect services."}
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-4">
                                {searchQuery ? (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className={cn(
                                            "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium",
                                            "border border-white/20 bg-white/5 text-white/90",
                                            "hover:bg-white/10 hover:border-white/30 transition-all duration-200"
                                        )}
                                    >
                                        <LuX className="h-4 w-4 shrink-0" />
                                        Clear search
                                    </button>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleCreateNew}
                                            className="inline-flex items-center gap-2 shrink-0 px-6"
                                        >
                                            <LuPlus className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden />
                                            <span>Create Workflow</span>
                                        </Button>
                                        <p className="flex items-center gap-1.5 text-xs text-white/40 text-center">
                                            <LuSparkles className="h-3.5 w-3.5 shrink-0" />
                                            Start from scratch or checkout public workflows
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Workflow Grid/List */}
            {!isLoading && filteredWorkflows.length > 0 && (
                <div className={cn(
                    viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        : "space-y-3"
                )}>
                    {filteredWorkflows.map((workflow) => (
                        <WorkflowCard
                            key={workflow.id}
                            workflow={workflow}
                            viewMode={viewMode}
                            isDeleting={isDeleting === workflow.id}
                            onEdit={() => handleEdit(workflow.id)}
                            onDelete={() => handleDelete(workflow.id)}
                            onRun={() => handleRun(workflow.id)}
                            getAccessToken={getPrivyAccessToken}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
