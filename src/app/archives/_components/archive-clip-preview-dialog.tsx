"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import type { ArchiveClipSummary } from "@/features/archives/archive";
import { getChzzkClipEmbedUrl } from "@/features/reports/chzzk-clip";
import {
  MEDIA_PREVIEW_BLUR_CLASS,
  shouldBlurMediaPreview,
} from "@/features/rp-mode/rp-mode";
import { useRpModeSettings } from "@/providers/rp-mode-provider";
import { cn } from "@/utils/cn";

export interface ArchiveClipPreviewItem {
  clip: ArchiveClipSummary;
  id: string;
  note: string | null;
}

interface ArchiveClipPreviewDialogProps {
  clip: ArchiveClipSummary | null;
  hasNext?: boolean;
  hasPrevious?: boolean;
  note?: string | null;
  nearbyItems?: ArchiveClipPreviewItem[];
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSelect?: (item: ArchiveClipPreviewItem) => void;
  size?: "editor" | "viewer";
}

export function ArchiveClipPreviewDialog({
  clip,
  hasNext = false,
  hasPrevious = false,
  note = null,
  nearbyItems = [],
  onClose,
  onNext,
  onPrevious,
  onSelect,
  size = "viewer",
}: ArchiveClipPreviewDialogProps) {
  const embedUrl = clip ? getChzzkClipEmbedUrl(clip.clipUrl) : null;
  const { isMediaPreviewBlurEnabled, isRpMode } = useRpModeSettings();
  const shouldBlurThumbnail = shouldBlurMediaPreview(isRpMode, isMediaPreviewBlurEnabled);

  useEffect(() => {
    if (!clip) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" && hasPrevious && onPrevious) {
        event.preventDefault();
        onPrevious();
      }

      if (event.key === "ArrowRight" && hasNext && onNext) {
        event.preventDefault();
        onNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clip, hasNext, hasPrevious, onNext, onPrevious]);

  return (
    <DialogPrimitive.Root onOpenChange={(open) => !open && onClose()} open={clip !== null}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-modal bg-black/75" />
        <div className="pointer-events-none fixed inset-0 z-modal grid place-items-center p-4">
          <DialogPrimitive.Popup className={cn(
              "pointer-events-auto relative outline-none",
              size === "viewer"
                ? "w-[min(calc(100vw-8rem),calc((100dvh-24rem)*16/9))] max-w-6xl"
                : "w-[calc(100vw-2rem)] max-w-5xl",
            )}>
            {size === "viewer" && (onPrevious || onNext) ? (
              <>
                <button
                  aria-label="이전 클립"
                  className="absolute top-1/2 -left-14 z-10 hidden size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-white/20 bg-black/70 text-white shadow-lg transition-colors hover:bg-black/90 focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-30 lg:grid"
                  disabled={!hasPrevious}
                  onClick={onPrevious}
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" className="size-7" />
                </button>
                <button
                  aria-label="다음 클립"
                  className="absolute top-1/2 -right-14 z-10 hidden size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-white/20 bg-black/70 text-white shadow-lg transition-colors hover:bg-black/90 focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-30 lg:grid"
                  disabled={!hasNext}
                  onClick={onNext}
                  type="button"
                >
                  <ChevronRight aria-hidden="true" className="size-7" />
                </button>
              </>
            ) : null}
            <div className={cn(
              "flex max-h-[calc(100dvh-2rem)] flex-col rounded-xl border border-default bg-surface-raised shadow-2xl",
              size === "viewer" ? "overflow-hidden" : "overflow-y-auto",
            )}>
              {clip ? (
                <>
              <header className="flex items-center gap-3 border-b border-default px-4 py-3">
                <DialogPrimitive.Title className="min-w-0 flex-1 truncate text-body font-semibold text-primary">
                  {clip.title}
                </DialogPrimitive.Title>
                {size === "editor" ? (
                  <a
                    aria-label="치지직에서 클립 열기"
                    className="text-secondary transition-colors hover:text-primary"
                    href={clip.clipUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <ExternalLink aria-hidden="true" className="size-5" />
                  </a>
                ) : null}
                <DialogPrimitive.Close
                  aria-label="미리보기 닫기"
                  className="cursor-pointer text-secondary transition-colors hover:text-primary"
                >
                  <X aria-hidden="true" className="size-5" />
                </DialogPrimitive.Close>
              </header>
              <div className="aspect-video w-full shrink-0 bg-black">
                {embedUrl ? (
                  <iframe
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="size-full"
                    referrerPolicy="strict-origin-when-cross-origin"
                    src={embedUrl}
                    title={`${clip.title} 클립 미리보기`}
                  />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-3 px-5 text-center">
                    <p className="text-body-sm text-white/80">
                      이 클립은 미리보기를 지원하지 않습니다.
                    </p>
                    {size === "editor" ? (
                      <a
                        className={buttonVariants({ variant: "outline" })}
                        href={clip.clipUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        치지직에서 보기
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
              {note ? (
                size === "viewer" ? (
                  <ExpandableNote key={clip.id} note={note} />
                ) : (
                  <details className="border-t border-default px-4 py-3" open>
                    <summary className="cursor-pointer text-body-sm font-medium text-primary">추가 설명</summary>
                    <p className="mt-2 text-body-sm text-secondary">{note}</p>
                  </details>
                )
              ) : null}
              {nearbyItems.length > 0 && onSelect ? (
                <section className="shrink-0 border-t border-default px-4 py-3" aria-labelledby="related-clips-heading">
                  <h2 className="text-body-sm font-semibold text-primary" id="related-clips-heading">관련 클립</h2>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {nearbyItems.map((item) => {
                      const isCurrent = item.clip.id === clip.id;

                      return (
                        <button
                          aria-current={isCurrent ? "true" : undefined}
                          aria-label={`${item.clip.title} ${isCurrent ? "현재 클립" : "보기"}`}
                          className={cn(
                            "group cursor-pointer overflow-hidden rounded-md border border-default text-left transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-focus-ring disabled:cursor-default disabled:opacity-100",
                            isCurrent && "border-brand bg-surface-selected ring-1 ring-brand",
                          )}
                          disabled={isCurrent}
                          key={item.id}
                          onClick={() => onSelect(item)}
                          type="button"
                        >
                          <span className="relative block aspect-video overflow-hidden bg-surface-muted">
                            {item.clip.thumbnailUrl ? (
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "absolute inset-0 bg-cover bg-center transition-transform duration-default group-hover:scale-[1.02]",
                                  shouldBlurThumbnail && MEDIA_PREVIEW_BLUR_CLASS,
                                )}
                                style={{ backgroundImage: `url(${JSON.stringify(item.clip.thumbnailUrl)})` }}
                              />
                            ) : null}
                          </span>
                          <span className="block truncate px-2 py-1.5 text-caption font-medium text-primary">{item.clip.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}
                </>
              ) : null}
            </div>
          </DialogPrimitive.Popup>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function ExpandableNote({ note }: { note: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const canExpand = note.length > 70 || note.includes("\n");

  return (
    <section className="shrink-0 border-t border-default px-4 py-3" aria-labelledby="archive-note-heading">
      <h2 className="text-body-sm font-medium text-primary" id="archive-note-heading">추가 설명</h2>
      <p className={cn(
        "mt-1 whitespace-pre-wrap text-body-sm text-secondary",
        isExpanded ? "max-h-24 overflow-y-auto pr-2" : "line-clamp-1",
      )}>
        {note}
      </p>
      {canExpand ? (
        <button
          className="mt-1 cursor-pointer text-caption font-medium text-brand-text hover:underline focus-visible:outline-2 focus-visible:outline-focus-ring"
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          {isExpanded ? "접기" : "더보기"}
        </button>
      ) : null}
    </section>
  );
}
