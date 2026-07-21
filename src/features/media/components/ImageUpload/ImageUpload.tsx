"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";

import {
  MediaError,
  MediaService,
  MEDIA_ALLOWED_MIME_TYPES,
  MEDIA_MAX_FILE_SIZE_BYTES,
} from "@/features/media/services";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { radius, spacing, typography } from "@/shared/design/tokens";

type ImageUploadProps = {
  /** Current public image URL (persisted by the parent form). */
  value?: string;
  /** Called with the public URL after a successful MediaService upload. */
  onChange: (url: string) => void;
  /** Storage folder prefix passed to MediaService. */
  folder?: string;
  label?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
};

/**
 * Reusable image upload control (RFC-012).
 *
 * Drag & drop + click to upload. Talks only to MediaService — never Firebase Storage.
 */
export function ImageUpload({
  value = "",
  onChange,
  folder = "general",
  label,
  helperText,
  error,
  disabled = false,
}: ImageUploadProps) {
  const t = useT();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const resolvedLabel = label ?? t("media.imageLabel");
  const accept = MEDIA_ALLOWED_MIME_TYPES.join(",");
  const maxMb = MEDIA_MAX_FILE_SIZE_BYTES / (1024 * 1024);
  const displayError = error ?? uploadError;

  const uploadFile = useCallback(
    async (file: File) => {
      setUploadError(null);
      setUploading(true);
      setProgress(0);

      try {
        const result = await new MediaService().uploadImage(file, {
          folder,
          onProgress: setProgress,
        });
        onChange(result.url);
        setProgress(100);
      } catch (err) {
        if (err instanceof MediaError) {
          setUploadError(err.message);
        } else {
          setUploadError(t("media.failed"));
        }
        setProgress(null);
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange, t],
  );

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || disabled || uploading) {
      return;
    }
    const file = files.item(0);
    if (file) {
      void uploadFile(file);
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleFiles(event.target.files);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div className="flex w-full flex-col" style={{ gap: spacing.sm }}>
      {resolvedLabel ? (
        <span
          className="text-foreground"
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            lineHeight: typography.lineHeight.tight,
          }}
        >
          {resolvedLabel}
        </span>
      ) : null}

      <div
        role="button"
        tabIndex={disabled || uploading ? -1 : 0}
        aria-disabled={disabled || uploading}
        aria-describedby={displayError ? `${inputId}-error` : undefined}
        className={cn(
          "relative flex flex-col items-center justify-center border border-dashed bg-muted/40 text-center",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragOver && "border-primary bg-muted",
          (disabled || uploading) && "cursor-not-allowed opacity-60",
          !disabled && !uploading && "cursor-pointer",
          displayError && "border-destructive",
        )}
        style={{
          borderRadius: radius.lg,
          padding: spacing.xl,
          gap: spacing.sm,
          minHeight: "10rem",
        }}
        onClick={() => {
          if (!disabled && !uploading) {
            inputRef.current?.click();
          }
        }}
        onKeyDown={(event) => {
          if (
            (event.key === "Enter" || event.key === " ") &&
            !disabled &&
            !uploading
          ) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled && !uploading) {
            setDragOver(true);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled || uploading}
          onChange={onInputChange}
        />

        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote hosts vary per client
          <img
            src={value}
            alt=""
            className="mb-2 max-h-40 w-auto max-w-full object-contain"
            style={{ borderRadius: radius.md }}
          />
        ) : null}

        <p
          className="text-foreground"
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
          }}
        >
          {uploading
            ? t("media.uploadingProgress", { progress: progress ?? 0 })
            : value
              ? t("media.dropReplace")
              : t("media.dropUpload")}
        </p>
        <p
          className="text-muted-foreground"
          style={{ fontSize: typography.fontSize.xs }}
        >
          {t("media.formatsHint", { maxMb })}
        </p>

        {uploading && progress !== null ? (
          <div
            className="mt-2 h-1.5 w-full max-w-xs overflow-hidden bg-background"
            style={{ borderRadius: radius.full }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-primary"
              style={{
                width: `${progress}%`,
                borderRadius: radius.full,
              }}
            />
          </div>
        ) : null}
      </div>

      {value && !uploading ? (
        <button
          type="button"
          disabled={disabled}
          className="cursor-pointer self-start text-sm text-muted-foreground underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onChange("")}
        >
          {t("media.remove")}
        </button>
      ) : null}

      {displayError ? (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-destructive"
          style={{
            fontSize: typography.fontSize.xs,
            lineHeight: typography.lineHeight.normal,
          }}
        >
          {displayError}
        </p>
      ) : helperText ? (
        <p
          className="text-muted-foreground"
          style={{
            fontSize: typography.fontSize.xs,
            lineHeight: typography.lineHeight.normal,
          }}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
