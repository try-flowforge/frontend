"use client";

import React from "react";
import { LuLoader, LuPlus } from "react-icons/lu";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { useSlackConnection } from "@/hooks/useSlackConnection";
import { SlackAuthenticationCard } from "./SlackAuthenticationCard";
import { SlackConnectionTypeSelector } from "./SlackConnectionTypeSelector";
import { SlackWebhookForm } from "./SlackWebhookForm";
import { SlackOAuthForm } from "./SlackOAuthForm";
import { SlackConnectionItem } from "./SlackConnectionItem";
import { SlackMessageTemplate } from "./SlackMessageTemplate";
import { SlackDeleteConnectionDialog } from "./SlackDeleteConnectionDialog";
import { SlackNotificationBanner } from "./SlackNotificationBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface SlackNodeConfigurationProps {
    nodeData: Record<string, unknown>;
    /**
     * Batched data change handler - accepts multiple updates in a single object
     * to prevent UI flicker from multiple state updates
     */
    handleDataChange: (updates: Record<string, unknown>) => void;
    authenticated: boolean;
    login: () => void;
}

function SlackNodeConfigurationInner({
    nodeData,
    handleDataChange,
    authenticated,
    login,
}: SlackNodeConfigurationProps) {
    const slack = useSlackConnection({
        nodeData,
        onDataChange: handleDataChange,
        authenticated,
    });

    const hasConnection = !!nodeData.slackConnectionId;
    const connectionType = (nodeData.slackConnectionType as "webhook" | "oauth") || "webhook";

    // Show auth card if not authenticated
    if (!authenticated) {
        return <SlackAuthenticationCard onLogin={login} />;
    }

    return (
        <div className="space-y-4">
            {/* Connections Management Card */}
            <SimpleCard className="p-5">
                <div className="flex flex-col items-start justify-between gap-4">
                    <div className="space-y-1">
                        <Typography variant="h5" className="font-semibold text-foreground">
                            Slack Connections
                        </Typography>
                        <Typography variant="bodySmall" className="text-muted-foreground">
                            Manage your Slack integrations
                        </Typography>
                    </div>
                    <Button
                        type="button"
                        onClick={() => slack.actions.setShowCreateForm(!slack.showCreateForm)}
                        className="gap-1 w-full"
                    >
                        <LuPlus className="w-3 h-3" />
                        {slack.showCreateForm ? "Cancel" : "New"}
                    </Button>
                </div>

                {/* Existing Connections List */}
                {slack.loading.connections ? (
                    <div className="flex items-center justify-center py-4">
                        <LuLoader className="w-4 h-4 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">
                            Loading connections...
                        </span>
                    </div>
                ) : slack.connections.length > 0 ? (
                    <div className="space-y-2">
                        <Typography variant="caption" className="text-muted-foreground">
                            Select a connection for this block:
                        </Typography>
                        {slack.connections.map((connection) => (
                            <SlackConnectionItem
                                key={connection.id}
                                connection={connection}
                                isSelected={
                                    nodeData.slackConnectionId === connection.id ||
                                    slack.selectedConnectionId === connection.id
                                }
                                nodeData={nodeData}
                                channels={slack.channels}
                                selectedChannelId={slack.selectedChannelId}
                                loading={slack.loading}
                                notification={slack.notification}
                                onSelect={slack.actions.selectConnection}
                                onDelete={(id) => {
                                    slack.actions.setDeleteConnectionId(id);
                                    slack.actions.setShowDeleteDialog(true);
                                }}
                                onChannelChange={slack.actions.updateChannel}
                                onTestConnection={slack.actions.testOAuthConnection}
                                onReloadChannels={slack.actions.loadChannels}
                            />
                        ))}
                    </div>
                ) : !slack.showCreateForm ? (
                    <div className="text-center py-1">
                        <Typography variant="caption">
                            No connections configured yet. Click &quot;New&quot; to add one.
                        </Typography>
                    </div>
                ) : null}
            </SimpleCard>

            {/* Notification Banner - below connections when form is closed */}
            {!slack.showCreateForm && slack.notification && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <SlackNotificationBanner notification={slack.notification} />
                </div>
            )}

            {/* Create New Connection Form - separate card */}
            {slack.showCreateForm && (
                <SimpleCard className="p-5">
                    <div className="space-y-3">
                        <Typography variant="bodySmall" className="text-muted-foreground">
                            Choose connection method:
                        </Typography>

                        <SlackConnectionTypeSelector
                            connectionType={slack.connectionType}
                            onTypeChange={slack.actions.setConnectionType}
                        />

                        {/* Webhook Form */}
                        {slack.connectionType === "webhook" && (
                            <SlackWebhookForm
                                webhookUrl={slack.webhookUrl}
                                connectionName={slack.connectionName}
                                testMessage={slack.testMessage}
                                isTestSuccessful={slack.isTestSuccessful}
                                loading={slack.loading}
                                onWebhookUrlChange={slack.actions.setWebhookUrl}
                                onConnectionNameChange={slack.actions.setConnectionName}
                                onTestMessageChange={slack.actions.setTestMessage}
                                onTest={() => slack.actions.testWebhook(slack.webhookUrl, slack.testMessage)}
                                onSave={slack.actions.saveWebhook}
                                onResetTestState={slack.actions.resetTestState}
                            />
                        )}

                        {/* OAuth Form */}
                        {slack.connectionType === "oauth" && (
                            <SlackOAuthForm
                                loading={slack.loading}
                                onAuthorize={slack.actions.authorizeOAuth}
                            />
                        )}

                        {/* Notification Banner - below form */}
                        {slack.notification && (
                            <div className="pt-3 mt-3 border-t border-white/10">
                                <SlackNotificationBanner notification={slack.notification} />
                            </div>
                        )}
                    </div>
                </SimpleCard>
            )}

            {/* Message Configuration Card - Shown after connection is selected */}
            {hasConnection && (
                <SlackMessageTemplate
                    messageTemplate={slack.slackMessage}
                    connectionName={(nodeData.slackConnectionName as string) || "Unknown"}
                    connectionType={connectionType}
                    channelName={nodeData.slackChannelName as string}
                    channelId={nodeData.slackChannelId as string}
                    loading={slack.loading}
                    notification={slack.notification}
                    onMessageChange={slack.actions.updateSlackMessage}
                    onSendPreview={slack.actions.sendPreviewMessage}
                    currentNodeId={(nodeData.id as string) || ""}
                />
            )}

            {/* Delete Connection Confirmation Dialog */}
            <SlackDeleteConnectionDialog
                open={slack.showDeleteDialog}
                onOpenChange={slack.actions.setShowDeleteDialog}
                onConfirm={slack.actions.deleteConnection}
                onCancel={() => {
                    slack.actions.setShowDeleteDialog(false);
                    slack.actions.setDeleteConnectionId(null);
                }}
            />
        </div>
    );
}

/**
 * Wrapped with ErrorBoundary for isolated error handling
 * Prevents Slack configuration errors from crashing the entire sidebar
 */
export function SlackNodeConfiguration(props: SlackNodeConfigurationProps) {
    return (
        <ErrorBoundary
            fallback={(error, reset) => (
                <SimpleCard className="p-5 space-y-3">
                    <Typography variant="h5" className="font-semibold text-foreground">
                        Slack Configuration Error
                    </Typography>
                    <Typography variant="caption" className="text-destructive">
                        {error.message}
                    </Typography>
                    <Button type="button" onClick={reset} className="w-full">
                        Try Again
                    </Button>
                </SimpleCard>
            )}
        >
            <SlackNodeConfigurationInner {...props} />
        </ErrorBoundary>
    );
}
