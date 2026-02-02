/**
 * Workflow Tag Utilities
 * Functions for managing workflow tags
 */

import type { Node } from "reactflow";
import type { PublicWorkflowSummary } from "@/types/workflow";
import { TAG_MAPPINGS } from "@/constants/workflow";
import { getAiModelConfig } from "@/config/ai";

/**
 * Extract unique tags from a list of workflows
 */
export function extractUniqueTags(
    workflows: PublicWorkflowSummary[]
): string[] {
    const tagSet = new Set<string>();

    workflows.forEach((workflow) => {
        if (workflow.tags && Array.isArray(workflow.tags)) {
            workflow.tags.forEach((tag) => tagSet.add(tag));
        }
    });

    return Array.from(tagSet).sort();
}

/**
 * Generate tags from workflow nodes based on their types
 * Uses TAG_MAPPINGS to create comprehensive tag lists
 */
export function generateTagsFromNodes(nodes: Node[]): string[] {
    const tagSet = new Set<string>();

    nodes.forEach((node) => {
        // Skip the start node
        if (node.type === "start" || node.id === "start-node") {
            return;
        }

        // Get node type from type or blockId
        const nodeType = (node.type || node.data?.blockId)?.toLowerCase();
        if (!nodeType) return;

        // Add tags from mapping
        const mappedTags = TAG_MAPPINGS[nodeType as keyof typeof TAG_MAPPINGS];
        if (mappedTags) {
            mappedTags.forEach((tag) => tagSet.add(tag));
        }

        // Special handling for AI nodes to get provider/model name
        if (nodeType === 'ai-transform') {
            const data = node.data as Record<string, unknown>;
            const modelId = data?.llmModel as string | undefined;

            if (modelId) {
                const config = getAiModelConfig(modelId);

                if (config && config.displayName && config.displayName !== 'Default') {
                    tagSet.add(config.displayName.toLowerCase());
                }
            }
        }
    });

    return Array.from(tagSet).sort();
}
