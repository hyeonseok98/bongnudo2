"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Hash, X } from "lucide-react";
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

export function ClipTagEditor({
  canAddTags,
  clipId,
  tags,
}: ClipTagEditorProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const debouncedName = useDebouncedValue(name.trim(), 250);
  const suggestionsQuery = useQuery(clipTagQueries.search(debouncedName, []));
  const addTagMutation = useMutation({
    mutationFn: (nextName: string) => addClipTag(clipId, nextName),
    onSuccess: () => {
      setName("");
      setIsOpen(false);
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
    <DialogPrimitive.Root onOpenChange={setIsOpen} open={isOpen}>
      <button
        className="flex h-9 w-full cursor-pointer items-center rounded-md px-2.5 text-left text-body-sm text-secondary hover:bg-surface-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-focus-ring"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        태그 추가
      </button>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-modal bg-black/60" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-modal w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-default bg-surface-raised p-5 shadow-2xl outline-none">
          <DialogPrimitive.Title className="text-heading-sm font-semibold text-primary">
            태그 추가
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1 text-body-sm text-secondary">
            이 클립에 연결할 태그를 선택하거나 새로 입력하세요.
          </DialogPrimitive.Description>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <p className="text-body-sm font-medium text-primary">기존 태그</p>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
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
                          className="cursor-pointer rounded-sm text-tertiary hover:text-status-danger focus-visible:outline-2 focus-visible:outline-focus-ring"
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
              ) : <p className="text-body-sm text-secondary">아직 등록된 태그가 없습니다.</p>}
            </div>

            <div className="space-y-2">
              <label className="text-body-sm font-medium text-primary" htmlFor={`clip-tag-${clipId}`}>
                태그 검색/선택
              </label>
              <div className="relative">
                <input
                  autoComplete="off"
                  className="h-10 w-full rounded-lg border border-default bg-background px-3 text-body-sm text-primary outline-none focus-visible:border-focus-ring"
                  id={`clip-tag-${clipId}`}
                  maxLength={20}
                  onChange={(event) => setName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitTag();
                    }
                  }}
                  placeholder="태그를 입력하세요"
                  value={name}
                />
                {name && suggestionsQuery.data?.length ? (
                  <div className="absolute top-11 z-popover max-h-40 w-full overflow-y-auto rounded-lg border border-default bg-surface-raised p-1 shadow-lg">
                    {suggestionsQuery.data.map((tag) => (
                      <button
                        className="block w-full cursor-pointer rounded-md px-2.5 py-2 text-left text-body-sm text-primary hover:bg-surface-muted focus-visible:bg-surface-muted"
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
            {addTagMutation.isError ? <p className="text-caption text-status-danger" role="alert">{addTagMutation.error.message}</p> : null}
            {deleteTagMutation.isError ? <p className="text-caption text-status-danger" role="alert">{deleteTagMutation.error.message}</p> : null}
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-default pt-4">
            <Button
              disabled={addTagMutation.isPending}
              onClick={() => {
                setName("");
                setIsOpen(false);
              }}
              type="button"
              variant="outline"
            >
              취소
            </Button>
            <Button disabled={!canAddTags || !name.trim() || addTagMutation.isPending} onClick={() => submitTag()} type="button">
              저장
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
