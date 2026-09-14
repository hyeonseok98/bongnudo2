"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SIDEBAR_NAV,
  type SidebarNavigationItem,
} from "@/constants/navigation";
import { useSidebar } from "@/providers/sidebar-provider";
import { cn } from "@/utils/cn";

interface SidebarNavigationProps {
  isOpen: boolean;
  onNavigate?: () => void;
}

interface NavigationItemProps {
  item: SidebarNavigationItem;
  isOpen: boolean;
  isActive: boolean;
  onNavigate?: () => void;
}

export function Sidebar() {
  const { isOpen, isMobileOpen, isMobile, setIsMobileOpen } = useSidebar();

  return (
    <>
      <aside
        aria-label="데스크톱 사이드바"
        className={cn(
          "hidden shrink-0 overflow-hidden bg-background",
          "transition-[width] duration-slow ease-out motion-reduce:transition-none md:flex md:flex-col",
          isOpen ? "w-56" : "w-18",
        )}
      >
        <SidebarNavigation isOpen={isOpen} />
      </aside>

      {isMobile ? (
        <Sheet
          modal="trap-focus"
          open={isMobileOpen}
          onOpenChange={setIsMobileOpen}
        >
          <SheetContent
            side="left"
            showCloseButton={false}
            className="data-[side=left]:w-56 data-[side=left]:max-w-none data-[side=left]:border-r-0 data-[side=left]:pt-14 data-[side=left]:sm:max-w-none bg-background p-0 text-primary"
          >
            <SheetTitle className="sr-only">봉누도2 메뉴</SheetTitle>
            <aside
              aria-label="모바일 사이드바"
              className="flex h-full flex-col"
            >
              <SidebarNavigation
                isOpen
                onNavigate={() => setIsMobileOpen(false)}
              />
            </aside>
            <SheetClose className="sr-only">사이드바 닫기</SheetClose>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}

function SidebarNavigation({ isOpen, onNavigate }: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 메뉴"
      className="scrollbar-hidden flex min-h-0 flex-1 flex-col overflow-y-auto p-3"
    >
      {SIDEBAR_NAV.map((group, index) => (
        <div key={group.label ?? "홈"}>
          {index > 0 ? (
            <Separator className="my-3 h-px bg-border-default" />
          ) : null}
          {group.label && isOpen ? (
            <p className="mb-1 px-3 text-body-sm font-medium text-secondary">
              {group.label}
            </p>
          ) : null}
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.label}>
                <NavigationItem
                  item={item}
                  isOpen={isOpen}
                  isActive={isNavigationItemActive(pathname, item.href)}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function NavigationItem({
  item,
  isOpen,
  isActive,
  onNavigate,
}: NavigationItemProps) {
  const Icon = item.icon;

  const navigationItemClassName = cn(
    "flex items-center rounded-lg text-body-sm",
    "transition-[background-color,color] duration-default motion-reduce:transition-none",
    isOpen ? "h-10 w-full gap-3 px-3" : "mx-auto size-10 justify-center",
    item.isComingSoon ? "cursor-default text-tertiary" : "cursor-pointer",
    !item.isComingSoon &&
      (isActive
        ? "bg-surface-selected text-primary"
        : "text-secondary dark:text-[#AAAAAA] hover:bg-surface-muted hover:text-primary"),
  );

  const navigationItemContent = (
    <>
      <Icon aria-hidden="true" className="size-5 shrink-0 text-secondary" />
      <span
        className={cn(
          "overflow-hidden whitespace-nowrap text-body-sm",
          "transition-[max-width,opacity,transform] duration-default motion-reduce:transition-none",
          isOpen
            ? "max-w-40 translate-x-0 opacity-100"
            : "max-w-0 -translate-x-1 opacity-0",
        )}
      >
        <span className="inline-flex items-center gap-1">
          {item.label}
          {item.isExternal ? (
            <ExternalLink aria-hidden="true" className="size-3 shrink-0" />
          ) : null}
          {item.isComingSoon && isOpen ? (
            <span className="rounded bg-surface-muted px-1.5 py-0.5 text-caption font-semibold text-tertiary">
              준비 중
            </span>
          ) : null}
        </span>
      </span>
    </>
  );

  if (!item.href) {
    return (
      <div
        aria-disabled={item.isComingSoon || undefined}
        className={navigationItemClassName}
      >
        {navigationItemContent}
      </div>
    );
  }

  const navigationItemLink = item.isExternal ? (
    <a
      aria-label={`${item.label} (새 창에서 열림)`}
      className={navigationItemClassName}
      href={item.href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {navigationItemContent}
    </a>
  ) : (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={navigationItemClassName}
      aria-current={isActive ? "page" : undefined}
    >
      {navigationItemContent}
    </Link>
  );

  if (isOpen) {
    return navigationItemLink;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={navigationItemLink} />
      <TooltipContent className="!text-body-sm" side="right">
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

function isNavigationItemActive(pathname: string, href?: string) {
  if (!href) {
    return false;
  }

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
