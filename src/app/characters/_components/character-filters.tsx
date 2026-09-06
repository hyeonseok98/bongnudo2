"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SearchField } from "@/components/ui/search-field";
import {
  CHARACTER_AFFILIATION_CATEGORIES,
  type CharacterAffiliationCategoryFilter,
} from "@/constants/character-affiliations";
import {
  CHARACTER_GROUPS,
  FEATURED_CHARACTER_GROUP_SLUGS,
} from "@/constants/character-groups";
import type { CharacterAffiliation } from "@/features/characters/character";

const FEATURED_GROUPS = FEATURED_CHARACTER_GROUP_SLUGS.flatMap((slug) => {
  const group = CHARACTER_GROUPS.find((option) => option.slug === slug);

  return group ? [group] : [];
});
const ADDITIONAL_GROUPS = CHARACTER_GROUPS.filter(
  (group) =>
    !FEATURED_CHARACTER_GROUP_SLUGS.some(
      (featuredSlug) => featuredSlug === group.slug,
    ),
).sort((left, right) => left.name.localeCompare(right.name, "ko-KR"));

interface CharacterFiltersProps {
  query: string;
  affiliationType: CharacterAffiliationCategoryFilter;
  affiliation: string | null;
  affiliations: CharacterAffiliation[];
  selectedGroupIds: string[];
  onQueryChange: (query: string) => void;
  onAffiliationTypeChange: (
    affiliationType: CharacterAffiliationCategoryFilter,
  ) => void;
  onAffiliationChange: (affiliation: string | null) => void;
  onGroupToggle: (groupId: string) => void;
  onClearGroups: () => void;
}

export function CharacterFilters({
  query,
  affiliationType,
  affiliation,
  affiliations,
  selectedGroupIds,
  onQueryChange,
  onAffiliationTypeChange,
  onAffiliationChange,
  onGroupToggle,
  onClearGroups,
}: CharacterFiltersProps) {
  const [isGroupExpanded, setIsGroupExpanded] = useState(false);

  return (
    <section aria-label="인물 검색 및 필터" className="space-y-4">
      <SearchField
        label="이름 또는 키워드 검색"
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="이름 또는 키워드로 검색해보세요."
        value={query}
      />

      <div className="grid gap-2 md:grid-cols-[6rem_1fr] md:items-start">
        <p className="pt-2 text-body-sm font-medium text-primary">소속</p>
        <div className="flex flex-wrap gap-2">
          {CHARACTER_AFFILIATION_CATEGORIES.map((option) => (
            <Chip
              isSelected={affiliationType === option.slug}
              key={option.slug}
              onClick={() => onAffiliationTypeChange(option.slug)}
            >
              {option.name}
            </Chip>
          ))}
        </div>
      </div>

      {affiliationType !== "all" && affiliations.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-[6rem_1fr] md:items-start">
          <p className="pt-2 text-body-sm font-medium text-primary">세부 소속</p>
          <div className="flex flex-wrap gap-2">
            <Chip
              isSelected={affiliation === null}
              onClick={() => onAffiliationChange(null)}
            >
              전체
            </Chip>
            {affiliations.map((option) => (
              <Chip
                isSelected={affiliation === option.slug}
                key={option.slug}
                onClick={() => onAffiliationChange(option.slug)}
              >
                {option.name}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-2 md:grid-cols-[6rem_1fr] md:items-start">
        <p className="pt-2 text-body-sm font-medium text-primary">
          스트리머 그룹
        </p>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Chip
              isSelected={selectedGroupIds.length === 0}
              onClick={onClearGroups}
            >
              전체
            </Chip>
            {FEATURED_GROUPS.map((group) => (
              <Chip
                isSelected={selectedGroupIds.includes(group.slug)}
                key={group.slug}
                onClick={() => onGroupToggle(group.slug)}
              >
                {group.name}
              </Chip>
            ))}
            <Button
              aria-expanded={isGroupExpanded}
              className="px-2"
              onClick={() => setIsGroupExpanded((isExpanded) => !isExpanded)}
              size="sm"
              variant="ghost"
            >
              {isGroupExpanded ? "접기" : "더보기"}
              {isGroupExpanded ? (
                <ChevronUp aria-hidden="true" />
              ) : (
                <ChevronDown aria-hidden="true" />
              )}
            </Button>
          </div>

          {isGroupExpanded ? (
            <div className="flex flex-wrap gap-2">
              {ADDITIONAL_GROUPS.map((group) => (
                <Chip
                  isSelected={selectedGroupIds.includes(group.slug)}
                  key={group.slug}
                  onClick={() => onGroupToggle(group.slug)}
                >
                  {group.name}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
