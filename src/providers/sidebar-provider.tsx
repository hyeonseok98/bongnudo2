"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME } from "@/constants/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarContextValue {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isMobileOpen: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}

interface SidebarProviderProps {
  children: ReactNode;
  initialIsOpen: boolean;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

function persistSidebarOpenState(isOpen: boolean) {
  document.cookie =
    SIDEBAR_COOKIE_NAME +
    "=" +
    isOpen +
    "; path=/; max-age=" +
    SIDEBAR_COOKIE_MAX_AGE +
    "; samesite=lax";
}

export function SidebarProvider({ children, initialIsOpen }: SidebarProviderProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpenState] = useState(initialIsOpen);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function updateIsOpen(getNextIsOpen: (currentIsOpen: boolean) => boolean) {
    setIsOpenState((currentIsOpen) => {
      const nextIsOpen = getNextIsOpen(currentIsOpen);
      persistSidebarOpenState(nextIsOpen);
      return nextIsOpen;
    });
  }

  function setIsOpen(nextIsOpen: boolean) {
    updateIsOpen(() => nextIsOpen);
  }

  function toggleSidebar() {
    if (isMobile) {
      setIsMobileOpen((currentIsOpen) => !currentIsOpen);
      return;
    }

    updateIsOpen((currentIsOpen) => !currentIsOpen);
  }

  return (
    <SidebarContext.Provider
      value={{ isOpen, setIsOpen, isMobileOpen, setIsMobileOpen, isMobile, toggleSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("SidebarProvider 내부에서만 useSidebar를 사용할 수 있음.");
  }

  return context;
}
