"use client";

import { PanelLeft } from "lucide-react";
import Link from "next/link";

import { useSidebar } from "@/providers/sidebar-provider";

export function Header() {
  const { isOpen, isMobileOpen, isMobile, toggleSidebar } = useSidebar();
  const isExpanded = isMobile ? isMobileOpen : isOpen;

  return (
    <header className="z-header flex h-14 shrink-0 items-center border-b border-default bg-surface px-3">
      <button
        type="button"
        aria-label={isExpanded ? "사이드바 접기" : "사이드바 펼치기"}
        aria-expanded={isExpanded}
        onClick={toggleSidebar}
        className="flex size-9 cursor-pointer items-center justify-center rounded-md text-secondary transition-[background-color,color] duration-default hover:bg-surface-muted hover:text-primary motion-reduce:transition-none"
      >
        <PanelLeft aria-hidden="true" className="size-5" />
      </button>
      <Link href="/" className="ml-2 flex items-center gap-2 rounded-md text-primary">
        <span
          aria-hidden="true"
          className="flex size-7 items-center justify-center rounded-md bg-brand text-caption font-bold text-brand-foreground"
        >
          봉
        </span>
        <span className="text-body-sm font-semibold">봉누도2</span>
      </Link>
    </header>
  );
}
