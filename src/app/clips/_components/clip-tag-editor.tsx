"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Hash, Plus, X } from "lucide-react";
import { useState } from "react";

import { addClipTag, deleteClipTag } from "@/apis/clips/get-clip-tags";
import { Button } from "@/components/ui/button";
import type { ClipItem } from "@/features/clips/clip";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { clipTagQueries } from "@/queries/clip-tag-queries";
import { clipQueries } from "@/queries/clip-queries";

interface ClipTagEditorProps {
  canAddTags: boolean;
  clipId: string;
  tags: ClipItem["tags"];
}

export function ClipTagEditor({ canAddTags, clipId, tags }: ClipTagEditorProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const debouncedName = useDebouncedValue(name.trim(), 250);
  const suggestionsQuery = useQuery(clipTagQueries.search(debouncedName, []));
  const addTagMutation = useMutation({
    mutationFn: (nextName: string) => addClipTag(clipId, nextName),
    onSuccess: () => {
      setName("");
      setIsAdding(false);
      void queryClient.invalidateQueries({ queryKey: clipQueries.all() });
      void queryClient.invalidateQueries({ queryKey: clipTagQueries.all() });
    },
  });
  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) => deleteClipTag(clipId, tagId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clipQueries.all() });
      void queryClient.invalidateQueries({ queryKey: clipTagQueries.all() });
    },
  });

  function submitTag(nextName = name) {
    const trimmedName = nextName.trim();

    if (!trimmedName || addTagMutation.isPending) {
      return;
    }

    addTagMutation.mutate(trimmedName);
  }

  return (
    <div className="space-y-2 border-t border-default pt-2" onClick={(event) => event.stopPropagation()}>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-1 text-caption font-medium text-secondary"
            key={tag.id}
          >
            <Hash aria-hidden="true" className="size-3" />
            {tag.name}
            {tag.canDelete ? (
              <button
                aria-label={`${tag.name} 태그 삭제`}
                className="cursor-pointer rounded-sm text-tertiary hover:text-status-danger"
                disabled={deleteTagMutation.isPending}
                onClick={() => deleteTagMutation.mutate(tag.id)}
                type="button"
              >
                <X aria-hidden="true" className="size-3" />
              </button>
            ) : null}
          </span>
        ))}
      </div>

      {canAddTags && isAdding ? (
        <div>
          <div className="relative flex gap-1">
            <input
              aria-label="클립 태그"
              autoComplete="off"
              className="h-8 min-w-0 flex-1 rounded-md border border-default bg-background px-2 text-caption text-primary outline-none focus-visible:border-focus-ring"
              maxLength={20}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitTag();
                }
              }}
              placeholder="태그 입력"
              value={name}
            />
            <Button
              disabled={!name.trim() || addTagMutation.isPending}
              onClick={() => submitTag()}
              size="sm"
              type="button"
            >
              저장
            </Button>
            <Button
              disabled={addTagMutation.isPending}
              onClick={() => {
                setName("");
                setIsAdding(false);
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              취소
            </Button>
            {name && suggestionsQuery.data?.length ? (
              <div className="absolute top-9 z-popover max-h-40 w-full overflow-y-auto rounded-md border border-default bg-surface-raised p-1 shadow-lg">
                {suggestionsQuery.data.map((tag) => (
                  <button
                    className="block w-full cursor-pointer rounded px-2 py-1.5 text-left text-caption text-primary hover:bg-surface-muted"
                    key={tag.id}
                    onClick={() => submitTag(tag.name)}
                    type="button"
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : canAddTags ? (
        <button
          className="inline-flex cursor-pointer items-center gap-1 text-caption font-medium text-secondary hover:text-primary"
          onClick={() => setIsAdding(true)}
          type="button"
        >
          <Plus aria-hidden="true" className="size-3.5" />
          태그 추가
        </button>
      ) : null}

      {addTagMutation.isError ? (
        <p className="text-caption text-status-danger" role="alert">
          {addTagMutation.error.message}
        </p>
      ) : null}
      {deleteTagMutation.isError ? (
        <p className="text-caption text-status-danger" role="alert">
          {deleteTagMutation.error.message}
        </p>
      ) : null}
    </div>
  );
}
