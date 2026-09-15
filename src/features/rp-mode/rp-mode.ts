export const RP_MODE_COOKIE_NAME = "bongnurok-rp-mode";
export const LIVE_THUMBNAIL_BLUR_COOKIE_NAME =
  "bongnurok-live-thumbnail-blur";
export const RP_MODE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface RpModeSettings {
  isRpMode: boolean;
  isLiveThumbnailBlurEnabled: boolean;
}

export interface NamedEntity {
  streamerName: string;
  rpName: string | null;
}

export interface DisplayName {
  primaryName: string;
  secondaryName: string | null;
}

export type DisplayNameContext =
  | "streamer-card"
  | "character-card"
  | "clip-card"
  | "live"
  | "generated-text";

export const DEFAULT_RP_MODE_SETTINGS: RpModeSettings = {
  isRpMode: false,
  isLiveThumbnailBlurEnabled: false,
};

const RP_NAME_UNAVAILABLE = "RP 정보 없음";

export function getDisplayName(
  entity: NamedEntity,
  context: DisplayNameContext,
  isRpMode: boolean,
): DisplayName {
  if (context === "streamer-card") {
    return {
      primaryName: entity.streamerName,
      secondaryName: isRpMode ? null : entity.rpName,
    };
  }

  if (context === "character-card") {
    return isRpMode
      ? {
          primaryName: entity.rpName ?? RP_NAME_UNAVAILABLE,
          secondaryName: null,
        }
      : {
          primaryName: entity.rpName ?? RP_NAME_UNAVAILABLE,
          secondaryName: entity.streamerName,
        };
  }

  if (context === "live" || context === "clip-card") {
    return isRpMode
      ? {
          primaryName: entity.rpName ?? RP_NAME_UNAVAILABLE,
          secondaryName: null,
        }
      : entity.rpName
        ? {
            primaryName: entity.rpName,
            secondaryName: entity.streamerName,
          }
        : {
            primaryName: entity.streamerName,
            secondaryName: null,
          };
  }

  return {
    primaryName: isRpMode
      ? (entity.rpName ?? RP_NAME_UNAVAILABLE)
      : entity.streamerName,
    secondaryName: null,
  };
}

export function getRpModeSettings(
  rpModeCookieValue: string | undefined,
  liveThumbnailBlurCookieValue: string | undefined,
): RpModeSettings {
  return {
    isRpMode: rpModeCookieValue === "true",
    isLiveThumbnailBlurEnabled: liveThumbnailBlurCookieValue === "true",
  };
}
