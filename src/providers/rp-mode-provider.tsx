"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import {
  LIVE_THUMBNAIL_BLUR_COOKIE_NAME,
  RP_MODE_COOKIE_MAX_AGE,
  RP_MODE_COOKIE_NAME,
  type RpModeSettings,
} from "@/features/rp-mode/rp-mode";

interface RpModeContextValue extends RpModeSettings {
  setIsRpMode: (isRpMode: boolean) => void;
  setIsLiveThumbnailBlurEnabled: (isEnabled: boolean) => void;
}

interface RpModeProviderProps {
  children: ReactNode;
  initialSettings: RpModeSettings;
}

const RpModeContext = createContext<RpModeContextValue | null>(null);

function persistBooleanCookie(name: string, value: boolean) {
  document.cookie =
    name +
    "=" +
    value +
    "; path=/; max-age=" +
    RP_MODE_COOKIE_MAX_AGE +
    "; samesite=lax";
}

export function RpModeProvider({
  children,
  initialSettings,
}: RpModeProviderProps) {
  const [isRpMode, setIsRpModeState] = useState(initialSettings.isRpMode);
  const [isLiveThumbnailBlurEnabled, setIsLiveThumbnailBlurEnabledState] =
    useState(initialSettings.isLiveThumbnailBlurEnabled);

  function setIsRpMode(nextIsRpMode: boolean) {
    setIsRpModeState(nextIsRpMode);
    persistBooleanCookie(RP_MODE_COOKIE_NAME, nextIsRpMode);
  }

  function setIsLiveThumbnailBlurEnabled(nextIsEnabled: boolean) {
    setIsLiveThumbnailBlurEnabledState(nextIsEnabled);
    persistBooleanCookie(LIVE_THUMBNAIL_BLUR_COOKIE_NAME, nextIsEnabled);
  }

  return (
    <RpModeContext.Provider
      value={{
        isRpMode,
        isLiveThumbnailBlurEnabled,
        setIsRpMode,
        setIsLiveThumbnailBlurEnabled,
      }}
    >
      {children}
    </RpModeContext.Provider>
  );
}

export function useRpModeSettings() {
  const context = useContext(RpModeContext);

  if (!context) {
    throw new Error("RpModeProvider 내부에서만 useRpModeSettings를 사용할 수 있음.");
  }

  return context;
}
