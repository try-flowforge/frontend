"use client";

import { useRef } from "react";
import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { TemplateFieldSelector } from "@/blocks/configs/shared/TemplateFieldSelector";
import type { AiTransformNodeData } from "@/types/node-data";

interface AiTransformNodeConfigurationProps {
  nodeData: AiTransformNodeData & { id?: string };
  handleDataChange: (updates: Record<string, unknown>) => void;
}

export function AiTransformNodeConfiguration({
  nodeData,
  handleDataChange,
}: AiTransformNodeConfigurationProps) {
  const userPromptRef = useRef<HTMLTextAreaElement>(null);

  const insertIntoField = (
    field: "user",
    placeholder: string
  ) => {
    const ref = userPromptRef;
    const currentValue = nodeData.userPromptTemplate || "";
    const fieldKey = "userPromptTemplate";

    if (ref.current) {
      const textarea = ref.current;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newValue =
        currentValue.substring(0, start) +
        placeholder +
        currentValue.substring(end);
      handleDataChange({ [fieldKey]: newValue });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    } else {
      handleDataChange({ [fieldKey]: currentValue + placeholder });
    }
  };

  return (
    <>
      {/* Prompts Card */}
      <SimpleCard className="p-4 space-y-3">
        <Typography variant="bodySmall" className="font-semibold text-foreground">
          Prompts
        </Typography>

        {/* Template Field Selector */}
        <TemplateFieldSelector
          currentNodeId={(nodeData.id as string) || ""}
          onInsertField={(placeholder) => {
            // Always insert into the user prompt template
            insertIntoField("user", placeholder);
          }}
        />

        {/* User Prompt Template */}
        <div className="space-y-2">
          <Typography variant="caption" className="text-muted-foreground">
            User Prompt Template *
          </Typography>
          <textarea
            ref={userPromptRef}
            id="user-prompt-template"
            value={nodeData.userPromptTemplate || ""}
            onChange={(e) => handleDataChange({ userPromptTemplate: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono"
            placeholder="Use the field selector above to insert dynamic values and think about the output you want..."
            rows={5}
            required
          />
        </div>
      </SimpleCard>
    </>
  );
}
