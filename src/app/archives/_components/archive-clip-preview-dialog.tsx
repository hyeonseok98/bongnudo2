"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { ArchiveClipSummary } from "@/features/archives/archive";
import { getChzzkClipEmbedUrl } from "@/features/reports/chzzk-clip";

interface ArchiveClipPreviewDialogProps {
  clip: ArchiveClipSummary | null;
  hasNext?: boolean;
  hasPrevious?: boolean;
  note?: string | null;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function ArchiveClipPreviewDialog({
  clip,
  hasNext = false,
  hasPrevious = false,
  note = null,
  onClose,
  onNext,
  onPrevious,
}: ArchiveClipPreviewDialogProps) {
  const embedUrl = clip ? getChzzkClipEmbedUrl(clip.clipUrl) : null;

  return (
    <DialogPrimitive.Root onOpenChange={(open) => !open && onClose()} open={clip !== null}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-modal bg-black/75" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-modal flex w-[calc(100vw-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-default bg-surface-raised shadow-2xl outline-none">
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
                {onPrevious ? (
                  <button
                    aria-label="이전 클립"
                    className="cursor-pointer text-secondary transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!hasPrevious}
                    onClick={onPrevious}
                    type="button"
                  >
                    <ChevronLeft aria-hidden="true" className="size-5" />
                  </button>
                ) : null}
                {onNext ? (
                  <button
                    aria-label="다음 클립"
                    className="cursor-pointer text-secondary transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!hasNext}
                    onClick={onNext}
                    type="button"
                  >
                    <ChevronRight aria-hidden="true" className="size-5" />
                  </button>
                ) : null}
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
                <p className="border-t border-default px-4 py-3 text-body-sm text-secondary">{note}</p>
              ) : null}
            </>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
