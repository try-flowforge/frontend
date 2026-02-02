/**
 * Backend Mapping Utilities
 * Centralizes logic for transforming between frontend and backend node formats
 */

import type { Node } from "reactflow";
import type { BackendNode } from "../types";
import { getBlockByNodeType, normalizeNodeType as normalizeNodeTypeFromRegistry } from "../registry";
import { getAiModelConfig } from "@/config/ai";

/**
 * Extract node-specific configuration from node data
 * Uses block metadata if available, otherwise falls back to type-specific logic
 */
export function extractNodeConfig(node: Node): Record<string, unknown> {
  const data = node.data || {};
  const type = node.type || "";

  // Try to use block's custom extractor if available
  const block = getBlockByNodeType(type);
  if (block?.configExtractor) {
    return block.configExtractor(node);
  }

  // Fallback to type-specific extraction logic
  switch (type) {
    case "api":
      return {
        url: data.url,
        method: data.method,
        headers: data.headers,
        queryParams: data.queryParams,
        body: data.body,
        auth: data.auth,
      };

    case "slack":
      return {
        connectionId: data.slackConnectionId,
        message: data.slackMessage || data.testMessage || "",
        connectionType: data.slackConnectionType || "webhook",
        channelId: data.slackChannelId,
      };

    case "telegram":
      return {
        connectionId: data.telegramConnectionId,
        chatId: data.telegramChatId,
        message: data.telegramMessage || "",
      };

    case "uniswap":
    case "relay":
    case "oneinch":
    case "lifi":
      return {
        // Ensure provider is always persisted; LI.FI blocks should never fall back to UNISWAP.
        provider: data.swapProvider || (type === "lifi" ? "LIFI" : undefined),
        chain: data.swapChain,
        inputConfig: {
          sourceToken: {
            address: data.sourceTokenAddress,
            symbol: data.sourceTokenSymbol,
            decimals: data.sourceTokenDecimals || 18,
          },
          destinationToken: {
            address: data.destinationTokenAddress,
            symbol: data.destinationTokenSymbol,
            decimals: data.destinationTokenDecimals || 18,
          },
          amount: data.swapAmount,
          swapType: data.swapType || "EXACT_INPUT",
          walletAddress: data.walletAddress,
        },
        simulateFirst: data.simulateFirst ?? true,
        autoRetryOnFailure: data.autoRetryOnFailure ?? true,
        maxRetries: data.maxRetries ?? 3,
      };

    case "if":
      return {
        leftPath: data.leftPath,
        operator: data.operator,
        rightValue: data.rightValue,
      };

    case "switch":
      return {
        valuePath: data.valuePath || "",
        cases: data.cases || [],
      };

    case "mail":
      return {
        to: data.emailTo,
        subject: data.emailSubject,
        body: data.emailBody,
      };

    case "ai-transform": {
      const aiConfig = getAiModelConfig(data.llmModel as string);

      return {
        provider: data.llmProvider,
        model: data.llmModel,
        userPromptTemplate: data.userPromptTemplate,
        outputSchema: data.outputSchema,
        // Temperature and max tokens are enforced by internal config
        temperature: aiConfig.temperature,
        maxOutputTokens: aiConfig.maxOutputTokens,
      };
    }

    case "start":
      return {};

    case "wallet-node":
      return {};

    case "chainlink":
      return {
        provider: "CHAINLINK",
        chain: data.oracleChain || "ARBITRUM_SEPOLIA",
        aggregatorAddress: data.aggregatorAddress,
        staleAfterSeconds: data.staleAfterSeconds || 3600,
        // Include metadata for debugging
        ...(data.symbol && { symbol: data.symbol }),
        ...(data.feedName && { feedName: data.feedName }),
      };

    case "pyth":
      return {
        provider: "PYTH",
        chain: data.oracleChain || "ARBITRUM_SEPOLIA",
        priceFeedId: data.priceFeedId,
        staleAfterSeconds: data.staleAfterSeconds || 3600,
        // Include metadata for debugging
        ...(data.symbol && { symbol: data.symbol }),
        ...(data.feedName && { feedName: data.feedName }),
      };

    default:
      // Fallback: extract common fields
      return {
        ...(data.leftPath && { leftPath: data.leftPath }),
        ...(data.operator && { operator: data.operator }),
        ...(data.rightValue && { rightValue: data.rightValue }),
      };
  }
}

/**
 * Transform backend node to React Flow node format
 * Uses block metadata if available, otherwise falls back to generic transformation
 */
export function transformNodeToCanvas(backendNode: BackendNode): Node {
  const frontendType = (backendNode.metadata?.frontendType as string) ||
    (typeof backendNode.type === 'string' ? backendNode.type.toLowerCase() : 'base');

  // Handle nullable name from backend API
  const nodeName = backendNode.name ?? backendNode.id;

  // Try to use block's custom transformer if available
  const block = getBlockByNodeType(frontendType);
  if (block?.configTransformer) {
    const nodeData = block.configTransformer(backendNode);
    return {
      id: backendNode.id,
      type: frontendType,
      position: backendNode.position || { x: 0, y: 0 },
      data: {
        ...nodeData,
        label: nodeName,
        description: backendNode.description ?? undefined,
        blockId: backendNode.metadata?.blockId,
        iconName: backendNode.metadata?.iconName,
        status: backendNode.metadata?.status || "idle",
      },
    };
  }

  // Fallback to generic transformation
  return {
    id: backendNode.id,
    type: frontendType,
    position: backendNode.position || { x: 0, y: 0 },
    data: {
      label: nodeName,
      description: backendNode.description ?? undefined,
      blockId: backendNode.metadata?.blockId,
      iconName: backendNode.metadata?.iconName,
      status: backendNode.metadata?.status || "idle",
      ...backendNode.config,
    },
  };
}

/**
 * Normalize frontend node type to backend type
 * Re-exports from registry for convenience
 */
export function normalizeNodeType(frontendType: string): string {
  return normalizeNodeTypeFromRegistry(frontendType);
}
