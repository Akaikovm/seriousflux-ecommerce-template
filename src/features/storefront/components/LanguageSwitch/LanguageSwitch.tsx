"use client";

import { useRouter } from "next/navigation";

import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  useI18n,
  type AppLanguage,
} from "@/i18n";
import { writeLanguageCookie } from "@/i18n/language-cookie";
import { cn } from "@/lib/utils";
import { radius, transition } from "@/shared/design/tokens";

/**
 * Compact ES | EN control. Visible only when Admin enables language switching.
 * Sets `sf_lang` cookie and refreshes so the server reloads the dictionary.
 */
export function LanguageSwitch() {
  const { language, t } = useI18n();
  const router = useRouter();

  function select(next: AppLanguage) {
    if (next === language) {
      return;
    }
    writeLanguageCookie(next);
    router.refresh();
  }

  return (
    <div
      role="group"
      aria-label={t("nav.language")}
      className="inline-flex items-center gap-0.5 text-xs font-medium tracking-wide text-muted-foreground"
    >
      {SUPPORTED_LANGUAGES.map((code, index) => {
        const active = code === language;
        return (
          <span key={code} className="inline-flex items-center gap-0.5">
            {index > 0 ? (
              <span className="px-0.5 text-border" aria-hidden>
                |
              </span>
            ) : null}
            <button
              type="button"
              aria-pressed={active}
              aria-label={LANGUAGE_LABELS[code]}
              title={LANGUAGE_LABELS[code]}
              onClick={() => select(code)}
              className={cn(
                "px-1.5 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "text-foreground"
                  : "hover:text-foreground",
              )}
              style={{
                borderRadius: radius.sm,
                transitionDuration: transition.fast,
              }}
            >
              {code.toUpperCase()}
            </button>
          </span>
        );
      })}
    </div>
  );
}
