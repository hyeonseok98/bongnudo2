"use client";

import { AlertTriangle, Check, LogIn, Settings2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, buttonVariants } from "@/components/ui/button";
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

interface ArchiveEditorProps {
  archiveId: string;
  isSignedIn: boolean;
}

export function ArchiveEditor({ archiveId, isSignedIn }: ArchiveEditorProps) {
  const archiveQuery = useQuery(archiveQueries.detail(archiveId));

  if (!isSignedIn) {
    return <ArchiveLoginRequired />;
  }

  if (archiveQuery.isPending) {
    return <ArchiveEditorNotice>아카이브를 불러오는 중입니다.</ArchiveEditorNotice>;
  }

  if (archiveQuery.isError || !archiveQuery.data) {
    return <ArchiveEditorNotice>아카이브를 불러오지 못했습니다.</ArchiveEditorNotice>;
  }

  if (!archiveQuery.data.canEditContent) {
    return <ArchiveEditorNotice>이 아카이브를 편집할 권한이 없습니다.</ArchiveEditorNotice>;
  }

  if (archiveQuery.data.archiveKind !== "user" || archiveQuery.data.structureMode === null) {
    return <ArchiveEditorNotice>시스템 아카이브는 편집할 수 없습니다.</ArchiveEditorNotice>;
  }

  return <ArchiveEditorWorkspace archive={archiveQuery.data} />;
}

function ArchiveEditorWorkspace({ archive }: { archive: ArchiveDetail }) {
  const optionsQuery = useQuery(archiveQueries.editorOptions());
  const saveMutation = useMutation(archiveMutations.save());
  const queryClient = useQueryClient();
  const initialDraft = createArchiveDraft(archive);
  const [draft, setDraft] = useState<ArchiveEditorDraft>(initialDraft);
  const [savedDraft, setSavedDraft] = useState<ArchiveEditorDraft>(initialDraft);
  const [currentRevision, setCurrentRevision] = useState(archive.currentRevision ?? 1);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(archive.chapters[0]?.id ?? null);
  const [previewClip, setPreviewClip] = useState<ArchiveClipSummary | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConflictOpen, setIsConflictOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isDirty = !isArchiveDraftEqual(draft, savedDraft, archive.canEditMetadata);
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

  function addClip(clip: ArchiveClipSummary) {
    if (selectedClipIds.has(clip.id)) {
      return;
    }

    if (selectedClipIds.size >= 500) {
      setMessage("클립은 최대 500개까지 추가할 수 있습니다.");
      return;
    }

    let chapterId = activeChapterId;

    if (draft.metadata.structureMode === "day_based") {
      if (!clip.seasonDay) {
        setMessage("봉누도 일차가 없는 클립은 일차 기반 아카이브에 추가할 수 없습니다.");
        return;
      }

      chapterId = draft.chapters.find((chapter) => chapter.seasonDayId === clip.seasonDay?.id)?.id ?? null;
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

  function saveDraft() {
    setMessage(null);
    saveMutation.mutate({
      archiveId: archive.id,
      input: {
        baseRevision: currentRevision,
        content: toArchiveContentInput(draft),
        metadata: archive.canEditMetadata ? toArchiveMetadataInput(draft) : undefined,
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
        setMessage("저장되었습니다.");
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: archiveQueries.detail(archive.id).queryKey }),
          queryClient.invalidateQueries({
            queryKey: archiveQueries.myListKey(archive.isOwner ? "owned" : "edited"),
          }),
          ...((archive.canEditMetadata ? draft.metadata.visibility : archive.visibility) === "public"
            ? [queryClient.invalidateQueries({ queryKey: archiveQueries.lists() })]
            : []),
        ]);
      },
    });
  }

  if (optionsQuery.isPending) {
    return <ArchiveEditorNotice>아카이브 편집 정보를 불러오는 중입니다.</ArchiveEditorNotice>;
  }

  if (optionsQuery.isError) {
    return <ArchiveEditorNotice>아카이브 편집 정보를 불러오지 못했습니다.</ArchiveEditorNotice>;
  }

  return (
    <div className="space-y-5 py-5 sm:py-6 lg:py-8">
      <header className="flex flex-col gap-4 border-b border-default pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-body-sm font-medium text-brand-text">사용자 제작 아카이브</p>
          <h1 className="mt-1 truncate text-title font-bold text-primary">{draft.metadata.title}</h1>
          <p className="mt-1 text-body-sm text-secondary">
            {draft.metadata.structureMode === "day_based" ? "일차 기반" : "자유 구성"} · revision {currentRevision}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {archive.canEditMetadata ? (
            <Button onClick={() => setIsSettingsOpen(true)} type="button" variant="outline">
              <Settings2 aria-hidden="true" className="size-4" />
              설정
            </Button>
          ) : null}
          <Button disabled={!isDirty || saveMutation.isPending} onClick={saveDraft} type="button">
            <Check aria-hidden="true" className="size-4" />
            {saveMutation.isPending ? "저장 중" : "저장"}
          </Button>
        </div>
      </header>

      {message ? (
        <p className="rounded-lg border border-default bg-surface-muted px-3 py-2 text-body-sm text-secondary" role="status">
          {message}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
        <div className="min-w-0 rounded-xl border border-default bg-surface-raised p-4 sm:p-5">
          <ArchiveClipExplorer
            onAddClip={addClip}
            onPreviewClip={setPreviewClip}
            selectedClipIds={selectedClipIds}
          />
        </div>
        <div className="min-w-0 rounded-xl border border-default bg-surface-raised p-4 sm:p-5 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">
          <ArchiveBuilder
            activeChapterId={activeChapterId}
            draft={draft}
            onActiveChapterChange={setActiveChapterId}
            onDraftChange={setDraft}
            seasonDays={optionsQuery.data.seasonDays}
          />
        </div>
      </div>

      <ArchiveClipPreviewDialog clip={previewClip} onClose={() => setPreviewClip(null)} />
      {archive.canEditMetadata ? (
        <ArchiveSettingsDialog
          metadata={draft.metadata}
          onChange={(metadata) => setDraft({ ...draft, metadata })}
          onClose={() => setIsSettingsOpen(false)}
          open={isSettingsOpen}
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

function ArchiveLoginRequired() {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-4 py-10 text-center">
      <div>
        <h1 className="text-heading font-semibold text-primary">로그인이 필요합니다.</h1>
        <p className="mt-2 text-body-sm text-secondary">아카이브를 만들고 편집하려면 로그인해주세요.</p>
      </div>
      <Link className={buttonVariants()} href="/login?returnTo=%2Farchives%2Fnew">
        <LogIn aria-hidden="true" className="size-4" />
        로그인하기
      </Link>
    </div>
  );
}

function ArchiveEditorNotice({ children }: { children: string }) {
  return (
    <div className="flex min-h-80 items-center justify-center py-10 text-center text-body-sm text-secondary">
      {children}
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
    <div className="fixed inset-0 z-modal grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl border border-default bg-surface-raised p-5 shadow-2xl">
        <div className="flex gap-3">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-status-warning" />
          <div>
            <h2 className="text-body font-semibold text-primary">다른 수정 내용을 확인해주세요.</h2>
            <p className="mt-2 text-body-sm text-secondary">
              다른 사용자가 먼저 저장했습니다. 최신 내용을 불러오거나 현재 초안을 유지할 수 있습니다.
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onKeepDraft} type="button" variant="outline">초안 유지</Button>
          <Button onClick={onReload} type="button">최신 내용 불러오기</Button>
        </div>
      </div>
    </div>
  );
}
