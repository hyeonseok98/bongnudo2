import { Badge } from "@/components/ui/badge";
import {
  RP_AFFILIATION_BADGE_FALLBACK,
  RP_AFFILIATION_BADGE_STYLES,
} from "@/constants/rp-affiliation-badge-styles";
import {
  getOrderedAffiliations,
  getOrderedStreamerAffiliations,
  type CharacterListItem,
} from "@/features/characters/character";
import { cn } from "@/utils/cn";

import { CharacterAvatar } from "./character-avatar";

interface CharacterCardProps {
  character: CharacterListItem;
}

export function CharacterCard({ character }: CharacterCardProps) {
  const affiliations = getOrderedAffiliations(character.affiliations);
  const visibleAffiliations = affiliations.slice(0, 2);
  const hiddenAffiliationCount =
    affiliations.length - visibleAffiliations.length;
  const streamerAffiliations = getOrderedStreamerAffiliations(
    character.streamerAffiliations,
  );

  return (
    <article className="relative aspect-3/4 min-w-0 overflow-hidden rounded-xl border border-default bg-surface-raised">
      <CharacterAvatar
        character={character}
        className="absolute inset-0 size-full"
        sizes="(min-width: 1536px) 16vw, (min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/90 via-black/55 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 min-w-0 p-3">
        <div className="min-w-0">
          <h3 className="truncate text-body font-semibold text-white">
            {character.streamerName}
          </h3>
          {character.rpName ? (
            <p className="mt-0.5 truncate text-body-sm text-white/75">
              {character.rpName}
            </p>
          ) : null}
        </div>

        {affiliations.length > 0 || streamerAffiliations.length > 0 ? (
          <div className="mt-2 min-w-0 space-y-1.5">
            {visibleAffiliations.length > 0 ? (
              <div className="flex min-w-0 flex-wrap gap-1.5">
                {visibleAffiliations.map((affiliation) => (
                  <Badge
                    className={cn(
                      "max-w-full truncate",
                      RP_AFFILIATION_BADGE_STYLES[affiliation.slug] ??
                        RP_AFFILIATION_BADGE_FALLBACK,
                    )}
                    key={affiliation.id}
                  >
                    {affiliation.name}
                    {affiliation.role ? " · " + affiliation.role : null}
                  </Badge>
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
  );
}
