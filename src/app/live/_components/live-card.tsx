import { Eye, Radio } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  RP_AFFILIATION_BADGE_FALLBACK,
  RP_AFFILIATION_BADGE_STYLES,
} from "@/constants/rp-affiliation-badge-styles";
import { getOrderedAffiliations } from "@/features/characters/character";
import type { LiveStream } from "@/features/live/live-stream";
import { cn } from "@/utils/cn";

interface LiveCardProps {
  stream: LiveStream;
}

const viewerCountFormatter = new Intl.NumberFormat("ko-KR");

export function LiveCard({ stream }: LiveCardProps) {
  const { broadcast, character } = stream;
  const primaryAffiliation = getOrderedAffiliations(
    character.affiliations,
  )[0];
  const channelUrl = `https://chzzk.naver.com/live/${character.chzzkChannelId}`;
  const thumbnailUrl = broadcast.thumbnailUrl.replace("{type}", "480");

  return (
    <article className="group min-w-0 overflow-hidden rounded-xl border border-default bg-surface-raised transition-[background-color,border-color] duration-fast hover:border-brand dark:hover:bg-surface-selected">
      <a
        aria-label={`${character.rpName ?? character.streamerName} 방송 시청하기`}
        className="block h-full focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-[-2px]"
        href={channelUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        <div
          aria-label={`${broadcast.title} 방송 썸네일`}
          className="relative aspect-video bg-surface-muted bg-cover bg-center transition-[filter] duration-fast dark:group-hover:brightness-105"
          role="img"
          style={{ backgroundImage: `url(${JSON.stringify(thumbnailUrl)})` }}
        >
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
            <Badge className="gap-1 bg-status-danger font-bold text-white">
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
            {character.rpName ? (
              <>
                <h2 className="truncate text-body font-bold text-primary">
                  {character.rpName}
                </h2>
                <p className="mt-0.5 truncate text-body-sm text-secondary">
                  {character.streamerName}
                </p>
              </>
            ) : (
              <h2 className="truncate text-body-sm font-bold text-primary">
                {character.streamerName}
              </h2>
            )}
          </div>

          {primaryAffiliation ? (
            <div className="flex min-w-0 flex-wrap gap-1.5">
              <Badge
                className={cn(
                  "max-w-full truncate",
                  RP_AFFILIATION_BADGE_STYLES[primaryAffiliation.slug] ??
                    RP_AFFILIATION_BADGE_FALLBACK,
                )}
              >
                {primaryAffiliation.name}
              </Badge>
              {primaryAffiliation.role ? (
                <Badge
                  className={cn(
                    "max-w-full truncate",
                    RP_AFFILIATION_BADGE_STYLES[primaryAffiliation.slug] ??
                      RP_AFFILIATION_BADGE_FALLBACK,
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
