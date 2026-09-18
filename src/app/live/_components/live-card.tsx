import { Eye, Radio } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  RP_AFFILIATION_BADGE_FALLBACK,
  RP_AFFILIATION_BADGE_STYLES,
} from "@/constants/rp-affiliation-badge-styles";
import { getOrderedAffiliations } from "@/features/characters/character";
import type { LiveStream } from "@/features/live/live-stream";
import {
  getDisplayName,
  MEDIA_PREVIEW_BLUR_CLASS,
  shouldBlurMediaPreview,
} from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";
import { cn } from "@/utils/cn";

interface LiveCardProps {
  stream: LiveStream;
}

const viewerCountFormatter = new Intl.NumberFormat("ko-KR");

export function LiveCard({ stream }: LiveCardProps) {
  const { broadcast, character } = stream;
  const { isMediaPreviewBlurEnabled, isRpMode } = useRpModeSettings();
  const displayName = getDisplayName(character, "live", isRpMode);
  const shouldBlurThumbnail = shouldBlurMediaPreview(isRpMode, isMediaPreviewBlurEnabled);
  const primaryAffiliation = getOrderedAffiliations(
    character.affiliations,
  )[0];
  const channelUrl = `https://chzzk.naver.com/live/${character.chzzkChannelId}`;
  const thumbnailUrl = broadcast.thumbnailUrl.replace("{type}", "480");

  return (
    <article className="group min-w-0 overflow-hidden rounded-xl border border-default bg-surface-raised transition-[background-color,border-color] duration-fast hover:border-brand dark:hover:bg-surface-selected">
      <a
        aria-label={`${displayName.primaryName} 방송 시청하기`}
        className="block h-full focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-[-2px]"
        href={channelUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        <div
          aria-label={`${broadcast.title} 방송 썸네일`}
          className="relative aspect-video overflow-hidden bg-surface-muted"
          role="img"
        >
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 bg-cover bg-center transition-[filter] duration-fast dark:group-hover:brightness-105",
              shouldBlurThumbnail && MEDIA_PREVIEW_BLUR_CLASS,
            )}
            style={{ backgroundImage: `url(${JSON.stringify(thumbnailUrl)})` }}
          />
          <div className="relative flex items-start justify-between gap-2 p-2.5">
            <Badge className="gap-1 bg-status-danger font-bold text-background">
              <Radio aria-hidden="true" className="size-3" />
              LIVE
            </Badge>
            <Badge className="gap-1 bg-black/70 text-white">
              <Eye aria-hidden="true" className="size-3.5" />
              {viewerCountFormatter.format(broadcast.concurrentUserCount)}명
            </Badge>
          </div>
        </div>

        <div className="space-y-2 p-3">
          <p className="line-clamp-2 text-body-sm font-medium text-primary">
            {broadcast.title}
          </p>

          <div className="min-w-0">
            <h2
              className={
                displayName.secondaryName
                  ? "truncate text-body font-bold text-primary"
                  : "truncate text-body-sm font-bold text-primary"
              }
            >
              {displayName.primaryName}
            </h2>
            {displayName.secondaryName ? (
              <p className="mt-0.5 truncate text-body-sm text-secondary">
                {displayName.secondaryName}
              </p>
            ) : null}
          </div>

          {primaryAffiliation ? (
            <div className="flex min-w-0 flex-wrap gap-1.5">
              <Badge
                className={cn(
                  "max-w-full truncate",
                  (
                    RP_AFFILIATION_BADGE_STYLES[primaryAffiliation.slug] ??
                    RP_AFFILIATION_BADGE_FALLBACK
                  ).surface,
                )}
              >
                {primaryAffiliation.name}
              </Badge>
              {primaryAffiliation.role ? (
                <Badge
                  className={cn(
                    "max-w-full truncate",
                    (
                      RP_AFFILIATION_BADGE_STYLES[primaryAffiliation.slug] ??
                      RP_AFFILIATION_BADGE_FALLBACK
                    ).surface,
                  )}
                >
                  {primaryAffiliation.role}
                  {primaryAffiliation.isLeader ? " ✦" : null}
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      </a>
    </article>
  );
}
