/**
 * Coming Soon Block Types
 * Defines interfaces for upcoming protocol integrations
 */

import type { BlockDefinition } from "../types";

/**
 * Extended block definition for coming soon features
 */
export interface ComingSoonBlockDefinition extends BlockDefinition {
    isComingSoon: true;
    protocolUrl?: string;
    automationCapabilities: string[];
}

/**
 * Coming Soon Category Definition
 */
export interface ComingSoonCategoryDefinition {
    id: string;
    label: string;
    iconName: string;
    description: string;
    blocks: ComingSoonBlockDefinition[];
}
