/**
 * API route: Generate workflow from natural language using OpenRouter.
 * Returns a linear sequence of block IDs that the frontend turns into nodes/edges.
 * Uses AI model and settings from @/config/ai (getAiModelConfig).
 */

import { NextRequest, NextResponse } from "next/server";
import { getAiModelConfig } from "@/config/ai";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/** Model key from ai.ts used for workflow generation (OpenRouter). */
const WORKFLOW_GENERATION_MODEL = "gpt-4o-mini";

// Blocks available for workflow building (exclude hidden triggers like Start).
// Used only for the LLM prompt; Start is always added by the frontend.
const BLOCKS_FOR_AI = [
  { id: "api", label: "HTTP Request", description: "Make GET/POST etc. requests to any URL" },
  { id: "telegram", label: "Telegram", description: "Send messages to a Telegram chat" },
  { id: "slack", label: "Slack", description: "Send messages to Slack channel or webhook" },
  { id: "mail", label: "Email", description: "Send emails" },
  { id: "if", label: "If / Condition", description: "Branch workflow based on a condition" },
  { id: "switch", label: "Switch", description: "Route to different branches by value" },
  { id: "wallet", label: "Wallet", description: "Use connected wallet (e.g. for DeFi steps)" },
  { id: "uniswap", label: "Uniswap Swap", description: "Swap tokens on Uniswap" },
  { id: "lifi", label: "LiFi", description: "Cross-chain swap/bridge via LiFi" },
  { id: "aave", label: "Aave", description: "Lend/borrow on Aave" },
  { id: "compound", label: "Compound", description: "Supply/borrow on Compound" },
  { id: "chainlink", label: "Chainlink", description: "Fetch data from Chainlink oracles" },
  { id: "pyth", label: "Pyth", description: "Fetch price/data from Pyth Network" },
  { id: "ai-openai-chatgpt", label: "ChatGPT", description: "AI transformation/generation using ChatGPT" },
  { id: "ai-openrouter-qwen-free", label: "Qwen", description: "AI transformation/generation using Qwen" },
  { id: "ai-openrouter-glm-free", label: "GLM", description: "AI transformation/generation using GLM" },
  { id: "ai-openrouter-deepseek-free", label: "DeepSeek", description: "AI transformation/generation using DeepSeek" },
];

function buildSystemPrompt(): string {
  const blockList = BLOCKS_FOR_AI.map(
    (b) => `- ${b.id}: ${b.label} — ${b.description}`
  ).join("\n");

  return `You are a workflow assistant. The user describes what they want their workflow to do. You must respond with a valid JSON object only, no markdown or explanation.

Available blocks (use the "id" as blockId in your response):
${blockList}

Rules:
1. Every workflow starts with an implicit "Start" trigger; do not include Start in steps.
2. Return a linear sequence of steps when possible. Use "if" or "switch" only when the user clearly needs branching.
3. For "if", the step is one block; the frontend will connect True/False branches.
4. If the user wants AI transformation or generation: 
   - Use the specific model ID if they mention "Qwen", "GLM", or "DeepSeek".
   - Default to "ai-openai-chatgpt" (ChatGPT) if no specific model is mentioned.
5. Suggest a short, clear workflow name based on the user's request.

Response format (JSON only):
{
  "workflowName": "string",
  "steps": [ { "blockId": "string" }, ... ]
}

Example: "When price is above 100, send a Telegram message"
→ { "workflowName": "Price alert to Telegram", "steps": [ { "blockId": "pyth" }, { "blockId": "if" }, { "blockId": "telegram" } ] }

Respond with only the JSON object.`;
}

export interface GenerateWorkflowResponse {
  workflowName: string;
  steps: { blockId: string }[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt =
      typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing or invalid prompt" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // console.error("OPENAI_API_KEY is not set");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    const aiConfig = getAiModelConfig(WORKFLOW_GENERATION_MODEL);
    const systemPrompt = buildSystemPrompt();
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: aiConfig.temperature,
        max_tokens: Math.min(aiConfig.maxOutputTokens, 4096),
      }),
    });

    if (!response.ok) {
      // const errText = await response.text();
      // console.error("OpenAI error:", response.status, errText);
      return NextResponse.json(
        { error: "AI service request failed" },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content =
      data?.choices?.[0]?.message?.content?.trim() ?? "";

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 502 }
      );
    }

    // Parse JSON (strip possible markdown code fence)
    let jsonStr = content;
    const codeMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) {
      jsonStr = codeMatch[1].trim();
    }
    const parsed = JSON.parse(jsonStr) as GenerateWorkflowResponse;

    if (
      !parsed ||
      typeof parsed.workflowName !== "string" ||
      !Array.isArray(parsed.steps)
    ) {
      return NextResponse.json(
        { error: "Invalid workflow structure from AI" },
        { status: 502 }
      );
    }

    const validIds = new Set(BLOCKS_FOR_AI.map((b) => b.id));
    const steps = parsed.steps
      .filter(
        (s): s is { blockId: string } =>
          s && typeof s.blockId === "string" && validIds.has(s.blockId)
      )
      .slice(0, 20);

    return NextResponse.json({
      workflowName: parsed.workflowName.slice(0, 200) || "Untitled Workflow",
      steps,
    });
  } catch {
    // console.error("Generate workflow error:", e);
    return NextResponse.json(
      { error: "Failed to generate workflow" },
      { status: 500 }
    );
  }
}
