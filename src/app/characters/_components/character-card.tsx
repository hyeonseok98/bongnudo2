import { Badge } from "@/components/ui/badge";
import {
  getOrderedAffiliations,
  type CharacterListItem,
} from "@/features/characters/character";

import { CharacterAvatar } from "./character-avatar";

interface CharacterCardProps {
  character: CharacterListItem;
}

export function CharacterCard({ character }: CharacterCardProps) {
  const affiliations = getOrderedAffiliations(character.affiliations);
  const visibleAffiliations = affiliations.slice(0, 3);
  const hiddenAffiliationCount =
    affiliations.length - visibleAffiliations.length;

  return (
    <article className="overflow-hidden rounded-xl border border-default bg-surface-raised">
      <CharacterAvatar
        character={character}
        className="aspect-3/4 w-full"
        sizes="(min-width: 1536px) 16vw, (min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
      />

      <div className="relative -mt-24 space-y-3 bg-linear-to-t from-surface-raised from-65% via-surface-raised/90 to-transparent px-3 pt-16 pb-3">
        <div className="min-w-0">
          <h3 className="truncate text-body font-semibold text-primary">
            {character.streamerName}
          </h3>
          {character.rpName ? (
            <p className="truncate text-body-sm text-secondary">
              {character.rpName}
            </p>
          ) : null}
        </div>

        {affiliations.length > 0 || character.group ? (
          <div className="space-y-1.5">
            {visibleAffiliations.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {visibleAffiliations.map((affiliation) => (
                  <Badge key={affiliation.id}>
                    {affiliation.name}
                    {affiliation.isLeader && affiliation.role
                      ? " · " + affiliation.role
                      : null}
                  </Badge>
                ))}
                {hiddenAffiliationCount > 0 ? (
                  <Badge>+{hiddenAffiliationCount}</Badge>
                ) : null}
              </div>
            ) : null}
            {character.group ? (
              <div>
                <Badge variant="outline">{character.group.name}</Badge>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
