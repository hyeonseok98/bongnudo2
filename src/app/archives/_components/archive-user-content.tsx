"use client";

import { useState } from "react";

import type { ArchiveDetail, ArchiveDetailItem } from "@/features/archives/archive";

import { ArchiveClipCard } from "./archive-clip-card";
import { ArchiveClipPreviewDialog } from "./archive-clip-preview-dialog";

interface ArchiveUserContentProps {
  archive: ArchiveDetail;
}

export function ArchiveUserContent({ archive }: ArchiveUserContentProps) {
  const [previewItem, setPreviewItem] = useState<ArchiveDetailItem | null>(null);
  const chapters = getOrderedChapters(archive);
  const orderedItems = chapters.flatMap((chapter) => chapter.items);
  const previewIndex = previewItem
    ? orderedItems.findIndex((item) => item.id === previewItem.id)
    : -1;

  return (
    <section className="py-8 sm:py-10">
      {chapters.length === 0 ? (
        <EmptyArchiveContent />
      ) : (
        <div className="space-y-10">
          {chapters.map((chapter) => (
            <section key={chapter.id}>
              <div className="mb-4 space-y-1">
                <h2 className="text-heading font-semibold text-primary">
                  {archive.structureMode === "day_based" && chapter.seasonDay
                    ? `봉누도 ${chapter.seasonDay.dayNumber}일차`
                    : chapter.title}
                </h2>
                {chapter.description ? <p className="text-body-sm text-secondary">{chapter.description}</p> : null}
              </div>
              {chapter.items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-default px-4 py-8 text-center text-body-sm text-tertiary">
                  아직 담긴 클립이 없습니다.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      )}
      <ArchiveClipPreviewDialog
        clip={previewItem?.clip ?? null}
        hasNext={previewIndex >= 0 && previewIndex < orderedItems.length - 1}
        hasPrevious={previewIndex > 0}
        note={previewItem?.note}
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
      />
    </section>
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
        (right.seasonDay?.dayNumber ?? Number.MAX_SAFE_INTEGER),
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
