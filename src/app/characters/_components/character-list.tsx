import Link from "next/link";

import {
  getOrderedAffiliations,
  getOrderedStreamerAffiliations,
} from "@/features/characters/character";
import { cn } from "@/utils/cn";

import type { CharacterDirectoryItem } from "../_utils/character-directory";
import { CharacterAvatar } from "./character-avatar";

const DESKTOP_LIST_COLUMNS =
  "grid-cols-[3rem_minmax(5rem,0.65fr)_minmax(6rem,0.9fr)_minmax(14rem,2.2fr)_minmax(6rem,0.8fr)_minmax(7rem,1fr)]";

interface CharacterListProps {
  items: CharacterDirectoryItem[];
}

export function CharacterList({ items }: CharacterListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-default bg-surface-raised">
      <div
        className={cn(
          "hidden items-center gap-4 border-b border-default bg-surface-muted px-4 py-3 text-caption font-medium text-secondary xl:grid",
          DESKTOP_LIST_COLUMNS,
        )}
      >
        <span>프로필</span>
        <span>이름</span>
        <span>RP 이름</span>
        <span>현재 소속</span>
        <span>직책</span>
        <span>현실 소속</span>
      </div>

      <ul className="divide-y divide-border-default">
        {items.map((item) => {
          const affiliations = getOrderedAffiliations(item.affiliations);
          const streamerAffiliations = getOrderedStreamerAffiliations(
            item.streamerAffiliations,
          );
          const affiliationNames = affiliations
            .map((affiliation) => affiliation.name)
            .join(", ");
          const roleNames = affiliations
            .flatMap((affiliation) =>
              affiliation.role ? [affiliation.role] : [],
            )
            .join(", ");
          const streamerAffiliationNames = streamerAffiliations
            .map((affiliation) => affiliation.name)
            .join(", ");

          return (
            <li key={`${item.kind}:${item.id}`}>
              <Link
                className="block transition-colors duration-default hover:bg-surface-muted"
                href={item.href}
                prefetch={false}
              >
                <div className="flex items-center gap-3 p-4 xl:hidden">
                  <CharacterAvatar
                    className="size-12 rounded-lg text-body"
                    name={item.primaryName}
                    profileImageUrl={item.profileImageUrl}
                    sizes="48px"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm font-semibold text-primary">
                      {item.primaryName}
                    </p>
                    {item.secondaryName ? (
                      <p className="truncate text-body-sm text-secondary">
                      {item.secondaryName}
                      </p>
                    ) : null}
                    {affiliations.length > 0 ||
                    streamerAffiliations.length > 0 ? (
                      <p className="mt-1 truncate text-caption text-tertiary">
                        {[
                          affiliationNames || null,
                          streamerAffiliationNames || null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div
                  className={cn(
                    "hidden items-center gap-4 px-4 py-3 text-body-sm xl:grid",
                    DESKTOP_LIST_COLUMNS,
                  )}
                >
                  <CharacterAvatar
                    className="size-10 rounded-lg text-body-sm"
                    name={item.primaryName}
                    profileImageUrl={item.profileImageUrl}
                    sizes="40px"
                  />
                  <span className="truncate font-medium text-primary">
                    {item.primaryName}
                  </span>
                  <span className="truncate text-secondary">
                    {item.secondaryName ?? "-"}
                  </span>
                  <span className="truncate text-secondary">
                    {affiliationNames || "-"}
                  </span>
                  <span className="truncate text-secondary">
                    {roleNames || "-"}
                  </span>
                  <span className="truncate text-secondary">
                    {streamerAffiliationNames || "-"}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
