"use client";

import { useEffect } from "react";
import { MdDeleteSweep } from "react-icons/md";
import { Button } from "@/components/ui/Button";

export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = "Delete Block?",
  description = "Your block will be permanently deleted and cannot be recovered.",
}: DeleteConfirmDialogProps) {
  // Handle ESC key to close
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange, onCancel]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
      onCancel();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background backdrop-blur-md"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className="relative z-50 w-full max-w-106.25 flex flex-col items-center justify-center p-6 gap-4 bg-black/95 border-white/20 border rounded-xl shadow-lg animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <MdDeleteSweep className="w-16 h-16 text-white" />

        {/* Title and Description */}
        <h2
          id="delete-dialog-title"
          className="text-xl font-semibold text-center"
        >
          {title}
        </h2>
        <p
          id="delete-dialog-description"
          className="text-base text-center max-w-[80%]"
        >
          {description}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full justify-center pt-2">
          <Button
            onClick={handleCancel}
            variant="delete"
            border
            className="flex-1 min-w-25"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="delete"
            className="flex-1 min-w-25"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
