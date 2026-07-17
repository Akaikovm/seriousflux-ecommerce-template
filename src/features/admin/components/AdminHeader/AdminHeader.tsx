"use client";

import { LogOut, Menu } from "lucide-react";

import { useAuth } from "@/features/auth/providers";
import { Button } from "@/shared/ui/Button";

type AdminHeaderProps = {
  title: string;
  onMenuClick: () => void;
};

/**
 * Admin top header with mobile menu trigger and sign-out (RFC-011).
 */
export function AdminHeader({ title, onMenuClick }: AdminHeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="admin-header flex items-center justify-between gap-3 px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="cursor-pointer rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Open navigation"
          onClick={onMenuClick}
        >
          <Menu className="size-5" aria-hidden />
        </button>
        <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {user?.email ? (
          <span
            className="hidden max-w-[12rem] truncate text-sm text-muted-foreground md:inline lg:max-w-[16rem]"
            title={user.email}
          >
            {user.email}
          </span>
        ) : null}
        <Button
          type="button"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
          onClick={() => {
            void signOut();
          }}
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Sign out</span>
          <span className="sr-only sm:hidden">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
