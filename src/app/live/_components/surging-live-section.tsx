import { TrendingUp } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { SURGING_LIVE_CONFIG } from "@/features/live/surging-live-config";
import type { CharacterListItem } from "@/features/characters/character";
import { buildSurgingLiveStreams } from "../_utils/live-directory";
import { useSurgingLiveBroadcasts } from "../_hooks/use-live-broadcasts";
import { SurgingLiveCard } from "./surging-live-card";

interface SurgingLiveSectionProps {
  characters: CharacterListItem[];
}

export function SurgingLiveSection({ characters }: SurgingLiveSectionProps) {
  const query = useSurgingLiveBroadcasts();

  if (query.isError) {
    return null;
  }

  const streams = buildSurgingLiveStreams(
    query.data?.broadcasts ?? [],
    characters,
  );

  if (!query.isPending && streams.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="surging-live-heading" className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <TrendingUp aria-hidden="true" className="size-5 text-brand-text" />
          <h2
            className="text-heading-sm font-semibold text-primary"
            id="surging-live-heading"
          >
            실시간 시청자 급상승
          </h2>
        </div>
        <p className="mt-1 text-body-sm text-secondary">
          최근 {SURGING_LIVE_CONFIG.recentWindowMinutes}분 동안 시청자가 빠르게 늘고 있는 방송입니다.
        </p>
      </div>

      {query.isPending ? (
        <SurgingLiveSectionSkeleton />
      ) : (
        <div className="flex snap-x gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 2xl:grid-cols-5">
          {streams.map((stream, index) => (
            <SurgingLiveCard
              key={`${stream.character.id}:${stream.broadcast.liveId}`}
              rank={index + 1}
              stream={stream}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SurgingLiveSectionSkeleton() {
  return (
    <div
      aria-label="급상승 LIVE 정보를 불러오는 중입니다."
      className="flex gap-4 overflow-hidden sm:grid sm:grid-cols-3 2xl:grid-cols-5"
      role="status"
    >
      {Array.from({ length: SURGING_LIVE_CONFIG.limit }, (_, index) => (
        <article
          className="min-w-[17rem] overflow-hidden rounded-xl border border-default bg-surface-raised sm:min-w-0"
          key={index}
        >
          <div className="relative aspect-video">
            <Skeleton className="absolute inset-0 rounded-none" />
            <div className="flex justify-between p-2.5">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
          <div className="space-y-2 p-3">
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20" />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-14" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
