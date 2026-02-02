import type { BlockDefinition } from "../../types";

/**
 * API Block
 * Allows making HTTP requests to external APIs
 */
export const apiBlock: BlockDefinition = {
    id: "api",
    label: "HTTP Request",
    iconName: "ApiLogo",
    description: "Make HTTP requests to external APIs",
    category: "general",
    nodeType: "api",
    backendType: "API",
    defaultData: {
        label: "HTTP Request",
        method: "GET",
        url: "",
        headers: [],
        queryParams: [],
        body: "",
        auth: { type: "none" },
        description: "Make HTTP requests to external APIs", // Added default description
    },
};

export default apiBlock;
