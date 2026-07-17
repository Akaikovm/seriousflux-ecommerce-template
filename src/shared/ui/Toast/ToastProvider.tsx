"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  radius,
  shadow,
  spacing,
  typography,
  zIndex,
} from "@/shared/design/tokens";

export type ToastVariant = "success" | "error";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting?: boolean;
};

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const TOAST_DURATION_MS = 4200;
const TOAST_EXIT_MS = 220;

/**
 * Toast provider — success / error feedback without browser alerts.
 * Enter / exit motion kept CSS-only for a light, alive feel.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const remove = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    },
    [clearTimer],
  );

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((current) =>
        current.map((toast) =>
          toast.id === id ? { ...toast, exiting: true } : toast,
        ),
      );

      const exitTimer = window.setTimeout(() => {
        remove(id);
      }, TOAST_EXIT_MS);
      timersRef.current.set(id, exitTimer);
    },
    [clearTimer, remove],
  );

  const push = useCallback(
    (message: string, variant: ToastVariant) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      setToasts((current) => [...current, { id, message, variant }]);

      const lifeTimer = window.setTimeout(() => {
        dismiss(id);
      }, TOAST_DURATION_MS);
      timersRef.current.set(id, lifeTimer);
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push(message, "success"),
      error: (message) => push(message, "error"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 flex flex-col items-center gap-2 p-4 sm:items-end"
        style={{ zIndex: zIndex.toast }}
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            durationMs={TOAST_DURATION_MS}
            onDismiss={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  durationMs,
  onDismiss,
}: {
  toast: ToastItem;
  durationMs: number;
  onDismiss: () => void;
}) {
  const Icon = toast.variant === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      role="status"
      className={cn(
        "admin-toast pointer-events-auto relative w-full max-w-sm overflow-hidden border",
        toast.variant === "success" &&
          "border-border bg-card text-card-foreground",
        toast.variant === "error" &&
          "border-destructive/30 bg-card text-foreground",
        toast.exiting ? "admin-toast-exit" : "admin-toast-enter",
      )}
      style={{
        borderRadius: radius.lg,
        boxShadow: shadow.lg,
        paddingBlock: spacing.md,
        paddingInline: spacing.lg,
        fontSize: typography.fontSize.sm,
        lineHeight: typography.lineHeight.normal,
      }}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            "mt-0.5 size-4 shrink-0",
            toast.variant === "success" && "text-foreground",
            toast.variant === "error" && "text-destructive",
          )}
          aria-hidden
        />
        <p
          className={cn(
            "min-w-0 flex-1 pr-6",
            toast.variant === "error" && "text-destructive",
          )}
        >
          {toast.message}
        </p>
        <button
          type="button"
          className="absolute top-2.5 right-2.5 cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Dismiss notification"
          onClick={onDismiss}
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>

      {!toast.exiting ? (
        <span
          className="admin-toast-progress absolute inset-x-0 bottom-0 h-0.5 origin-left bg-foreground/20"
          style={{ animationDuration: `${durationMs}ms` }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}

/**
 * Access the toast API. Must be used under `ToastProvider`.
 */
export function useToast(): ToastApi {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }

  return context;
}
