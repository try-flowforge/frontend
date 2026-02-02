"use client";

import React from "react";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";

interface SlackDeleteConnectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Confirmation dialog for deleting Slack connections
 */
export const SlackDeleteConnectionDialog = React.memo(function SlackDeleteConnectionDialog({
    open,
    onOpenChange,
    onConfirm,
    onCancel,
}: SlackDeleteConnectionDialogProps) {
    return (
        <DeleteConfirmDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
            onCancel={onCancel}
            title="Delete Webhook Connection?"
            description="Are you sure you want to delete this webhook connection? This action cannot be undone."
        />
    );
});
