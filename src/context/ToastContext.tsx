"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LuX, LuCircleCheck, LuCircleX, LuInfo, LuTriangleAlert } from "react-icons/lu";

// Toast types
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
    // Convenience methods
    success: (title: string, message?: string, duration?: number) => void;
    error: (title: string, message?: string, duration?: number) => void;
    warning: (title: string, message?: string, duration?: number) => void;
    info: (title: string, message?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
};

// Toast configuration by type
const toastConfig: Record<ToastType, { icon: React.ReactNode; colors: string }> = {
    success: {
        icon: <LuCircleCheck className="w-5 h-5" />,
        colors: "bg-white/5 border-white/10 text-green-400",
    },
    error: {
        icon: <LuCircleX className="w-5 h-5" />,
        colors: "bg-white/5 border-white/10 text-red-400",
    },
    warning: {
        icon: <LuTriangleAlert className="w-5 h-5" />,
        colors: "bg-white/5 border-white/10 text-yellow-400",
    },
    info: {
        icon: <LuInfo className="w-5 h-5" />,
        colors: "bg-white/5 border-white/10 text-blue-400",
    },
};

// Progress bar color mapping for each toast type
const progressColors: Record<ToastType, string> = {
    success: "bg-green-400",
    error: "bg-red-400",
    warning: "bg-yellow-400",
    info: "bg-blue-400",
};

// Individual Toast Component - All data consolidated
const ToastItem: React.FC<{
    toast: Toast;
    onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
    const config = toastConfig[toast.type];
    const duration = toast.duration ?? 5000;
    const showProgress = duration > 0;

    // Auto-dismiss timer
    React.useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onRemove(toast.id);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [toast.id, duration, onRemove]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`
                relative overflow-hidden
                rounded-xl border backdrop-blur-xl shadow-2xl
                min-w-[320px] max-w-[420px]
                bg-black/90 border-white/10
            `}
        >
            {/* Toast Content Container */}
            <div className="flex items-start gap-3 p-4 pr-10">
                {/* Icon with type-specific color */}
                <div className={`shrink-0 mt-0.5 ${config.colors.split(' ').pop()}`}>
                    {config.icon}
                </div>

                {/* Title and Message */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white leading-tight">
                        {toast.title}
                    </p>
                    {toast.message && (
                        <p className="mt-1 text-sm text-white/60 leading-relaxed">
                            {toast.message}
                        </p>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={() => onRemove(toast.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200"
                    aria-label="Dismiss notification"
                >
                    <LuX className="w-4 h-4" />
                </button>
            </div>

            {/* Progress Bar - Color matches toast type */}
            {showProgress && (
                <div className="h-1 w-full bg-white/5">
                    <motion.div
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: duration / 1000, ease: "linear" }}
                        className={`h-full ${progressColors[toast.type]}`}
                    />
                </div>
            )}
        </motion.div>
    );
};

// Toast Container Component
const ToastContainer: React.FC<{
    toasts: Toast[];
    removeToast: (id: string) => void;
}> = ({ toasts, removeToast }) => {
    return (
        <div
            className="fixed top-4 right-4 z-9999 flex flex-col gap-3 pointer-events-none"
            aria-live="polite"
            aria-atomic="true"
        >
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastItem toast={toast} onRemove={removeToast} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// Toast Provider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((toast: Omit<Toast, "id">) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: Toast = { ...toast, id };

        setToasts((prev) => {
            // Limit to 5 toasts at a time
            const updated = [...prev, newToast];
            if (updated.length > 5) {
                return updated.slice(-5);
            }
            return updated;
        });
    }, []);

    // Convenience methods
    const success = useCallback(
        (title: string, message?: string, duration?: number) => {
            addToast({ type: "success", title, message, duration });
        },
        [addToast]
    );

    const error = useCallback(
        (title: string, message?: string, duration?: number) => {
            addToast({ type: "error", title, message, duration });
        },
        [addToast]
    );

    const warning = useCallback(
        (title: string, message?: string, duration?: number) => {
            addToast({ type: "warning", title, message, duration });
        },
        [addToast]
    );

    const info = useCallback(
        (title: string, message?: string, duration?: number) => {
            addToast({ type: "info", title, message, duration });
        },
        [addToast]
    );

    const value = useMemo(
        () => ({
            toasts,
            addToast,
            removeToast,
            success,
            error,
            warning,
            info,
        }),
        [toasts, addToast, removeToast, success, error, warning, info]
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

export default ToastContext;
