"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, useState, useTransition } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import type { AuthenticatedUser } from "@/features/auth/session";
import { useSidebar } from "@/providers/sidebar-provider";

export function Header({
  currentUser,
}: {
  currentUser: AuthenticatedUser | null;
}) {
  const { isOpen, isMobileOpen, isMobile, toggleSidebar } = useSidebar();
  const router = useRouter();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isLoggingOut, startLogoutTransition] = useTransition();
  const isExpanded = isMobile ? isMobileOpen : isOpen;

  function handleLogout(): void {
    setLogoutError(null);
    startLogoutTransition(async () => {
      try {
        const response = await fetch("/api/auth/logout", { method: "POST" });

        if (response.ok) {
          router.refresh();
          return;
        }
      } catch {
        setLogoutError("로그아웃하지 못함.");
        return;
      }

      setLogoutError("로그아웃하지 못함.");
    });
  }

  function handleLogin(event: MouseEvent<HTMLAnchorElement>): void {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return (
    <header className="z-header flex h-14 shrink-0 items-center border-b border-default bg-background px-3">
      <button
        type="button"
        aria-label={isExpanded ? "사이드바 접기" : "사이드바 펼치기"}
        aria-expanded={isExpanded}
        onClick={toggleSidebar}
        className="flex size-9 cursor-pointer items-center justify-center rounded-md text-secondary transition-[background-color,color] duration-default hover:bg-surface-muted hover:text-primary motion-reduce:transition-none"
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>
      <Link
        href="/"
        className="ml-2 flex items-center gap-2 rounded-md text-primary"
      >
        {/* <span
          aria-hidden="true"
          className="flex size-7 items-center justify-center rounded-md bg-brand text-caption font-bold text-brand-foreground"
        >
          봉
        </span> */}
        <span className="text-body-lg font-semibold">봉누도2</span>
      </Link>
      <div className="ml-auto flex min-w-0 items-center gap-2">
        {logoutError ? (
          <span className="text-caption text-status-danger" role="status">
            {logoutError}
          </span>
        ) : null}
        {currentUser ? (
          <>
            <span className="max-w-24 truncate text-body-sm text-secondary sm:max-w-40">
              {currentUser.channelName}
            </span>
            <Button
              disabled={isLoggingOut}
              onClick={handleLogout}
              size="sm"
              variant="ghost"
            >
              로그아웃
            </Button>
          </>
        ) : (
          <a
            className={buttonVariants({ size: "sm" })}
            href="/login"
            onClick={handleLogin}
          >
            로그인
          </a>
        )}
      </div>
    </header>
  );
}
