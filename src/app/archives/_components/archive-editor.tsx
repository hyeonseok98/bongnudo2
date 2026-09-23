"use client";

import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { AlertTriangle, Check, LogIn, LogOut, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, buttonVariants } from "@/components/ui/button";
import { RetryButton } from "@/components/ui/retry-button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ArchiveClipSummary, ArchiveDetail } from "@/features/archives/archive";
import { archiveMutations, archiveQueries } from "@/queries/archive-queries";

import { ArchiveBuilder } from "./archive-builder";
import { ArchiveClipExplorer } from "./archive-clip-explorer";
import { ArchiveClipPreviewDialog } from "./archive-clip-preview-dialog";
import {
  createArchiveDraft,
  isArchiveDraftEqual,
  toArchiveContentInput,
  toArchiveMetadataInput,
  type ArchiveEditorDraft,
} from "./archive-editor-draft";
import { ArchiveSettingsDialog } from "./archive-settings-dialog";
import {
  isArchiveWorkspaceDragData,
  type ArchiveWorkspaceDragData,
} from "./archive-workspace-dnd";

interface ArchiveEditorProps {
  archiveId: string;
  isSignedIn: boolean;
}

export function ArchiveEditor({ archiveId, isSignedIn }: ArchiveEditorProps) {
  const archiveQuery = useQuery(archiveQueries.detail(archiveId));

  if (!isSignedIn) {
    return <ArchiveLoginRequired archiveId={archiveId} />;
  }

  if (archiveQuery.isPending) {
    return <ArchiveEditorSkeleton />;
  }

  if (archiveQuery.isError || !archiveQuery.data) {
    return <ArchiveEditorNotice onRetry={() => void archiveQuery.refetch()}>아카이브를 불러오지 못했습니다.</ArchiveEditorNotice>;
  }

  if (!archiveQuery.data.canEditContent) {
    return <ArchiveEditorNotice>이 아카이브를 편집할 권한이 없습니다.</ArchiveEditorNotice>;
  }

  if (archiveQuery.data.archiveKind !== "user" || archiveQuery.data.structureMode === null) {
    return <ArchiveEditorNotice>인물별 전체 클립은 편집할 수 없습니다.</ArchiveEditorNotice>;
  }

  return <ArchiveEditorWorkspace archive={archiveQuery.data} />;
}

function ArchiveEditorWorkspace({ archive }: { archive: ArchiveDetail }) {
  const router = useRouter();
  const optionsQuery = useQuery(archiveQueries.editorOptions());
  const saveMutation = useMutation(archiveMutations.save());
  const queryClient = useQueryClient();
  const initialDraft = createArchiveDraft(archive);
  const [draft, setDraft] = useState<ArchiveEditorDraft>(initialDraft);
  const [savedDraft, setSavedDraft] = useState<ArchiveEditorDraft>(initialDraft);
  const [currentRevision, setCurrentRevision] = useState(archive.currentRevision ?? 1);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(archive.chapters[0]?.id ?? null);
  const [previewItem, setPreviewItem] = useState<{
    clip: ArchiveClipSummary;
    note: string | null;
  } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConflictOpen, setIsConflictOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isDirty = !isArchiveDraftEqual(draft, savedDraft, archive.canEditMetadata);
  const isMetadataDirty = archive.canEditMetadata && (
    JSON.stringify(toArchiveMetadataInput(draft)) !==
    JSON.stringify(toArchiveMetadataInput(savedDraft))
  );
  const selectedClipIds = new Set(
    draft.chapters.flatMap((chapter) => chapter.items.map((item) => item.clip.id)),
  );

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function addClip(clip: ArchiveClipSummary, requestedChapterId?: string) {
    if (selectedClipIds.has(clip.id)) {
      return;
    }

    if (selectedClipIds.size >= 500) {
      setMessage("클립은 최대 500개까지 추가할 수 있습니다.");
      return;
    }

    let chapterId = requestedChapterId ?? activeChapterId;

    if (draft.metadata.structureMode === "day_based") {
      if (!clip.seasonDay) {
        setMessage("봉누도 일차가 없는 클립은 일차 기반 아카이브에 추가할 수 없습니다.");
        return;
      }

      if (requestedChapterId) {
        const targetChapter = draft.chapters.find((chapter) => chapter.id === requestedChapterId);

        if (targetChapter?.seasonDayId !== clip.seasonDay.id) {
          setMessage("같은 봉누도 일차의 챕터에만 클립을 추가할 수 있습니다.");
          return;
        }
      } else {
        chapterId = draft.chapters.find(
          (chapter) =>
            chapter.id === activeChapterId &&
            chapter.seasonDayId === clip.seasonDay?.id,
        )?.id ?? draft.chapters.find(
          (chapter) => chapter.seasonDayId === clip.seasonDay?.id,
        )?.id ?? null;
      }
    }

    if (!chapterId) {
      setMessage("클립을 추가할 챕터를 선택해주세요.");
      return;
    }

    setDraft({
      ...draft,
      chapters: draft.chapters.map((chapter) => chapter.id === chapterId
        ? {
            ...chapter,
            items: [...chapter.items, {
              clip,
              id: crypto.randomUUID(),
              note: null,
            }],
          }
        : chapter),
    });
    setActiveChapterId(chapterId);
    setMessage(null);
  }

  function handleWorkspaceDragEnd(event: DragEndEvent) {
    const source = event.operation.source;
    const target = event.operation.target;
    const sourceData = source?.data;
    const targetData = target?.data;

    if (
      event.canceled ||
      !source ||
      !target ||
      !isArchiveWorkspaceDragData(sourceData) ||
      !isArchiveWorkspaceDragData(targetData)
    ) {
      return;
    }

    if (
      sourceData.kind === "explorer-clip" &&
      (targetData.kind === "chapter-drop" || targetData.kind === "item")
    ) {
      addClip(sourceData.clip, targetData.chapterId);
      return;
    }

    if (
      sourceData.kind === "chapter" &&
      targetData.kind === "chapter" &&
      sourceData.surface === targetData.surface &&
      isSortableOperation(event.operation)
    ) {
      const sortableSource = event.operation.source;

      if (!sortableSource) {
        return;
      }

      const sourceIndex = sortableSource.initialIndex;
      const targetIndex = sortableSource.index;

      setDraft((current) => ({
        ...current,
        chapters: moveByIndex(current.chapters, sourceIndex, targetIndex),
      }));
      return;
    }

    if (
      sourceData.kind === "item" &&
      targetData.kind === "item" &&
      sourceData.chapterId === targetData.chapterId &&
      isSortableOperation(event.operation)
    ) {
      const sortableSource = event.operation.source;

      if (!sortableSource) {
        return;
      }

      const sourceIndex = sortableSource.initialIndex;
      const targetIndex = sortableSource.index;

      setDraft((current) => ({
        ...current,
        chapters: current.chapters.map((chapter) => chapter.id === sourceData.chapterId
          ? {
              ...chapter,
              items: moveByIndex(chapter.items, sourceIndex, targetIndex),
            }
          : chapter),
      }));
    }
  }

  function saveDraft() {
    setMessage(null);
    saveMutation.mutate({
      archiveId: archive.id,
      input: {
        baseRevision: currentRevision,
        content: toArchiveContentInput(draft),
        metadata: isMetadataDirty ? toArchiveMetadataInput(draft) : undefined,
      },
    }, {
      onError: (error) => {
        if (error.name === "ArchiveConflictError") {
          setIsConflictOpen(true);
          return;
        }

        setMessage(error.message);
      },
      onSuccess: async (result) => {
        setCurrentRevision(result.currentRevision);
        setSavedDraft(draft);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: archiveQueries.detail(archive.id).queryKey }),
          queryClient.invalidateQueries({
            queryKey: archiveQueries.myListKey(archive.isOwner ? "owned" : "edited"),
          }),
          ...((archive.canEditMetadata ? draft.metadata.visibility : archive.visibility) === "public"
            ? [queryClient.invalidateQueries({ queryKey: archiveQueries.lists() })]
            : []),
        ]);
        router.push(`/archives/${archive.id}`);
      },
    });
  }

  function confirmLeave(event: MouseEvent<HTMLAnchorElement>) {
    if (!isDirty || window.confirm("저장하지 않은 변경사항이 있습니다. 이동하시겠습니까?")) {
      return;
    }

    event.preventDefault();
  }

  if (optionsQuery.isPending) {
    return <ArchiveEditorSkeleton />;
  }

  if (optionsQuery.isError) {
    return <ArchiveEditorNotice onRetry={() => void optionsQuery.refetch()}>아카이브 편집 정보를 불러오지 못했습니다.</ArchiveEditorNotice>;
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden"
      data-archive-editor-workspace
    >
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-default px-4 py-2.5 md:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-caption font-semibold text-brand-text">2단계 · 클립 구성</span>
            <span aria-hidden="true" className="text-tertiary">/</span>
            <h1 className="truncate text-body font-semibold text-primary">{draft.metadata.title}</h1>
          </div>
          <p className="mt-0.5 text-caption text-secondary">
            {draft.metadata.structureMode === "day_based" ? "일차별 구성" : "자유롭게 구성"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            className={buttonVariants({ size: "sm", variant: "ghost" })}
            href="/archives"
            onClick={confirmLeave}
          >
            <LogOut aria-hidden="true" className="size-4" />
            나가기
          </Link>
          {archive.canEditMetadata ? (
            <Button onClick={() => setIsSettingsOpen(true)} size="sm" type="button" variant="outline">
              <Settings2 aria-hidden="true" className="size-4" />
              설정
            </Button>
          ) : null}
          <Button disabled={!isDirty || saveMutation.isPending} onClick={saveDraft} size="sm" type="button">
            <Check aria-hidden="true" className="size-4" />
            {saveMutation.isPending ? "저장 중" : "저장"}
          </Button>
        </div>
      </header>

      {message ? (
        <div className="shrink-0 border-b border-default bg-surface-muted px-4 py-2 text-body-sm text-secondary md:px-6" role="status">
          <p>{message}</p>
        </div>
      ) : null}

      <DragDropProvider<ArchiveWorkspaceDragData> onDragEnd={handleWorkspaceDragEnd}>
        <div className="grid min-h-0 flex-1 gap-3 overflow-hidden p-3 lg:grid-cols-[minmax(22rem,0.85fr)_minmax(0,1.35fr)]">
          <div className="min-h-0 min-w-0 overflow-y-auto rounded-xl border border-default bg-surface-raised p-4">
            <ArchiveBuilder
              activeChapterId={activeChapterId}
              draft={draft}
              onActiveChapterChange={setActiveChapterId}
              onDraftChange={setDraft}
              onPreviewItem={(item) => setPreviewItem({ clip: item.clip, note: item.note })}
              seasonDays={optionsQuery.data.seasonDays}
            />
          </div>
          <div className="min-h-0 min-w-0 overflow-y-auto rounded-xl border border-default bg-surface-raised p-4">
            <ArchiveClipExplorer
              onAddClip={addClip}
              onPreviewClip={(clip) => setPreviewItem({ clip, note: null })}
              selectedClipIds={selectedClipIds}
            />
          </div>
        </div>
      </DragDropProvider>

      <ArchiveClipPreviewDialog
        clip={previewItem?.clip ?? null}
        note={previewItem?.note ?? null}
        onClose={() => setPreviewItem(null)}
        size="editor"
      />
      {archive.canEditMetadata ? (
        <ArchiveSettingsDialog
          metadata={draft.metadata}
          onChange={(metadata) => setDraft({ ...draft, metadata })}
          onClose={() => setIsSettingsOpen(false)}
          open={isSettingsOpen}
          relatedParticipants={archive.relatedParticipants}
          seasonDays={optionsQuery.data.seasonDays}
        />
      ) : null}
      {isConflictOpen ? (
        <ArchiveConflictDialog
          onKeepDraft={() => setIsConflictOpen(false)}
          onReload={() => window.location.reload()}
        />
      ) : null}
    </div>
  );
}

export function ArchiveEditorSkeleton() {
  return (
    <div aria-label="아카이브 편집기를 불러오는 중입니다." className="flex h-full min-h-[70vh] flex-col overflow-hidden" role="status">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-default px-4 py-2.5 md:px-6">
        <div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-5 w-60" /><Skeleton className="h-3 w-32" /></div>
        <div className="flex gap-2"><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-16" /></div>
      </header>
      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden p-3 lg:grid-cols-[minmax(22rem,0.85fr)_minmax(0,1.35fr)]">
        <section className="min-h-0 space-y-4 overflow-hidden rounded-xl border border-default bg-surface-raised p-4">
          <div className="flex gap-2"><Skeleton className="h-9 w-32" /><Skeleton className="h-9 w-32" /><Skeleton className="h-9 w-28" /></div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }, (_, index) => <Skeleton className="aspect-video w-full" key={index} />)}</div>
        </section>
        <section className="min-h-0 space-y-4 overflow-hidden rounded-xl border border-default bg-surface-raised p-4">
          <div className="flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-7 w-28" /><Skeleton className="h-4 w-64" /></div><Skeleton className="h-9 w-32" /></div>
          <div className="flex flex-wrap gap-3">{Array.from({ length: 6 }, (_, index) => <Skeleton className="h-9 w-36" key={index} />)}</div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <Skeleton className="aspect-video w-full rounded-xl" key={index} />)}</div>
        </section>
      </div>
    </div>
  );
}

function ArchiveLoginRequired({ archiveId }: { archiveId: string }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-4 py-10 text-center">
      <div>
        <h1 className="text-heading font-semibold text-primary">로그인이 필요합니다.</h1>
        <p className="mt-2 text-body-sm text-secondary">아카이브를 만들고 편집하려면 로그인해주세요.</p>
      </div>
      <Link className={buttonVariants()} href={`/login?returnTo=${encodeURIComponent(`/archives/${archiveId}/edit`)}`}>
        <LogIn aria-hidden="true" className="size-4" />
        로그인하기
      </Link>
    </div>
  );
}

function moveByIndex<T>(items: T[], sourceIndex: number, targetIndex: number): T[] {
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return items;
  }

  const nextItems = [...items];
  const [source] = nextItems.splice(sourceIndex, 1);
  nextItems.splice(targetIndex, 0, source);

  return nextItems;
}

function ArchiveEditorNotice({ children, onRetry }: { children: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-3 py-10 text-center text-body-sm text-secondary">
      <p>{children}</p>
      {onRetry ? <RetryButton onRetry={onRetry} /> : null}
    </div>
  );
}

function ArchiveConflictDialog({
  onKeepDraft,
  onReload,
}: {
  onKeepDraft: () => void;
  onReload: () => void;
}) {
  return (
    <DialogPrimitive.Root onOpenChange={(open) => !open && onKeepDraft()} open>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-modal bg-black/60" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-modal w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-default bg-surface-raised p-5 shadow-2xl outline-none">
          <div className="flex gap-3">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-status-warning" />
            <div>
              <DialogPrimitive.Title className="text-body font-semibold text-primary">
                다른 수정 내용을 확인해주세요.
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-2 text-body-sm text-secondary">
                다른 사용자가 먼저 저장했습니다. 최신 내용을 불러오거나 현재 초안을 유지할 수 있습니다.
              </DialogPrimitive.Description>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <DialogPrimitive.Close render={<Button type="button" variant="outline" />}>초안 유지</DialogPrimitive.Close>
            <Button onClick={onReload} type="button">최신 내용 불러오기</Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
