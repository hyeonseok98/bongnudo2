"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { clipTagQueries } from "@/queries/clip-tag-queries";
import { cn } from "@/utils/cn";

interface TagFilterProps {
  className?: string;
  onValueChange: (tagIds: string[]) => void;
  value: string[];
}

export function TagFilter({ className, onValueChange, value }: TagFilterProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const tagQuery = useQuery(clipTagQueries.search(debouncedQuery, []));

  function handleSelect(tagId: string) {
    if (!value.includes(tagId)) {
      onValueChange([...value, tagId]);
    }
    setQuery("");
  }

  return (
    <div className={cn("relative min-w-44", className)}>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tertiary"
        />
        <input
          aria-label="태그 필터 검색"
          className="h-10 w-full cursor-text rounded-lg border border-default bg-background pr-9 pl-9 text-body-sm font-medium text-primary outline-none transition-[background-color,border-color] duration-default placeholder:text-tertiary hover:bg-surface-muted focus-visible:border-focus-ring"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="태그 검색"
          value={query}
        />
        {query ? (
          <button
            aria-label="태그 검색어 지우기"
            className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-tertiary hover:bg-surface-muted hover:text-primary"
            onClick={() => setQuery("")}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>
      {query && (tagQuery.isPending || tagQuery.data) ? (
        <div className="absolute z-popover mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-default bg-surface-raised p-1 shadow-xl sm:w-72">
          {tagQuery.isPending ? (
            <p className="px-2.5 py-2 text-caption text-secondary">태그를 검색하는 중입니다.</p>
          ) : tagQuery.data?.length ? (
            tagQuery.data.map((tag) => (
              <button
                className="flex w-full cursor-pointer items-center rounded-md px-2.5 py-2 text-left text-body-sm font-medium text-primary transition-colors hover:bg-surface-muted"
                key={tag.id}
                onClick={() => handleSelect(tag.id)}
                type="button"
              >
                #{tag.name}
              </button>
            ))
          ) : (
            <p className="px-2.5 py-2 text-caption text-secondary">검색 결과가 없습니다.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
