/**
 * AI Model Configuration (frontend-only)
 * Mirrors the important parts of the llm-service config, but lives entirely in the n8n app.
 *
 * NOTE: Do not import configs from other projects; keep this file self-contained.
 */

export interface AiModelConfig {
  /** Internal model identifier used by the LLM service */
  id: string;
  /** Provider identifier */
  provider: "openrouter" | "openai";
  /** Human readable name */
  displayName: string;
  /** Model name passed to the LLM service */
  model: string;
  /** Neutral/default temperature for this model */
  temperature: number;
  /** Safe max output tokens for this model */
  maxOutputTokens: number;
}

/**
 * Static mapping keyed by the `llmModel` value used in AI blocks.
 *
 * This intentionally does NOT import from other projects – values are copied here.
 */
const AI_MODEL_CONFIG_BY_MODEL: Record<string, AiModelConfig> = {
  // Qwen - based on llm-service/config/models.json
  "openrouter:qwen": {
    id: "openrouter-qwen-free",
    provider: "openrouter",
    displayName: "Qwen",
    model: "qwen/qwen3-coder:free",
    temperature: 0.7,
    maxOutputTokens: 4096,
  },

  // GLM
  "openrouter:glm": {
    id: "openrouter-glm-free",
    provider: "openrouter",
    displayName: "GLM",
    model: "z-ai/glm-4.5-air:free",
    temperature: 0.7,
    maxOutputTokens: 96000,
  },

  // DeepSeek
  "openrouter:deepseek": {
    id: "openrouter-deepseek-free",
    provider: "openrouter",
    displayName: "DeepSeek",
    model: "deepseek/deepseek-r1-0528:free",
    temperature: 0.7,
    maxOutputTokens: 4096,
  },

  // ChatGPT
  "gpt-5-nano": {
    id: "openai-chatgpt",
    provider: "openai",
    displayName: "ChatGPT",
    model: "gpt-5-nano",
    temperature: 0.7,
    maxOutputTokens: 16384,
  },

  // GPT-4o mini
  "gpt-4o-mini": {
    id: "openai-gpt-4o-mini",
    provider: "openai",
    displayName: "GPT-4o mini",
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxOutputTokens: 16384,
  },
};

const DEFAULT_AI_MODEL_CONFIG: AiModelConfig = {
  id: "default",
  provider: "openrouter",
  displayName: "Default",
  model: "default",
  temperature: 0.7,
  maxOutputTokens: 1000,
};

/**
 * Lookup helper by `llmModel` string.
 * Falls back to a safe default if the model is unknown.
 */
export function getAiModelConfig(model?: string | null): AiModelConfig {
  if (!model) {
    return DEFAULT_AI_MODEL_CONFIG;
  }

  return AI_MODEL_CONFIG_BY_MODEL[model] || DEFAULT_AI_MODEL_CONFIG;
}

