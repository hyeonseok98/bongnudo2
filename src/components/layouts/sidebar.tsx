"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SIDEBAR_NAV, type SidebarNavigationItem } from "@/constants/navigation";
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

function isActiveRoute(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

function NavigationItem({ item, isOpen, isActive, onNavigate }: NavigationItemProps) {
  const Icon = item.icon;
  const itemClassName = cn(
    "flex items-center rounded-md text-body-sm",
    "transition-[background-color,color] duration-default motion-reduce:transition-none",
    isOpen ? "h-10 w-full gap-3 px-3" : "mx-auto size-10 justify-center",
    isActive ? "bg-surface-muted text-primary" : "text-secondary hover:bg-surface-muted hover:text-primary"
  );
  const content = (
    <>
      <Icon aria-hidden="true" className={cn("size-5 shrink-0", isActive && "text-brand")} />
      <span
        className={cn(
          "overflow-hidden whitespace-nowrap",
          "transition-[max-width,opacity,transform] duration-default motion-reduce:transition-none",
          isOpen ? "max-w-40 translate-x-0 opacity-100" : "max-w-0 -translate-x-1 opacity-0"
        )}
      >
        {item.label}
      </span>
    </>
  );

  if (!item.href) {
    return <div className={itemClassName}>{content}</div>;
  }

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={itemClassName}
      aria-current={isActive ? "page" : undefined}
    >
      {content}
    </Link>
  );

  if (isOpen) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function SidebarNavigation({ isOpen, onNavigate }: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="주요 메뉴" className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
      {SIDEBAR_NAV.map((group, index) => (
        <div key={group.label ?? "홈"}>
          {index > 0 ? <hr aria-hidden="true" className="mx-3 my-3 border-0 border-t border-default" /> : null}
          {group.label && isOpen ? (
            <p className="mb-1 px-3 text-body-sm font-medium text-secondary">{group.label}</p>
          ) : null}
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.label}>
                <NavigationItem
                  item={item}
                  isOpen={isOpen}
                  isActive={item.href ? isActiveRoute(pathname, item.href) : false}
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

export function Sidebar() {
  const { isOpen, isMobileOpen, isMobile, setIsMobileOpen } = useSidebar();

  return (
    <>
      <aside
        aria-label="데스크톱 사이드바"
        className={cn(
          "hidden shrink-0 overflow-hidden bg-surface",
          "transition-[width] duration-slow ease-out motion-reduce:transition-none md:flex md:flex-col",
          isOpen ? "w-56" : "w-18"
        )}
      >
        <SidebarNavigation isOpen={isOpen} />
      </aside>

      {isMobile ? (
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="w-72 border-r border-default bg-surface p-0 text-primary"
          >
            <SheetTitle className="sr-only">봉누도2 메뉴</SheetTitle>
            <aside aria-label="모바일 사이드바" className="flex h-full flex-col">
              <div className="flex h-14 items-center border-b border-default px-3">
                <span className="text-body-sm font-semibold">메뉴</span>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="ml-auto flex h-9 cursor-pointer items-center rounded-md px-3 text-body-sm text-secondary transition-[background-color,color] duration-default hover:bg-surface-muted hover:text-primary motion-reduce:transition-none"
                >
                  닫기
                </button>
              </div>
              <SidebarNavigation isOpen onNavigate={() => setIsMobileOpen(false)} />
            </aside>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}
