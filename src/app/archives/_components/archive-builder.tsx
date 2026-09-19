"use client";

import { type DragEndEvent, useDragDropMonitor, useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { ArrowDown, ArrowUp, GripVertical, ListTree, Plus, Trash2, UserRound } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  getDisplayName,
  MEDIA_PREVIEW_BLUR_CLASS,
  shouldBlurMediaPreview,
} from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";
import { cn } from "@/utils/cn";

import type {
  ArchiveDraftChapter,
  ArchiveEditorDraft,
  ArchiveSeasonDay,
} from "./archive-editor-draft";
import {
  isArchiveWorkspaceDragData,
  type ArchiveWorkspaceDragData,
} from "./archive-workspace-dnd";

interface ArchiveBuilderProps {
  activeChapterId: string | null;
  draft: ArchiveEditorDraft;
  onActiveChapterChange: (chapterId: string | null) => void;
  onDraftChange: (draft: ArchiveEditorDraft) => void;
  onPreviewItem: (item: ArchiveDraftChapter["items"][number]) => void;
  seasonDays: ArchiveSeasonDay[];
}

export function ArchiveBuilder({
  activeChapterId,
  draft,
  onActiveChapterChange,
  onDraftChange,
  onPreviewItem,
  seasonDays,
}: ArchiveBuilderProps) {
  const [isFlowManagerOpen, setIsFlowManagerOpen] = useState(false);
  const isFreeform = draft.metadata.structureMode === "freeform";
  const activeChapter = draft.chapters.find((chapter) => chapter.id === activeChapterId) ?? draft.chapters[0] ?? null;

  function updateChapter(chapterId: string, update: (chapter: ArchiveDraftChapter) => ArchiveDraftChapter) {
    onDraftChange({
      ...draft,
      chapters: draft.chapters.map((chapter) => chapter.id === chapterId ? update(chapter) : chapter),
    });
  }

  function removeChapter(chapterId: string) {
    const nextChapters = draft.chapters.filter((chapter) => chapter.id !== chapterId);
    onDraftChange({ ...draft, chapters: nextChapters });

    if (activeChapter?.id === chapterId) {
      onActiveChapterChange(nextChapters[0]?.id ?? null);
    }
  }

  function addChapter() {
    const chapterId = crypto.randomUUID();
    onDraftChange({
      ...draft,
      chapters: [...draft.chapters, {
        description: null,
        id: chapterId,
        items: [],
        seasonDayId: isFreeform ? null : seasonDays[0]?.id ?? null,
        storyType: "main",
        title: "새 챕터",
      }],
    });
    onActiveChapterChange(chapterId);
  }

  function removeItem(chapterId: string, itemId: string) {
    updateChapter(chapterId, (chapter) => ({
      ...chapter,
      items: chapter.items.filter((item) => item.id !== itemId),
    }));
  }

  function moveChapter(chapterId: string, offset: -1 | 1) {
    const sourceIndex = draft.chapters.findIndex((chapter) => chapter.id === chapterId);
    const target = draft.chapters[sourceIndex + offset];

    if (sourceIndex < 0 || !target) {
      return;
    }

    onDraftChange({
      ...draft,
      chapters: moveById(draft.chapters, chapterId, target.id),
    });
  }

  function moveItem(chapterId: string, itemId: string, offset: -1 | 1) {
    updateChapter(chapterId, (chapter) => {
      const sourceIndex = chapter.items.findIndex((item) => item.id === itemId);
      const target = chapter.items[sourceIndex + offset];

      return sourceIndex < 0 || !target
        ? chapter
        : { ...chapter, items: moveById(chapter.items, itemId, target.id) };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const source = event.operation.source;
    const target = event.operation.target;

    if (event.canceled || !source || !target || source.id === target.id) {
      return;
    }

    const sourceData = source.data;
    const targetData = target.data;

    if (
      !isArchiveWorkspaceDragData(sourceData) ||
      !isArchiveWorkspaceDragData(targetData) ||
      sourceData.kind !== targetData.kind
    ) {
      return;
    }

    if (sourceData.kind === "chapter") {
      onDraftChange({
        ...draft,
        chapters: moveById(draft.chapters, String(source.id), String(target.id)),
      });
      return;
    }

    if (
      sourceData.kind === "item" &&
      sourceData.chapterId !== null &&
      sourceData.chapterId === targetData.chapterId
    ) {
      updateChapter(sourceData.chapterId, (chapter) => ({
        ...chapter,
        items: moveById(chapter.items, String(source.id), String(target.id)),
      }));
    }
  }

  useDragDropMonitor<ArchiveWorkspaceDragData>({ onDragEnd: handleDragEnd });

  return (
    <section aria-labelledby="archive-builder-heading" className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-heading-sm font-semibold text-primary" id="archive-builder-heading">
            아카이브 구성
          </h2>
          <p className="mt-1 text-body-sm text-secondary">
            {isFreeform
              ? "챕터별로 클립 순서를 자유롭게 구성할 수 있습니다."
              : "일차를 선택하고 필요한 챕터만 사이드 스토리로 구분할 수 있습니다."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button onClick={() => setIsFlowManagerOpen(true)} size="sm" type="button" variant="ghost">
            <ListTree aria-hidden="true" className="size-4" />
            전체 흐름
          </Button>
          <Button onClick={addChapter} size="sm" type="button" variant="outline">
            <Plus aria-hidden="true" className="size-4" />
            챕터 추가
          </Button>
        </div>
      </div>

      <div aria-label="챕터 목록" className="flex gap-2 overflow-x-auto pb-1" role="tablist">
          {draft.chapters.map((chapter) => (
            <ArchiveChapterTab
              active={chapter.id === activeChapter?.id}
              chapter={chapter}
              key={chapter.id}
              onSelect={() => onActiveChapterChange(chapter.id)}
            />
          ))}
        </div>

        {activeChapter ? (
          <ArchiveChapterEditor
            chapter={activeChapter}
            isFreeform={isFreeform}
            onDescriptionChange={(description) => updateChapter(activeChapter.id, (current) => ({ ...current, description }))}
            onNoteChange={(itemId, note) => updateChapter(activeChapter.id, (current) => ({
              ...current,
              items: current.items.map((item) => item.id === itemId ? { ...item, note } : item),
            }))}
            onMoveItem={(itemId, offset) => moveItem(activeChapter.id, itemId, offset)}
            onRemove={() => removeChapter(activeChapter.id)}
            onRemoveItem={(itemId) => removeItem(activeChapter.id, itemId)}
            onSeasonDayChange={(seasonDayId) => updateChapter(activeChapter.id, (current) => ({ ...current, seasonDayId }))}
            onSideStoryChange={(isSideStory) => updateChapter(activeChapter.id, (current) => ({ ...current, storyType: isSideStory ? "side" : "main" }))}
            onTitleChange={(title) => updateChapter(activeChapter.id, (current) => ({ ...current, title }))}
            onPreviewItem={onPreviewItem}
            seasonDays={seasonDays}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-default px-4 py-8 text-center text-body-sm text-secondary">
            챕터를 추가해 아카이브를 시작해주세요.
          </p>
        )}
      <ArchiveFlowManager
        activeChapterId={activeChapter?.id ?? null}
        chapters={draft.chapters}
        onOpenChange={setIsFlowManagerOpen}
        onMoveChapter={moveChapter}
        onSelect={(chapterId) => {
          onActiveChapterChange(chapterId);
          setIsFlowManagerOpen(false);
        }}
        open={isFlowManagerOpen}
        seasonDays={seasonDays}
      />
    </section>
  );
}

function ArchiveChapterTab({
  active,
  chapter,
  onSelect,
}: {
  active: boolean;
  chapter: ArchiveDraftChapter;
  onSelect: () => void;
}) {
  return (
    <button
      aria-selected={active}
      className={cn(
        "shrink-0 cursor-pointer rounded-lg border bg-background px-3 py-2 text-left text-caption font-medium text-primary transition-colors",
        active ? "border-brand bg-surface-selected" : "border-default",
      )}
      onClick={onSelect}
      role="tab"
      type="button"
    >
      {chapter.title}
    </button>
  );
}

function ArchiveChapterEditor({
  chapter,
  isFreeform,
  onDescriptionChange,
  onNoteChange,
  onMoveItem,
  onRemove,
  onRemoveItem,
  onSeasonDayChange,
  onSideStoryChange,
  onTitleChange,
  onPreviewItem,
  seasonDays,
}: {
  chapter: ArchiveDraftChapter;
  isFreeform: boolean;
  onDescriptionChange: (value: string) => void;
  onNoteChange: (itemId: string, note: string) => void;
  onMoveItem: (itemId: string, offset: -1 | 1) => void;
  onRemove: () => void;
  onRemoveItem: (itemId: string) => void;
  onSeasonDayChange: (seasonDayId: string) => void;
  onSideStoryChange: (isSideStory: boolean) => void;
  onTitleChange: (value: string) => void;
  onPreviewItem: (item: ArchiveDraftChapter["items"][number]) => void;
  seasonDays: ArchiveSeasonDay[];
}) {
  const { isDropTarget, ref: dropRef } = useDroppable<ArchiveWorkspaceDragData>({
    data: { chapterId: chapter.id, kind: "chapter-drop" },
    id: `chapter-drop:${chapter.id}`,
  });

  return (
    <article
      className={cn(
        "rounded-xl border border-default bg-surface-raised p-4 transition-colors",
        isDropTarget && "border-brand bg-surface-selected",
      )}
      ref={dropRef}
    >
      <div className="flex gap-2">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
          {isFreeform ? null : (
            <Select
              className="w-full"
              label="봉누도 일차"
              onValueChange={onSeasonDayChange}
              options={seasonDays.map((seasonDay) => ({
                label: `${seasonDay.dayNumber}일차 · ${seasonDay.sessionDate}`,
                value: seasonDay.id,
              }))}
              value={chapter.seasonDayId ?? ""}
            />
          )}
          <Input
            aria-label="챕터 제목"
            maxLength={50}
            onChange={(event) => onTitleChange(event.target.value)}
            value={chapter.title}
          />
        </div>
        <Button aria-label="챕터 삭제" onClick={onRemove} size="icon-sm" type="button" variant="ghost">
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
      </div>

      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-body-sm font-medium text-primary">
        <input
          checked={chapter.storyType === "side"}
          className="size-4 accent-brand"
          onChange={(event) => onSideStoryChange(event.target.checked)}
          type="checkbox"
        />
        사이드 스토리
      </label>

      <Textarea
        aria-label="챕터 설명"
        className="mt-3 min-h-20"
        maxLength={300}
        onChange={(event) => onDescriptionChange(event.target.value)}
        placeholder="챕터 설명을 입력해주세요."
        value={chapter.description ?? ""}
      />

      <div className="mt-4 space-y-2">
        {chapter.items.map((item, itemIndex) => (
          <ArchiveBuilderItem
            chapterId={chapter.id}
            index={itemIndex}
            item={item}
            key={item.id}
            onNoteChange={(note) => onNoteChange(item.id, note)}
            onMoveDown={() => onMoveItem(item.id, 1)}
            onMoveUp={() => onMoveItem(item.id, -1)}
            onPreview={() => onPreviewItem(item)}
            onRemove={() => onRemoveItem(item.id)}
            isFirst={itemIndex === 0}
            isLast={itemIndex === chapter.items.length - 1}
          />
        ))}
        {chapter.items.length === 0 ? (
          <p className="rounded-lg bg-surface-muted px-3 py-4 text-center text-caption text-secondary">
            클립 탐색에서 클립을 추가해주세요.
          </p>
        ) : null}
      </div>
    </article>
  );
}

function ArchiveBuilderItem({
  chapterId,
  index,
  item,
  isFirst,
  isLast,
  onMoveDown,
  onMoveUp,
  onNoteChange,
  onPreview,
  onRemove,
}: {
  chapterId: string;
  index: number;
  item: ArchiveDraftChapter["items"][number];
  isFirst: boolean;
  isLast: boolean;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onNoteChange: (value: string) => void;
  onPreview: () => void;
  onRemove: () => void;
}) {
  const { isMediaPreviewBlurEnabled, isRpMode } = useRpModeSettings();
  const { handleRef, isDragging, ref } = useSortable<ArchiveWorkspaceDragData>({
    data: { chapterId, kind: "item" },
    group: chapterId,
    id: item.id,
    index,
  });
  const displayName = item.clip.participant
    ? getDisplayName(item.clip.participant, "clip-card", isRpMode)
    : { primaryName: "인물 정보 없음", secondaryName: null };
  const shouldBlurThumbnail = shouldBlurMediaPreview(isRpMode, isMediaPreviewBlurEnabled);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-default bg-background p-3",
        isDragging && "opacity-50",
      )}
      ref={ref}
    >
      <button
        aria-label={`${item.clip.title} 미리보기 및 순서 변경`}
        className="flex min-w-0 flex-1 cursor-grab touch-none items-center gap-2 text-left active:cursor-grabbing"
        onClick={onPreview}
        ref={handleRef}
        type="button"
      >
        <GripVertical aria-hidden="true" className="size-4 shrink-0 text-tertiary" />
        {item.clip.thumbnailUrl ? (
          <span className="aspect-video w-24 shrink-0 overflow-hidden rounded bg-surface-muted">
            <span
              aria-hidden="true"
              className={cn(
                "block size-full bg-cover bg-center",
                shouldBlurThumbnail && MEDIA_PREVIEW_BLUR_CLASS,
              )}
              style={{ backgroundImage: `url(${JSON.stringify(item.clip.thumbnailUrl)})` }}
            />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-sm font-medium text-primary">{item.clip.title}</p>
          <div className="mt-1 flex items-center gap-1.5 text-caption text-secondary">
            {item.clip.participant?.profileImageUrl ? (
              <span
                aria-hidden="true"
                className="size-4 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url(${JSON.stringify(item.clip.participant.profileImageUrl)})` }}
              />
            ) : (
              <UserRound aria-hidden="true" className="size-3.5" />
            )}
            <span className="truncate">{displayName.primaryName}</span>
          </div>
        </div>
      </button>
      <div className="flex items-center gap-1">
        <Button aria-label="클립을 위로 이동" disabled={isFirst} onClick={onMoveUp} size="icon-sm" type="button" variant="ghost">
          <ArrowUp aria-hidden="true" className="size-4" />
        </Button>
        <Button aria-label="클립을 아래로 이동" disabled={isLast} onClick={onMoveDown} size="icon-sm" type="button" variant="ghost">
          <ArrowDown aria-hidden="true" className="size-4" />
        </Button>
      </div>
      <Button aria-label="클립 제거" onClick={onRemove} size="icon-sm" type="button" variant="ghost">
        <Trash2 aria-hidden="true" className="size-4" />
      </Button>
      <details className="basis-full">
        <summary className="cursor-pointer pt-1 text-caption text-secondary">추가 설명</summary>
        <Textarea
          aria-label="클립 추가 설명"
          className="mt-2 min-h-20"
          maxLength={300}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="클립에 대한 추가 설명을 남겨주세요."
          value={item.note ?? ""}
        />
      </details>
    </div>
  );
}

function ArchiveFlowManager({
  activeChapterId,
  chapters,
  onMoveChapter,
  onOpenChange,
  onSelect,
  open,
  seasonDays,
}: {
  activeChapterId: string | null;
  chapters: ArchiveDraftChapter[];
  onMoveChapter: (chapterId: string, offset: -1 | 1) => void;
  onOpenChange: (open: boolean) => void;
  onSelect: (chapterId: string) => void;
  open: boolean;
  seasonDays: ArchiveSeasonDay[];
}) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-[min(34rem,calc(100vw-2rem))] sm:max-w-xl" side="right">
        <SheetHeader className="border-b border-default pr-12">
          <SheetTitle>전체 흐름 관리</SheetTitle>
          <SheetDescription>챕터를 드래그해 순서를 바꾸거나 선택해 바로 이동할 수 있습니다.</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          {chapters.map((chapter, index) => (
            <ArchiveFlowChapterCard
              active={chapter.id === activeChapterId}
              chapter={chapter}
              index={index}
              key={chapter.id}
              isFirst={index === 0}
              isLast={index === chapters.length - 1}
              onMoveDown={() => onMoveChapter(chapter.id, 1)}
              onMoveUp={() => onMoveChapter(chapter.id, -1)}
              onSelect={() => onSelect(chapter.id)}
              seasonDay={seasonDays.find((seasonDay) => seasonDay.id === chapter.seasonDayId)}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ArchiveFlowChapterCard({
  active,
  chapter,
  index,
  isFirst,
  isLast,
  onMoveDown,
  onMoveUp,
  onSelect,
  seasonDay,
}: {
  active: boolean;
  chapter: ArchiveDraftChapter;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onSelect: () => void;
  seasonDay?: ArchiveSeasonDay;
}) {
  const { handleRef, isDragging, ref } = useSortable<ArchiveWorkspaceDragData>({
    data: { chapterId: null, kind: "chapter" },
    id: chapter.id,
    index,
  });

  return (
    <div
      className={cn(
        "flex items-center rounded-lg border bg-background p-2 transition-colors",
        active ? "border-brand bg-surface-selected" : "border-default",
        isDragging && "opacity-50",
      )}
      ref={ref}
    >
      <button
        aria-label={`${chapter.title} 순서 변경 및 선택`}
        className="flex min-w-0 flex-1 cursor-grab touch-none items-center gap-2 rounded-md p-1 text-left active:cursor-grabbing"
        onClick={onSelect}
        ref={handleRef}
        type="button"
      >
        <GripVertical aria-hidden="true" className="size-4 shrink-0 text-tertiary" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body-sm font-medium text-primary">{chapter.title}</span>
          <span className="mt-0.5 block text-caption text-secondary">
            {seasonDay ? `${seasonDay.dayNumber}일차 · ` : ""}
            {chapter.storyType === "side" ? "사이드" : "메인"}
            {` · 클립 ${chapter.items.length}개`}
          </span>
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <Button aria-label={`${chapter.title} 위로 이동`} disabled={isFirst} onClick={onMoveUp} size="icon-sm" type="button" variant="ghost">
          <ArrowUp aria-hidden="true" className="size-4" />
        </Button>
        <Button aria-label={`${chapter.title} 아래로 이동`} disabled={isLast} onClick={onMoveDown} size="icon-sm" type="button" variant="ghost">
          <ArrowDown aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function moveById<T extends { id: string }>(items: T[], sourceId: string, targetId: string): T[] {
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return items;
  }

  const nextItems = [...items];
  const [source] = nextItems.splice(sourceIndex, 1);
  nextItems.splice(targetIndex, 0, source);

  return nextItems;
}
