"use client";

import { LogOut, Menu } from "lucide-react";

import { useAuth } from "@/features/auth/providers";
import { useT } from "@/i18n";
import { Button } from "@/shared/ui/Button";

type AdminHeaderProps = {
  title: string;
  onMenuClick: () => void;
};

/**
 * Admin top header with mobile menu trigger and sign-out (RFC-011).
 */
export function AdminHeader({ title, onMenuClick }: AdminHeaderProps) {
  const t = useT();
  const { user, signOut } = useAuth();

  return (
    <header className="admin-header flex items-center justify-between gap-3 px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          className="cursor-pointer rounded-md p-2 text-[var(--admin-fg-muted)] transition-colors hover:bg-[var(--admin-accent-soft)] hover:text-[var(--admin-fg)] lg:hidden"
          aria-label={t("admin.common.openNav")}
          onClick={onMenuClick}
        >
          <Menu className="size-5" aria-hidden />
        </button>
        <h1 className="truncate text-[0.9375rem] font-semibold tracking-tight text-[var(--admin-fg)] sm:text-base">
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {user?.email ? (
          <span
            className="hidden max-w-[12rem] truncate text-xs text-[var(--admin-fg-muted)] md:inline lg:max-w-[16rem]"
            title={user.email}
          >
            {user.email}
          </span>
        ) : null}
        <Button
          type="button"
          className="admin-btn-ghost admin-btn-ghost--sm"
          onClick={() => {
            void signOut();
          }}
        >
          <LogOut className="size-3.5 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{t("admin.common.signOut")}</span>
          <span className="sr-only sm:hidden">{t("admin.common.signOut")}</span>
        </Button>
      </div>
    </header>
  );
}
