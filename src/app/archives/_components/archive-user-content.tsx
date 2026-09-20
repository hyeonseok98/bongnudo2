"use client";

import { useEffect, useState } from "react";

import type { ArchiveDetail, ArchiveDetailItem } from "@/features/archives/archive";

import { ArchiveClipCard } from "./archive-clip-card";
import {
  ArchiveClipPreviewDialog,
  type ArchiveClipPreviewItem,
} from "./archive-clip-preview-dialog";

interface ArchiveUserContentProps {
  archive: ArchiveDetail;
}

export function ArchiveUserContent({ archive }: ArchiveUserContentProps) {
  const [previewItem, setPreviewItem] = useState<ArchiveDetailItem | null>(null);
  const [isMainVisible, setIsMainVisible] = useState(true);
  const [isSideVisible, setIsSideVisible] = useState(true);
  const chapters = getOrderedChapters(archive);
  const visibleChapters = chapters.filter((chapter) =>
    chapter.storyType === "main" ? isMainVisible : isSideVisible,
  );
  const orderedItems = visibleChapters.flatMap((chapter) => chapter.items);
  const previewIndex = previewItem
    ? orderedItems.findIndex((item) => item.id === previewItem.id)
    : -1;
  const nearbyItems = previewIndex < 0
    ? []
    : getCenteredItems(orderedItems, previewIndex, 5).map(toPreviewItem);
  const visibleChapterKey = visibleChapters.map((chapter) => chapter.id).join(",");
  const [activeChapterId, setActiveChapterId] = useState<string | null>(chapters[0]?.id ?? null);

  useEffect(() => {
    const chapterIds = visibleChapterKey ? visibleChapterKey.split(",") : [];
    const chapterElements = chapterIds.flatMap((chapterId) => {
      const element = document.getElementById(`archive-chapter-${chapterId}`);
      return element ? [element] : [];
    });

    if (chapterElements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const activeEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];

      if (activeEntry) {
        setActiveChapterId(activeEntry.target.id.replace("archive-chapter-", ""));
      }
    }, { rootMargin: "-18% 0px -68% 0px", threshold: 0 });

    chapterElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [visibleChapterKey]);

  function changeStoryVisibility(storyType: "main" | "side") {
    if (storyType === "main") {
      if (!isMainVisible && !isSideVisible) return;
      if (isMainVisible && !isSideVisible) return;
      setIsMainVisible((current) => !current);
      return;
    }

    if (!isMainVisible && !isSideVisible) return;
    if (isSideVisible && !isMainVisible) return;
    setIsSideVisible((current) => !current);
  }

  return (
    <section className="py-8 sm:py-10">
      {chapters.length === 0 ? (
        <EmptyArchiveContent />
      ) : (
        <div className="space-y-8">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="min-w-0 space-y-12">
              {visibleChapters.map((chapter) => (
                <section className="scroll-mt-24" id={`archive-chapter-${chapter.id}`} key={chapter.id}>
                  <div className="mb-5 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-heading font-semibold text-primary">
                        {archive.structureMode === "day_based" && chapter.seasonDay
                          ? `봉누도 ${chapter.seasonDay.dayNumber}일차 · ${chapter.title}`
                          : chapter.title}
                      </h2>
                    </div>
                    {chapter.description ? <p className="max-w-3xl text-body-sm leading-relaxed text-secondary">{chapter.description}</p> : null}
                  </div>
                  {chapter.items.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-default px-4 py-8 text-center text-body-sm text-tertiary">
                      아직 담긴 클립이 없습니다.
                    </p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {chapter.items.map((item) => (
                        <ArchiveClipCard
                          clip={item.clip}
                          key={item.id}
                          note={item.note}
                          onPreview={() => setPreviewItem(item)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
            <aside aria-label="아카이브 목차" className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-xl border border-default bg-surface-raised p-3 lg:block">
              <div className="space-y-3 border-b border-default px-2 pb-3">
                <p className="text-body-sm font-semibold text-primary">일차 · 챕터</p>
                <div aria-label="스토리 표시 설정" className="space-y-2">
                  <button
                    className="cursor-pointer text-caption font-medium text-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-focus-ring"
                    onClick={() => {
                      setIsMainVisible(true);
                      setIsSideVisible(true);
                    }}
                    type="button"
                  >
                    전체 보기
                  </button>
                  <StoryVisibilityToggle checked={isMainVisible} label="메인" onChange={() => changeStoryVisibility("main")} />
                  <StoryVisibilityToggle checked={isSideVisible} label="사이드" onChange={() => changeStoryVisibility("side")} />
                </div>
              </div>
              <nav>
                <ul className="relative mt-3 space-y-1 before:absolute before:top-4 before:bottom-4 before:left-3.5 before:w-px before:bg-tertiary/60">
                  {visibleChapters.map((chapter) => {
                    const isActive = activeChapterId === chapter.id;
                    const chapterLabel = archive.structureMode === "day_based" && chapter.seasonDay
                      ? `${chapter.seasonDay.dayNumber}일차 · ${chapter.title}`
                      : chapter.title;

                    return (
                      <li className="relative" key={chapter.id}>
                        <span
                          aria-hidden="true"
                          className={isActive
                            ? "pointer-events-none absolute top-1/2 left-2.5 z-10 size-2 rounded-full -translate-y-1/2 bg-brand"
                            : "pointer-events-none absolute top-1/2 left-2.5 z-10 size-2 rounded-full -translate-y-1/2 bg-tertiary"}
                        />
                        <button
                          aria-current={isActive ? "location" : undefined}
                          className={isActive
                            ? "w-full cursor-pointer rounded-lg py-2 pr-2 pl-7 text-left text-body-sm font-medium text-brand-text focus-visible:outline-2 focus-visible:outline-focus-ring"
                            : "w-full cursor-pointer rounded-lg py-2 pr-2 pl-7 text-left text-body-sm text-secondary hover:bg-surface-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-focus-ring"}
                          onClick={() => {
                            setActiveChapterId(chapter.id);
                            document.getElementById(`archive-chapter-${chapter.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          type="button"
                        >
                          <span className="block truncate">{chapterLabel}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>
          </div>
        </div>
      )}
      <ArchiveClipPreviewDialog
        clip={previewItem?.clip ?? null}
        hasNext={previewIndex >= 0 && previewIndex < orderedItems.length - 1}
        hasPrevious={previewIndex > 0}
        note={previewItem?.note}
        nearbyItems={nearbyItems}
        onClose={() => setPreviewItem(null)}
        onNext={() => {
          if (previewIndex >= 0 && previewIndex < orderedItems.length - 1) {
            setPreviewItem(orderedItems[previewIndex + 1]);
          }
        }}
        onPrevious={() => {
          if (previewIndex > 0) {
            setPreviewItem(orderedItems[previewIndex - 1]);
          }
        }}
        onSelect={(item) => {
          const nextItem = orderedItems.find((candidate) => candidate.id === item.id);

          if (nextItem) {
            setPreviewItem(nextItem);
          }
        }}
      />
    </section>
  );
}

function toPreviewItem(item: ArchiveDetailItem): ArchiveClipPreviewItem {
  return { clip: item.clip, id: item.id, note: item.note };
}

function getCenteredItems<T>(items: T[], currentIndex: number, windowSize: number): T[] {
  const start = Math.min(
    Math.max(0, currentIndex - Math.floor(windowSize / 2)),
    Math.max(0, items.length - windowSize),
  );

  return items.slice(start, start + windowSize);
}

function StoryVisibilityToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-caption text-secondary">
      <input
        checked={checked}
        className="size-3.5 cursor-pointer accent-brand"
        onChange={onChange}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function getOrderedChapters(archive: ArchiveDetail) {
  const chapters = [...archive.chapters].map((chapter) => ({
    ...chapter,
    items: [...chapter.items].sort((left, right) => left.sortOrder - right.sortOrder),
  }));

  if (archive.structureMode === "day_based") {
    return chapters.sort(
      (left, right) =>
        (left.seasonDay?.dayNumber ?? Number.MAX_SAFE_INTEGER) -
          (right.seasonDay?.dayNumber ?? Number.MAX_SAFE_INTEGER) ||
        left.sortOrder - right.sortOrder,
    );
  }

  return chapters.sort((left, right) => left.sortOrder - right.sortOrder);
}

function EmptyArchiveContent() {
  return (
    <p className="rounded-xl border border-dashed border-default px-4 py-14 text-center text-body-sm text-tertiary">
      아직 담긴 클립이 없습니다.
    </p>
  );
}
