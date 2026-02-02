"use client";

import React from "react";
import { LuLoader, LuLogIn } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import type { SlackLoadingState } from "@/types/slack";

interface SlackOAuthFormProps {
    loading: SlackLoadingState;
    onAuthorize: () => void;
}

/**
 * OAuth authorization form
 */
export const SlackOAuthForm = React.memo(function SlackOAuthForm({
    loading,
    onAuthorize,
}: SlackOAuthFormProps) {
    return (
        <div className="space-y-3 mt-3">
            <Typography variant="caption" className="text-muted-foreground">
                Authorize FlowForge to access your Slack workspace
            </Typography>

            <Button
                type="button"
                onClick={onAuthorize}
                disabled={loading.processing}
                className="w-full gap-2"
            >
                {loading.processing ? (
                    <>
                        <LuLoader className="w-4 h-4 animate-spin" />
                        Authorizing...
                    </>
                ) : (
                    <>
                        <LuLogIn className="w-4 h-4" />
                        Connect with Slack
                    </>
                )}
            </Button>

            <Typography variant="caption" className="text-muted-foreground">
                💡 You&apos;ll be able to select a channel after authorizing
            </Typography>
        </div>
    );
});
