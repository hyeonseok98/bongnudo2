"use client";

import { Popover } from "@base-ui/react/popover";
import {
  ChevronDown,
  FolderArchive,
  LogOut,
  Menu,
  Moon,
  SlidersHorizontal,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import type { AuthenticatedUser } from "@/features/auth/session";
import { useRpModeSettings } from "@/providers/rp-mode-provider";
import { useSidebar } from "@/providers/sidebar-provider";

export function Header({
  currentUser,
}: {
  currentUser: AuthenticatedUser | null;
}) {
  const { isOpen, isMobileOpen, isMobile, toggleSidebar } = useSidebar();
  const {
    isLiveThumbnailBlurEnabled,
    isRpMode,
    setIsLiveThumbnailBlurEnabled,
    setIsRpMode,
  } = useRpModeSettings();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isLoggingOut, startLogoutTransition] = useTransition();
  const themeTransitionTimeoutRef = useRef<number | null>(null);
  const isExpanded = isMobile ? isMobileOpen : isOpen;
  const isDarkMode = resolvedTheme !== "light";
  const headerStyle = {
    "--header-sidebar-width": isOpen ? "14rem" : "4.5rem",
  } as CSSProperties;

  useEffect(() => {
    return () => {
      if (themeTransitionTimeoutRef.current !== null) {
        window.clearTimeout(themeTransitionTimeoutRef.current);
      }

      document.documentElement.classList.remove("theme-transition");
    };
  }, []);

  function handleLogout(): void {
    setLogoutError(null);
    startLogoutTransition(async () => {
      try {
        const response = await fetch("/api/auth/logout", { method: "POST" });

        if (!response.ok) {
          setLogoutError("서버 세션 정리가 지연되고 있습니다.");
        }
      } catch {
        setLogoutError("로그아웃하지 못함.");
      } finally {
        router.refresh();
      }
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

  function handleThemeToggle(): void {
    const rootElement = document.documentElement;

    rootElement.classList.add("theme-transition");

    if (themeTransitionTimeoutRef.current !== null) {
      window.clearTimeout(themeTransitionTimeoutRef.current);
    }

    setTheme(isDarkMode ? "light" : "dark");
    themeTransitionTimeoutRef.current = window.setTimeout(() => {
      rootElement.classList.remove("theme-transition");
      themeTransitionTimeoutRef.current = null;
    }, 250);
  }

  return (
    <header
      className="z-header flex h-14 shrink-0 items-center border-b border-default bg-background px-3"
      style={headerStyle}
    >
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
        className="ml-1 flex items-center gap-2 rounded-md text-primary"
      >
        <Image
          alt="BONGNUROK"
          className="h-8 w-auto"
          height={250}
          priority
          src="/logo/bongnurok_logo.png"
          width={656}
        />
      </Link>
      <div
        className="header-account-menu ml-auto flex min-w-0 items-center gap-2"
        data-slot="header-account-menu"
      >
        <Popover.Root>
          <Popover.Trigger className="flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-default px-2 text-body-sm font-semibold text-primary transition-[background-color,border-color] duration-default hover:border-brand/45 hover:bg-surface-muted focus-visible:border-focus-ring motion-reduce:transition-none">
            <SlidersHorizontal
              aria-hidden="true"
              className="size-4 text-brand-text"
            />
            <span className="hidden sm:inline">
              RP 모드 {isRpMode ? "ON" : "OFF"}
            </span>
            <span className="sr-only">RP 모드 설정</span>
            <ChevronDown aria-hidden="true" className="size-4 text-secondary" />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner
              align="end"
              className="z-popover"
              collisionPadding={12}
              side="bottom"
              sideOffset={8}
            >
              <Popover.Popup className="w-64 rounded-lg border border-default bg-surface-raised p-3 shadow-lg outline-none">
                <Popover.Title className="text-body-sm font-semibold text-primary">
                  RP 모드 설정
                </Popover.Title>
                <p className="mt-1 text-caption text-secondary">
                  표시 이름과 LIVE 썸네일을 설정합니다.
                </p>
                <div className="mt-3 space-y-2">
                  <RpModeSettingButton
                    description="RP 이름을 중심으로 표시합니다."
                    isEnabled={isRpMode}
                    label="RP 모드"
                    onClick={() => setIsRpMode(!isRpMode)}
                  />
                  <RpModeSettingButton
                    description={
                      isRpMode
                        ? "LIVE 썸네일을 흐리게 표시합니다."
                        : "RP 모드가 켜져 있을 때 적용됩니다."
                    }
                    isEnabled={isLiveThumbnailBlurEnabled}
                    label="LIVE 썸네일 흐리기"
                    onClick={() =>
                      setIsLiveThumbnailBlurEnabled(
                        !isLiveThumbnailBlurEnabled,
                      )
                    }
                  />
                </div>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
        <Button
          aria-label={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
          aria-pressed={isDarkMode}
          onClick={handleThemeToggle}
          size="icon-sm"
          title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
          variant="ghost"
        >
          {isDarkMode ? (
            <Sun aria-hidden="true" />
          ) : (
            <Moon aria-hidden="true" />
          )}
        </Button>
        {logoutError ? (
          <span className="text-caption text-status-danger" role="status">
            {logoutError}
          </span>
        ) : null}
        {currentUser ? (
          <Popover.Root>
            <Popover.Trigger
              aria-label={`${currentUser.channelName} 계정 메뉴`}
              className="flex h-10 min-w-0 cursor-pointer items-center gap-1 rounded-lg border border-transparent px-2 text-primary transition-[background-color,border-color] duration-default hover:border-default hover:bg-surface-muted focus-visible:border-focus-ring motion-reduce:transition-none"
            >
              <span className="max-w-24 truncate text-body-sm font-medium sm:max-w-40">
                {currentUser.channelName}
              </span>
              <ChevronDown
                aria-hidden="true"
                className="size-4 shrink-0 text-secondary"
              />
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner
                align="end"
                className="z-popover"
                collisionPadding={12}
                side="bottom"
                sideOffset={8}
              >
                <Popover.Popup className="w-44 rounded-lg border border-default bg-surface-raised p-1 shadow-lg outline-none">
                  <Popover.Title className="sr-only">계정 메뉴</Popover.Title>
                  <Link
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-body-sm font-medium text-primary transition-colors hover:bg-surface-muted"
                    href="/my/archives"
                  >
                    <FolderArchive aria-hidden="true" className="size-4" />
                    내 아카이브
                  </Link>
                  <Button
                    className="w-full justify-start text-status-danger hover:text-status-danger"
                    disabled={isLoggingOut}
                    onClick={handleLogout}
                    size="sm"
                    variant="ghost"
                  >
                    <LogOut aria-hidden="true" />
                    {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
                  </Button>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
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

function RpModeSettingButton({
  description,
  isEnabled,
  label,
  onClick,
}: {
  description: string;
  isEnabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={isEnabled}
      className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-default bg-background/50 px-3 py-2.5 text-left transition-[background-color,border-color] duration-default hover:border-brand/45 hover:bg-brand/5 focus-visible:border-focus-ring"
      type="button"
      onClick={onClick}
    >
      <span>
        <span className="block text-body-sm font-medium text-primary">
          {label}
        </span>
        <span className="mt-0.5 block text-caption text-secondary">
          {description}
        </span>
      </span>
      <span
        className={`rounded-md px-2 py-1 text-caption font-semibold ${
          isEnabled
            ? "bg-brand/15 text-brand-text"
            : "bg-surface-muted text-secondary"
        }`}
      >
        {isEnabled ? "ON" : "OFF"}
      </span>
    </button>
  );
}
