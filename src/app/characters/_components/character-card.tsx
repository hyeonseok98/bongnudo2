import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  RP_AFFILIATION_BADGE_FALLBACK,
  RP_AFFILIATION_BADGE_STYLES,
} from "@/constants/rp-affiliation-badge-styles";
import {
  getOrderedAffiliations,
  getOrderedStreamerAffiliations,
} from "@/features/characters/character";
import { getDisplayName } from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";
import { cn } from "@/utils/cn";

import type { CharacterDirectoryItem } from "../_utils/character-directory";
import { CharacterAvatar } from "./character-avatar";

interface CharacterCardProps {
  item: CharacterDirectoryItem;
}

export function CharacterCard({ item }: CharacterCardProps) {
  const { isRpMode } = useRpModeSettings();
  const displayName = getDisplayName(
    item,
    item.kind === "streamer" ? "streamer-card" : "character-card",
    isRpMode,
  );
  const affiliations = getOrderedAffiliations(item.affiliations);
  const visibleAffiliations = affiliations.slice(0, 2);
  const hiddenAffiliationCount =
    affiliations.length - visibleAffiliations.length;
  const streamerAffiliations = getOrderedStreamerAffiliations(
    item.streamerAffiliations,
  );

  return (
    <Link
      aria-label={`${displayName.primaryName} 상세 페이지`}
      className="group block min-w-0 cursor-pointer rounded-xl"
      href={item.href}
      prefetch={false}
    >
      <article className="relative aspect-3/4 min-w-0 overflow-hidden rounded-xl border border-default bg-surface-raised transition-[border-color,box-shadow] duration-slow group-hover:border-brand/60 group-hover:shadow-lg motion-reduce:transition-none">
        <CharacterAvatar
          className="absolute inset-0 size-full"
          imageClassName="transition-transform duration-slow group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
          name={displayName.primaryName}
          profileImageUrl={item.profileImageUrl}
          sizes="(min-width: 1536px) 16vw, (min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/90 via-black/55 to-transparent transition-colors duration-slow group-hover:from-black/95 group-hover:via-black/65 motion-reduce:transition-none"
        />

        <div className="absolute inset-x-0 bottom-0 min-w-0 p-3">
          <div className="min-w-0">
            <h3 className="truncate text-body font-semibold text-white">
              {displayName.primaryName}
            </h3>
            {displayName.secondaryName ? (
              <p className="mt-0.5 truncate text-body-sm text-white/75">
                {displayName.secondaryName}
              </p>
            ) : null}
          </div>

          {affiliations.length > 0 || streamerAffiliations.length > 0 ? (
            <div className="mt-2 min-w-0 space-y-1.5">
              {visibleAffiliations.length > 0 ? (
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {visibleAffiliations.map((affiliation) => (
                    <div
                      className="flex max-w-full flex-wrap gap-1.5"
                      key={affiliation.id}
                    >
                      <Badge
                        className={cn(
                          "max-w-full truncate",
                          (
                            RP_AFFILIATION_BADGE_STYLES[affiliation.slug] ??
                            RP_AFFILIATION_BADGE_FALLBACK
                          ).overlay,
                        )}
                      >
                        {affiliation.name}
                      </Badge>
                      {affiliation.role ? (
                        <Badge
                          className={cn(
                            "max-w-full truncate",
                            (
                              RP_AFFILIATION_BADGE_STYLES[affiliation.slug] ??
                              RP_AFFILIATION_BADGE_FALLBACK
                            ).overlay,
                          )}
                        >
                          {affiliation.role}
                          {affiliation.isLeader ? " ✦" : null}
                        </Badge>
                      ) : null}
                    </div>
                  ))}
                  {hiddenAffiliationCount > 0 ? (
                    <Badge className="bg-white/10 text-white/90">
                      +{hiddenAffiliationCount}
                    </Badge>
                  ) : null}
                </div>
              ) : null}
              {streamerAffiliations.length > 0 ? (
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {streamerAffiliations.map((affiliation) => (
                    <Badge
                      className="max-w-full truncate border-white/30 bg-black/35 text-white/90"
                      key={affiliation.id}
                      variant="outline"
                    >
                      {affiliation.name}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
