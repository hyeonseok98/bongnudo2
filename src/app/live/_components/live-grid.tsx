import type { LiveStream } from "@/features/live/live-stream";
import { Skeleton } from "@/components/ui/skeleton";

import { LiveCard } from "./live-card";

interface LiveGridProps {
  streams: LiveStream[];
}

export function LiveGrid({ streams }: LiveGridProps) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {streams.map((stream) => (
        <LiveCard
          key={`${stream.character.id}:${stream.broadcast.liveId}`}
          stream={stream}
        />
      ))}
    </div>
  );
}

export function LiveGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div aria-label="LIVE 목록을 불러오는 중입니다." className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" role="status">
      {Array.from({ length: count }, (_, index) => (
        <article className="overflow-hidden rounded-xl border border-default bg-surface-raised" key={index}>
          <div className="relative aspect-video">
            <Skeleton className="absolute inset-0 rounded-none" />
            <div className="flex justify-between p-2.5"><Skeleton className="h-6 w-14" /><Skeleton className="h-6 w-16" /></div>
          </div>
          <div className="space-y-2 p-3">
            <Skeleton className="h-10 w-4/5" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        </article>
      ))}
    </div>
  );
}
