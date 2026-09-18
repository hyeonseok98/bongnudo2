"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { useEffect } from "react";

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
        <DialogPrimitive.Popup className={cn(
          "fixed top-1/2 left-1/2 z-modal flex w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-xl border border-default bg-surface-raised shadow-2xl outline-none",
          size === "viewer" ? "max-w-6xl" : "max-w-4xl",
        )}>
          {clip ? (
            <>
              <header className="flex items-center gap-3 border-b border-default px-4 py-3">
                <DialogPrimitive.Title className="min-w-0 flex-1 truncate text-body font-semibold text-primary">
                  {clip.title}
                </DialogPrimitive.Title>
                <a
                  aria-label="치지직에서 클립 열기"
                  className="text-secondary transition-colors hover:text-primary"
                  href={clip.clipUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <ExternalLink aria-hidden="true" className="size-5" />
                </a>
                <DialogPrimitive.Close
                  aria-label="미리보기 닫기"
                  className="cursor-pointer text-secondary transition-colors hover:text-primary"
                >
                  <X aria-hidden="true" className="size-5" />
                </DialogPrimitive.Close>
              </header>
              <div className="aspect-video bg-black">
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
                    <a
                      className={buttonVariants({ variant: "outline" })}
                      href={clip.clipUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      치지직에서 보기
                    </a>
                  </div>
                )}
              </div>
              {note ? (
                <details className="border-t border-default px-4 py-3" open>
                  <summary className="cursor-pointer text-body-sm font-medium text-primary">추가 설명</summary>
                  <p className="mt-2 text-body-sm text-secondary">{note}</p>
                </details>
              ) : null}
              {(onPrevious || onNext) ? (
                <div className="flex items-center justify-between gap-3 border-t border-default px-4 py-3">
                  <button
                    className={buttonVariants({ variant: "outline" })}
                    disabled={!hasPrevious}
                    onClick={onPrevious}
                    type="button"
                  >
                    <ChevronLeft aria-hidden="true" className="size-4" />
                    이전
                  </button>
                  <button
                    className={buttonVariants({ variant: "outline" })}
                    disabled={!hasNext}
                    onClick={onNext}
                    type="button"
                  >
                    다음
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </button>
                </div>
              ) : null}
              {nearbyItems.length > 0 && onSelect ? (
                <section className="border-t border-default px-4 py-4" aria-labelledby="nearby-clips-heading">
                  <h2 className="text-body-sm font-semibold text-primary" id="nearby-clips-heading">주변 클립</h2>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {nearbyItems.map((item) => {
                      const isCurrent = item.clip.id === clip.id;

                      return (
                        <button
                          aria-current={isCurrent ? "true" : undefined}
                          aria-label={`${item.clip.title} ${isCurrent ? "현재 클립" : "보기"}`}
                          className={cn(
                            "group overflow-hidden rounded-md border border-default text-left focus-visible:outline-2 focus-visible:outline-focus-ring",
                            isCurrent && "border-brand ring-1 ring-brand",
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
                          <span className="block truncate px-2 py-1.5 text-caption text-secondary">{item.clip.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
