"use client";

import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { GripVertical, Plus, Trash2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ArchiveStoryType } from "@/features/archives/archive";
import { getDisplayName } from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";
import { cn } from "@/utils/cn";

import type {
  ArchiveDraftChapter,
  ArchiveEditorDraft,
  ArchiveSeasonDay,
} from "./archive-editor-draft";

interface ArchiveBuilderProps {
  activeChapterId: string | null;
  draft: ArchiveEditorDraft;
  onActiveChapterChange: (chapterId: string | null) => void;
  onDraftChange: (draft: ArchiveEditorDraft) => void;
  seasonDays: ArchiveSeasonDay[];
}

interface ArchiveDragData {
  chapterId: string | null;
  kind: "chapter" | "item";
}

const storyTypeOptions = [
  { label: "메인 스토리", value: "main" },
  { label: "사이드 스토리", value: "side" },
] as const;

export function ArchiveBuilder({
  activeChapterId,
  draft,
  onActiveChapterChange,
  onDraftChange,
  seasonDays,
}: ArchiveBuilderProps) {
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

  function handleDragEnd(event: DragEndEvent) {
    const source = event.operation.source;
    const target = event.operation.target;

    if (event.canceled || !source || !target || source.id === target.id) {
      return;
    }

    const sourceData = source.data;
    const targetData = target.data;

    if (!isArchiveDragData(sourceData) || !isArchiveDragData(targetData) || sourceData.kind !== targetData.kind) {
      return;
    }

    if (sourceData.kind === "chapter" && isFreeform) {
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
              : "일차와 스토리를 선택해 클립을 정리할 수 있습니다."}
          </p>
        </div>
        <Button onClick={addChapter} size="sm" type="button" variant="outline">
          <Plus aria-hidden="true" className="size-4" />
          챕터 추가
        </Button>
      </div>

      <DragDropProvider<ArchiveDragData> onDragEnd={handleDragEnd}>
        <div aria-label="챕터 목록" className="flex gap-2 overflow-x-auto pb-1" role="tablist">
          {draft.chapters.map((chapter, index) => (
            <ArchiveChapterTab
              active={chapter.id === activeChapter?.id}
              chapter={chapter}
              index={index}
              isFreeform={isFreeform}
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
            onRemove={() => removeChapter(activeChapter.id)}
            onRemoveItem={(itemId) => removeItem(activeChapter.id, itemId)}
            onSeasonDayChange={(seasonDayId) => updateChapter(activeChapter.id, (current) => ({ ...current, seasonDayId }))}
            onStoryTypeChange={(storyType) => updateChapter(activeChapter.id, (current) => ({ ...current, storyType }))}
            onTitleChange={(title) => updateChapter(activeChapter.id, (current) => ({ ...current, title }))}
            seasonDays={seasonDays}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-default px-4 py-8 text-center text-body-sm text-secondary">
            챕터를 추가해 아카이브를 시작해주세요.
          </p>
        )}
      </DragDropProvider>
    </section>
  );
}

function ArchiveChapterTab({
  active,
  chapter,
  index,
  isFreeform,
  onSelect,
}: {
  active: boolean;
  chapter: ArchiveDraftChapter;
  index: number;
  isFreeform: boolean;
  onSelect: () => void;
}) {
  const { handleRef, isDragging, ref } = useSortable<ArchiveDragData>({
    data: { chapterId: null, kind: "chapter" },
    disabled: !isFreeform,
    id: chapter.id,
    index,
  });

  return (
    <div
      className={cn(
        "flex shrink-0 items-center rounded-lg border bg-background pr-1 transition-colors",
        active ? "border-brand bg-surface-selected" : "border-default",
        isDragging && "opacity-50",
      )}
      ref={ref}
    >
      {isFreeform ? (
        <button
          aria-label={`${chapter.title} 순서 변경`}
          className="cursor-grab touch-none px-1 text-tertiary hover:text-primary active:cursor-grabbing"
          ref={handleRef}
          type="button"
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </button>
      ) : null}
      <button
        aria-selected={active}
        className="cursor-pointer px-3 py-2 text-left text-caption font-medium text-primary"
        onClick={onSelect}
        role="tab"
        type="button"
      >
        <span className={chapter.storyType === "main" ? "text-brand-text" : "text-status-warning"}>
          {chapter.storyType === "main" ? "메인" : "사이드"}
        </span>
        <span className="mx-1 text-tertiary">·</span>
        <span>{chapter.title}</span>
      </button>
    </div>
  );
}

function ArchiveChapterEditor({
  chapter,
  isFreeform,
  onDescriptionChange,
  onNoteChange,
  onRemove,
  onRemoveItem,
  onSeasonDayChange,
  onStoryTypeChange,
  onTitleChange,
  seasonDays,
}: {
  chapter: ArchiveDraftChapter;
  isFreeform: boolean;
  onDescriptionChange: (value: string) => void;
  onNoteChange: (itemId: string, note: string) => void;
  onRemove: () => void;
  onRemoveItem: (itemId: string) => void;
  onSeasonDayChange: (seasonDayId: string) => void;
  onStoryTypeChange: (storyType: ArchiveStoryType) => void;
  onTitleChange: (value: string) => void;
  seasonDays: ArchiveSeasonDay[];
}) {
  return (
    <article className="rounded-xl border border-default bg-surface-raised p-4">
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

      <div className="mt-3 max-w-52">
        <Select
          className="w-full"
          label="스토리 구분"
          onValueChange={onStoryTypeChange}
          options={storyTypeOptions}
          value={chapter.storyType}
        />
      </div>

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
            onRemove={() => onRemoveItem(item.id)}
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
  onNoteChange,
  onRemove,
}: {
  chapterId: string;
  index: number;
  item: ArchiveDraftChapter["items"][number];
  onNoteChange: (value: string) => void;
  onRemove: () => void;
}) {
  const { isRpMode } = useRpModeSettings();
  const { handleRef, isDragging, ref } = useSortable<ArchiveDragData>({
    data: { chapterId, kind: "item" },
    group: chapterId,
    id: item.id,
    index,
  });
  const displayName = item.clip.participant
    ? getDisplayName(item.clip.participant, "clip-card", isRpMode)
    : { primaryName: "인물 정보 없음", secondaryName: null };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-default bg-background p-3",
        isDragging && "opacity-50",
      )}
      ref={ref}
    >
      <button
        aria-label="클립 순서 변경"
        className="cursor-grab touch-none text-tertiary hover:text-primary active:cursor-grabbing"
        ref={handleRef}
        type="button"
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>
      {item.clip.thumbnailUrl ? (
        <span
          aria-hidden="true"
          className="aspect-video w-24 shrink-0 rounded bg-surface-muted bg-cover bg-center"
          style={{ backgroundImage: `url(${JSON.stringify(item.clip.thumbnailUrl)})` }}
        />
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

function isArchiveDragData(value: unknown): value is ArchiveDragData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const chapterId = Reflect.get(value, "chapterId");
  const kind = Reflect.get(value, "kind");

  return (chapterId === null || typeof chapterId === "string") && (
    kind === "chapter" || kind === "item"
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
