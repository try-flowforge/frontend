"use client";

import React from "react";
import { LuLoader, LuSend, LuCircleCheck } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { FormInput } from "@/components/ui/FormInput";
import type { SlackLoadingState } from "@/types/slack";

/**
 * Validates Slack webhook URL format
 * Expected format: https://hooks.slack.com/services/T.../B.../...
 */
const isValidSlackWebhookUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty is valid (not filled yet)
    return /^https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[a-zA-Z0-9]+$/i.test(url.trim());
};

interface SlackWebhookFormProps {
    webhookUrl: string;
    connectionName: string;
    testMessage: string;
    isTestSuccessful: boolean;
    loading: SlackLoadingState;
    onWebhookUrlChange: (url: string) => void;
    onConnectionNameChange: (name: string) => void;
    onTestMessageChange: (message: string) => void;
    onTest: () => void;
    onSave: () => void;
    onResetTestState: () => void;
}

/**
 * Webhook creation form with test-before-save workflow
 * Includes URL format validation for better UX
 */
export const SlackWebhookForm = React.memo(function SlackWebhookForm({
    webhookUrl,
    connectionName,
    testMessage,
    isTestSuccessful,
    loading,
    onWebhookUrlChange,
    onConnectionNameChange,
    onTestMessageChange,
    onTest,
    onSave,
    onResetTestState,
}: SlackWebhookFormProps) {
    const isProcessing = loading.testing || loading.saving;
    const isValidUrl = isValidSlackWebhookUrl(webhookUrl);
    const hasUrl = webhookUrl.trim().length > 0;
    const canTest = hasUrl && isValidUrl && testMessage.trim() && !isProcessing;
    const canSave = hasUrl && isValidUrl && isTestSuccessful && !isProcessing;

    return (
        <>
            <div className="flex flex-col items-start justify-between">
                <Typography variant="caption" className="text-muted-foreground">
                    Create a new Slack webhook connection
                </Typography>
                {!isTestSuccessful && (
                    <Typography variant="caption" className="text-warning">
                        Test required before save
                    </Typography>
                )}
            </div>

            {/* Connection Name */}
            <FormInput
                label="Connection Name (Optional)"
                value={connectionName}
                onValueChange={onConnectionNameChange}
                placeholder="My Slack Workspace"
            />

            {/* Webhook URL */}
            <FormInput
                label="Webhook URL"
                type="url"
                value={webhookUrl}
                onValueChange={(value) => {
                    onWebhookUrlChange(value);
                    onResetTestState();
                }}
                placeholder="https://hooks.slack.com/services/..."
                error={
                    hasUrl && !isValidUrl
                        ? "Invalid Slack webhook URL format. Expected: https://hooks.slack.com/services/T.../B.../..."
                        : undefined
                }
                className="text-xs"
            />

            {/* Test Message */}
            <FormInput
                label="Test Message"
                as="textarea"
                value={testMessage}
                onValueChange={onTestMessageChange}
                placeholder="Hello from FlowForge! 🚀"
                textareaProps={{ rows: 2, className: "min-h-0 resize-none" }}
            />

            {/* Action Buttons */}
            <div className="flex gap-2">
                <Button
                    type="button"
                    onClick={onTest}
                    disabled={!canTest}
                    className="flex-1 gap-2"
                >
                    {loading.testing ? (
                        <>
                            <LuLoader className="w-4 h-4 animate-spin" />
                            Testing...
                        </>
                    ) : (
                        <>
                            <LuSend className="w-4 h-4" />
                            Test
                        </>
                    )}
                </Button>
                <Button
                    type="button"
                    onClick={onSave}
                    disabled={!canSave}
                    className="flex-1 gap-2"
                    title={!isTestSuccessful ? "Please test the webhook first" : ""}
                >
                    {loading.saving ? (
                        <>
                            <LuLoader className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <LuCircleCheck className="w-4 h-4" />
                            Save
                        </>
                    )}
                </Button>
            </div>

            {/* Help Text */}
            {!isTestSuccessful && !isProcessing && (
                <Typography variant="caption" className="text-muted-foreground">
                    💡 Click &quot;Test&quot; to verify your webhook works before saving
                </Typography>
            )}
        </>
    );
});
