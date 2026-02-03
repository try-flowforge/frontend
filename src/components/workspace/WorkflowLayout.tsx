"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/Tooltip";
import { LuX, LuSettings, LuTrash2 } from "react-icons/lu";
import { useWorkflow } from "@/context/WorkflowContext";
import { CategoryDropdown } from "@/components/ui/CategoryDropdown";
import { WorkflowCanvas } from "./workspace-layout/WorkflowCanvas";
import { WorkflowToolbar } from "./workspace-layout/WorkflowToolbar";
import { WorkflowBlockList } from "./workspace-layout/WorkflowBlockList";
import { WorkflowRightSidebar } from "./workspace-layout/WorkflowRightSidebar";
import { CanvasControls } from "./workspace-layout/CanvasControls";

interface WorkflowLayoutProps {
    onCategoryChange?: (categoryId: string) => void;
}

export function WorkflowLayout({ onCategoryChange }: WorkflowLayoutProps) {
    const {
        selectedNode,
        mobileMenuOpen,
        setMobileMenuOpen,
        setSelectedNode,
        categories,
        onDragOver,
        onDrop,
        handleZoomIn,
        handleZoomOut,
        handleFitView,
        contextMenu,
        closeContextMenu,
        deleteNodes,
        deleteEdge,
        isProtectedNode,
        undo,
        redo,
        canUndo,
        canRedo,
    } = useWorkflow();
    const [activeCategory, setActiveCategory] = useState("all");
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    const handleCategoryChange = (categoryId: string) => {
        setActiveCategory(categoryId);
        if (onCategoryChange) {
            onCategoryChange(categoryId);
        }
    };

    const handleMobileMenuClose = () => {
        setMobileMenuOpen(false);
    };

    // Handle keyboard shortcuts only when cursor is in workspace
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check if the event target is within the canvas container
            if (
                !canvasContainerRef.current ||
                !canvasContainerRef.current.contains(event.target as Node)
            ) {
                return;
            }

            // Check if user is typing in an input/textarea
            const target = event.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return;
            }

            const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
            const modifierKey = isMac ? event.metaKey : event.ctrlKey;

            // Undo: Ctrl/Cmd + Z
            if (modifierKey && event.key === "z" && !event.shiftKey && canUndo) {
                event.preventDefault();
                undo();
                return;
            }

            // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
            if (
                modifierKey &&
                (event.key === "y" || (event.key === "z" && event.shiftKey)) &&
                canRedo
            ) {
                event.preventDefault();
                redo();
                return;
            }

            // Zoom in: Ctrl/Cmd + Plus/Equal
            if (modifierKey && (event.key === "+" || event.key === "=")) {
                event.preventDefault();
                handleZoomIn();
                return;
            }

            // Zoom out: Ctrl/Cmd + Minus
            if (modifierKey && event.key === "-") {
                event.preventDefault();
                handleZoomOut();
                return;
            }

            // Zoom to fit: D
            if (event.key === "d" || event.key === "D") {
                event.preventDefault();
                handleFitView();
                return;
            }

            // Zoom to selection: F (disabled for now)
            // if (event.key === "f" || event.key === "F") {
            //   event.preventDefault();
            //   // handleZoomToSelection();
            //   return;
            // }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleZoomIn, handleZoomOut, handleFitView, undo, redo, canUndo, canRedo]);

    // Close context menu on click outside
    useEffect(() => {
        if (!contextMenu) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (
                contextMenuRef.current &&
                !contextMenuRef.current.contains(event.target as Node)
            ) {
                closeContextMenu();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [contextMenu, closeContextMenu]);

    const showRightSidebar = selectedNode !== null && selectedNode !== undefined;

    return (
        <div className="flex overflow-hidden bg-background relative min-h-screen">
            {/* Context menu for nodes and edges */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="fixed z-100 min-w-45 rounded-lg border border-white/20 bg-[#121212] shadow-xl overflow-hidden"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    {contextMenu.type === "node" && (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedNode(contextMenu.node);
                                    closeContextMenu();
                                }}
                                className="w-full px-4 py-2.5 text-sm text-left text-white/90 hover:bg-white/10 flex items-center gap-2"
                            >
                                <LuSettings className="w-4 h-4 text-white/70" />
                                Open configuration
                            </button>
                            {!isProtectedNode(contextMenu.node.id) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        deleteNodes([contextMenu.node.id]);
                                        closeContextMenu();
                                    }}
                                    className="w-full px-4 py-2.5 text-sm text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                >
                                    <LuTrash2 className="w-4 h-4" />
                                    Delete block
                                </button>
                            )}
                        </>
                    )}
                    {contextMenu.type === "edge" && (
                        <button
                            type="button"
                            onClick={() => {
                                if (contextMenu.edge.id) deleteEdge(contextMenu.edge.id);
                                closeContextMenu();
                            }}
                            className="w-full px-4 py-2.5 text-sm text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                        >
                            <LuTrash2 className="w-4 h-4" />
                            Delete connection
                        </button>
                    )}
                </div>
            )}

            {/* Mobile Backdrop Overlay */}
            {mobileMenuOpen && (
                <div
                    className="md:hidden fixed top-16 inset-x-0 bottom-0 bg-background/80 backdrop-blur-sm z-40"
                    onClick={handleMobileMenuClose}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Drawer - Slides in from left (below navbar) */}
            <div
                className={cn(
                    "md:hidden fixed top-16 left-0 bottom-0 z-50",
                    "w-70 max-w-[80vw]",
                    "bg-card border-r border-border",
                    "transform transition-transform duration-300 ease-in-out",
                    "flex overflow-hidden",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Mobile Category Strip */}
                <div className="w-14 border-r border-border bg-card/80 flex flex-col">
                    {/* Close Button */}
                    <div className="h-14 flex items-center justify-center border-b border-border">
                        <button
                            onClick={handleMobileMenuClose}
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                            aria-label="Close menu"
                        >
                            <LuX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Categories */}
                    <div className="flex-1 flex flex-col items-center gap-1 py-3 overflow-y-auto scrollbar-thin">
                        {categories.map((category) => (
                            <Tooltip key={category.id}>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => handleCategoryChange(category.id)}
                                        className={cn(
                                            "relative w-10 h-10 rounded-lg flex items-center justify-center",
                                            "transition-all duration-200",
                                            activeCategory === category.id
                                                ? "bg-primary/15 text-primary shadow-sm"
                                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                        )}
                                    >
                                        {category.icon}
                                        {activeCategory === category.id && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={8}>
                                    <p className="font-medium">{category.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </div>

                {/* Mobile Blocks Panel */}
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    <WorkflowBlockList activeCategory={activeCategory} />
                </div>
            </div>

            {/* Desktop: Single Sidebar with Logo, Dropdown, and Blocks */}
            <aside className="max-h-screen hidden md:flex flex-col overflow-hidden md:w-50 lg:w-55 xl:w-60 p-4 bg-white/5 border border-white/10 rounded-r-xl">
                {/* Category Dropdown */}
                <CategoryDropdown
                    categories={categories}
                    activeCategory={activeCategory}
                    onCategoryChange={handleCategoryChange}
                />

                {/* Blocks Panel */}
                <WorkflowBlockList activeCategory={activeCategory} />
            </aside>

            {/* Canvas area */}
            <main className="flex-1 max-w-600 mx-auto w-full flex flex-col bg-background px-3">
                {/* Toolbar */}
                <WorkflowToolbar />

                {/* Workflow Canvas - 90vh Height */}
                <div
                    ref={canvasContainerRef}
                    className="h-[90vh] w-full relative"
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    role="application"
                    aria-label="Workflow canvas - drag blocks here to build your workflow"
                    tabIndex={0}
                >
                    <WorkflowCanvas showBackground className="h-full" />

                    {/* Canvas Controls - Bottom Right (with execution history link) */}
                    <CanvasControls />
                </div>

                {/* Status Bar */}
                {/* <WorkflowStatusBar /> */}
            </main>

            {/* Mobile: Right Sidebar Overlay (Config Panel) */}
            {showRightSidebar && (
                <>
                    {/* Mobile Backdrop */}
                    <div
                        className="md:hidden fixed top-16 inset-x-0 bottom-0 bg-background/80 backdrop-blur-sm z-40"
                        onClick={() => {
                            setSelectedNode(null);
                        }}
                        aria-hidden="true"
                    />

                    {/* Mobile Config Drawer - Slides from right (below navbar) */}
                    <aside
                        className={cn(
                            "md:hidden fixed top-16 right-0 bottom-0 z-50",
                            "w-[320px] max-w-[85vw]",
                            "bg-card border-l border-border",
                            "overflow-y-auto scrollbar-thin",
                            "transform transition-transform duration-300 ease-in-out",
                            "translate-x-0"
                        )}
                    >
                        <WorkflowRightSidebar />
                    </aside>
                </>
            )}

            {/* Desktop: Right Sidebar - Configuration Panel */}
            <aside
                className={`rounded-l-xl border-l border-white/10 bg-white/5 overflow-y-auto transition-all duration-200 ${showRightSidebar ? "md:block" : "hidden"} md:w-70 lg:w-75 xl:w-[320px]`}
            >
                {showRightSidebar && <WorkflowRightSidebar />}
            </aside>
        </div>
    );
}
