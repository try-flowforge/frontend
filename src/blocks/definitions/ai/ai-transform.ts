import type { BlockDefinition } from "../../types";
import { getAiModelConfig } from "@/config/ai";

/**
 * Helper function to create AI Transform blocks
 */
const createAiTransformBlock = (
  id: string,
  label: string,
  provider: string,
  model: string,
  iconName: string
): BlockDefinition => {
  const modelConfig = getAiModelConfig(model);

  return {
    id,
    label,
    iconName,
    description: `AI-powered data transformation using ${label}`,
    category: "ai",
    nodeType: "ai-transform",
    backendType: "LLM_TRANSFORM",
    sharedConfigComponent: "ai-transform",
    configComponentProps: {},
    defaultData: {
      label,
      description: "Transform data with AI",
      status: "idle" as const,
      llmProvider: provider,
      llmModel: model,
      userPromptTemplate: "",
      temperature: modelConfig.temperature,
      maxOutputTokens: modelConfig.maxOutputTokens,
    },
  };
};

// Individual AI Transform blocks
export const aiTransformQwen: BlockDefinition = createAiTransformBlock(
  "ai-openrouter-qwen-free",
  "Qwen",
  "openrouter",
  "openrouter:qwen",
  "QwenLogo"
);

export const aiTransformGLM: BlockDefinition = createAiTransformBlock(
  "ai-openrouter-glm-free",
  "GLM",
  "openrouter",
  "openrouter:glm",
  "GLMLogo"
);

export const aiTransformDeepSeek: BlockDefinition = createAiTransformBlock(
  "ai-openrouter-deepseek-free",
  "DeepSeek",
  "openrouter",
  "openrouter:deepseek",
  "DeepSeekLogo"
);

export const aiTransformChatGPT: BlockDefinition = createAiTransformBlock(
  "ai-openai-chatgpt",
  "ChatGPT",
  "openai",
  "gpt-5-nano",
  "ChatGPTLogo"
);

// Export all AI blocks
export const aiBlocks: BlockDefinition[] = [
  aiTransformQwen,
  aiTransformGLM,
  aiTransformDeepSeek,
  aiTransformChatGPT,
];
