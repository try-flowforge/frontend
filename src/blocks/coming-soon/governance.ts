/**
 * Governance Category - Coming Soon
 * DAO Voting & Proposals
 */

import type { ComingSoonBlockDefinition } from "./types";

export const snapshotBlock: ComingSoonBlockDefinition = {
    id: "snapshot",
    label: "Snapshot",
    iconName: "SnapshotLogo",
    description: "Off-chain voting",
    category: "governance",
    isComingSoon: true,
    protocolUrl: "https://snapshot.org",
    automationCapabilities: [
        "Auto-vote based on predefined rules",
        "Delegate voting power automatically",
        "Alert on new proposals",
        "Voting history tracking",
    ],
};

export const tallyBlock: ComingSoonBlockDefinition = {
    id: "tally",
    label: "Tally",
    iconName: "TallyLogo",
    description: "On-chain governance aggregator",
    category: "governance",
    isComingSoon: true,
    protocolUrl: "https://tally.xyz",
    automationCapabilities: [
        "On-chain voting automation",
        "Multi-DAO governance management",
        "Proposal tracking and alerts",
        "Delegation optimization",
    ],
};

export const governanceBlocks: ComingSoonBlockDefinition[] = [
    snapshotBlock,
    tallyBlock,
];
