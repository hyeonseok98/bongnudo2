import type { LiveStream } from "@/features/live/live-stream";

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
