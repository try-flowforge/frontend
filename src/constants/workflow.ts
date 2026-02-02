/**
 * Workflow Constants
 * Centralized constants for workflow-related features
 */

export const WORKFLOW_CONSTANTS = {
    MAX_DESCRIPTION_LENGTH: 250,
    DEFAULT_FETCH_LIMIT: 20,
    SEARCH_DEBOUNCE_MS: 500,
    SKELETON_CARDS_COUNT: 6,
} as const;

export const WORKFLOW_VIEW_MODES = {
    GRID: 'grid',
    LIST: 'list',
} as const;

export type WorkflowViewMode = typeof WORKFLOW_VIEW_MODES[keyof typeof WORKFLOW_VIEW_MODES];

/**
 * Tag mappings for workflow nodes
 * Maps node types to their associated tags
 */
export const TAG_MAPPINGS = {
    // DeFi protocols
    uniswap: ['uniswap'],
    aave: ['aave'],
    compound: ['compound'],
    oneinch: ['1inch'],
    relay: ['relay'],

    // Communication & Notifications
    email: ['email'],
    mail: ['email'],
    slack: ['slack'],
    telegram: ['telegram'],

    // Logic nodes
    if: ['logic'],
    switch: ['logic'],

    // Wallet operations
    'wallet-node': ['wallet'],
    wallet: ['wallet'],

    // AI & Automation
    'ai-transform': ['ai'],
} as const;

/**
 * ReactFlow preview configuration
 */
export const PREVIEW_EDGE_OPTIONS = {
    type: "smoothstep",
    animated: true,
    style: {
        stroke: "#ffffff",
        strokeWidth: 1,
    },
} as const;

export const PREVIEW_BACKGROUND_CONFIG = {
    gap: 20,
    size: 2,
    color: "rgba(255, 255, 255, 0.08)",
} as const;
