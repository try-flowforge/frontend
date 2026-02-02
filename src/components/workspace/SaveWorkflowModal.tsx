"use client";

import { useState, useMemo } from "react";
import { LuX } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { generateTagsFromNodes } from "@/utils/workflow-tags";
import { WORKFLOW_CONSTANTS } from "@/constants/workflow";
import type { Node } from "reactflow";

interface SaveWorkflowModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (params: {
        workflowName: string;
        isPublic: boolean;
        description?: string;
        tags?: string[];
    }) => void;
    workflowName: string;
    currentDescription?: string;
    nodes: Node[];
    currentVersion?: number;
    currentWorkflowId?: string | null;
    currentTags?: string[];
    isPublic?: boolean;
}

export function SaveWorkflowModal({
    isOpen,
    onClose,
    onSave,
    workflowName,
    currentDescription = "",
    nodes,
    currentVersion = 1,
    currentWorkflowId,
    isPublic = false,
}: SaveWorkflowModalProps) {
    const [editedName, setEditedName] = useState(workflowName);
    const [visibility, setVisibility] = useState<"private" | "public">(isPublic ? "public" : "private");
    const [description, setDescription] = useState(currentDescription);
    const [errors, setErrors] = useState<{
        name?: string;
        description?: string;
        tags?: string;
    }>({});

    // Auto-generate tags from nodes
    const autoTags = useMemo(() => generateTagsFromNodes(nodes), [nodes]);

    const handleDescriptionChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        const newValue = e.target.value;

        // Only enforce limit for public workflows
        if (visibility === "public" && newValue.length > WORKFLOW_CONSTANTS.MAX_DESCRIPTION_LENGTH) {
            return;
        }

        setDescription(newValue);
        setErrors({ ...errors, description: undefined });
    };

    const validate = (): boolean => {
        const newErrors: {
            name?: string;
            description?: string;
            tags?: string;
        } = {};

        // Validate workflow name
        if (!editedName.trim()) {
            newErrors.name = "Workflow name is required";
        }

        if (visibility === "public") {
            if (!description.trim()) {
                newErrors.description = "Description is required for public workflows";
            }
            if (autoTags.length === 0) {
                newErrors.tags =
                    "Workflow must have at least one node to generate tags";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) {
            return;
        }

        onSave({
            workflowName: editedName.trim(),
            isPublic: visibility === "public",
            description: description.trim() || undefined,
            tags:
                visibility === "public" && autoTags.length > 0 ? autoTags : undefined,
        });
    };

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-workflow-title"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-background backdrop-blur-md"
                onClick={handleBackdropClick}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                className="relative z-50 w-full max-w-lg bg-black/95 border-white/20 border rounded-xl shadow-lg animate-in fade-in-0 zoom-in-95 duration-200 mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <h2
                            id="save-workflow-title"
                            className="text-xl font-semibold text-foreground"
                        >
                            Save Workflow
                        </h2>
                        {currentWorkflowId ? (
                            <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                                v.{currentVersion} → v.{currentVersion + 1}
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                                New
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 hover:bg-white/5"
                        aria-label="Close"
                    >
                        <LuX className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {/* Workflow Name */}
                    <div className="space-y-2">
                        <Label htmlFor="workflow-name" required>
                            Workflow Name
                        </Label>
                        <Input
                            id="workflow-name"
                            type="text"
                            value={editedName}
                            onChange={(e) => {
                                setEditedName(e.target.value);
                                setErrors({ ...errors, name: undefined });
                            }}
                            placeholder="Enter workflow name..."
                            error={errors.name}
                        />
                    </div>

                    {/* Visibility Radio */}
                    <div className="space-y-2">
                        <Label>Visibility</Label>
                        <div className="space-y-3">
                            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-colors">
                                <input
                                    type="radio"
                                    name="visibility"
                                    value="private"
                                    checked={visibility === "private"}
                                    onChange={(e) => setVisibility(e.target.value as "private")}
                                    className="w-4 h-4 mt-0.5 text-primary focus:ring-primary focus:ring-offset-0"
                                />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-foreground">
                                        Private
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        Only you can access this workflow
                                    </div>
                                </div>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-colors">
                                <input
                                    type="radio"
                                    name="visibility"
                                    value="public"
                                    checked={visibility === "public"}
                                    onChange={(e) => setVisibility(e.target.value as "public")}
                                    className="w-4 h-4 mt-0.5 text-primary focus:ring-primary focus:ring-offset-0"
                                />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-foreground">
                                        Public
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        Anyone can discover and use this workflow
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Public-specific fields */}
                    {visibility === "public" && (
                        <div className="space-y-5 pt-2 border-t border-white/10">
                            {/* Description with character limit */}
                            <div className="space-y-2">
                                <Label htmlFor="description" required>
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={handleDescriptionChange}
                                    placeholder="Describe what this workflow does..."
                                    rows={3}
                                    error={errors.description}
                                    className="resize-none"
                                />
                                {!errors.description && (
                                    <p className="text-xs text-muted-foreground">
                                        {description.length}/{WORKFLOW_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters
                                    </p>
                                )}
                            </div>

                            {/* Auto-generated Tags (read-only) */}
                            <div className="space-y-2">
                                <Label>
                                    Tags{" "}
                                    <span className="text-muted-foreground text-xs font-normal">
                                        (auto-generated)
                                    </span>
                                </Label>
                                {autoTags.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
                                        {autoTags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center px-3 py-1.5 bg-primary/20 text-primary text-sm rounded-md font-medium border border-primary/30"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                        <p className="text-sm text-muted-foreground text-center">
                                            Add nodes to your workflow to generate tags automatically
                                        </p>
                                    </div>
                                )}
                                {errors.tags && (
                                    <p className="text-xs text-destructive">{errors.tags}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
                    <Button
                        onClick={onClose}
                        // variant="secondary"
                        className="min-w-[100px]"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="min-w-[100px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    >
                        Save Workflow
                    </Button>
                </div>
            </div>
        </div>
    );
}
