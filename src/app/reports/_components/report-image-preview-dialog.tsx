"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ReportImagePreviewDialog({
  files,
  index,
  onClose,
  onIndexChange,
}: {
  files: File[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const file = index === null ? null : (files[index] ?? null);
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);

  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();
    function handleLoad(): void {
      if (typeof reader.result === "string" && file) {
        setPreview({ file, url: reader.result });
      }
    }
    reader.addEventListener("load", handleLoad);
    reader.readAsDataURL(file);
    return () => {
      reader.removeEventListener("load", handleLoad);
      reader.abort();
    };
  }, [file]);

  const previewUrl = preview?.file === file ? preview.url : null;

  return (
    <DialogPrimitive.Root
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      open={index !== null}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-modal bg-black/85" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-modal flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-white/20 bg-black shadow-2xl outline-none">
          <header className="flex shrink-0 items-center gap-3 border-b border-white/15 px-4 py-3 text-white">
            <DialogPrimitive.Title className="min-w-0 flex-1 truncate text-body font-semibold">
              업로드 이미지 미리보기
            </DialogPrimitive.Title>
            {index !== null ? (
              <span className="text-body-sm tabular-nums text-white/70">
                {index + 1} / {files.length}
              </span>
            ) : null}
            <DialogPrimitive.Close
              render={<Button aria-label="이미지 미리보기 닫기" size="icon-sm" variant="ghost" />}
            >
              <X aria-hidden="true" />
            </DialogPrimitive.Close>
          </header>
          <div className="relative min-h-0 flex-1">
            {previewUrl && file ? (
              <Image
                fill
                unoptimized
                alt={`${file.name} 확대 미리보기`}
                className="object-contain p-4"
                sizes="calc(100vw - 2rem)"
                src={previewUrl}
              />
            ) : null}
            <PreviewArrow
              direction="previous"
              disabled={index === null || index <= 0}
              onClick={() => {
                if (index !== null && index > 0) onIndexChange(index - 1);
              }}
            />
            <PreviewArrow
              direction="next"
              disabled={index === null || index >= files.length - 1}
              onClick={() => {
                if (index !== null && index < files.length - 1) {
                  onIndexChange(index + 1);
                }
              }}
            />
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function PreviewArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "previous" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const isPrevious = direction === "previous";

  return (
    <button
      aria-label={isPrevious ? "이전 이미지" : "다음 이미지"}
      className={`absolute top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-white/20 bg-black/65 text-white hover:bg-black/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:pointer-events-none disabled:opacity-30 ${isPrevious ? "left-3" : "right-3"}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {isPrevious ? (
        <ChevronLeft aria-hidden="true" />
      ) : (
        <ChevronRight aria-hidden="true" />
      )}
    </button>
  );
}
