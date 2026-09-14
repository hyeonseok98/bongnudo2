"use client";

import { FileImage, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useState } from "react";

import { MAX_REPORT_IMAGE_COUNT } from "@/features/reports/report-form";
import { validateReportImageFiles } from "@/features/reports/report-image";

import { ReportImagePreviewDialog } from "./report-image-preview-dialog";

export function ReportImageUpload({
  error,
  files,
  onChange,
  onError,
}: {
  error?: string;
  files: File[];
  onChange: (files: File[]) => void;
  onError: (message: string | undefined) => void;
}) {
  const inputId = useId();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const activePreviewIndex =
    previewIndex !== null && previewIndex < files.length ? previewIndex : null;

  function addFiles(nextFiles: FileList | File[]): void {
    const uniqueFiles = [...files, ...Array.from(nextFiles)].filter(
      (file, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.name === file.name &&
            candidate.size === file.size &&
            candidate.lastModified === file.lastModified,
        ) === index,
    );
    try {
      validateReportImageFiles(uniqueFiles);
      onChange(uniqueFiles);
      onError(undefined);
    } catch (nextError) {
      onError(
        nextError instanceof Error ? nextError.message : "이미지를 확인해주세요.",
      );
    }
  }

  return (
    <>
      <fieldset className="space-y-2">
        <legend className="text-body-sm font-semibold text-primary">
          <span className="inline-flex items-center gap-2">
            <FileImage aria-hidden="true" className="size-4 text-brand-text" />
            이미지 첨부
            <span className="font-normal text-tertiary">
              {files.length}/{MAX_REPORT_IMAGE_COUNT}
            </span>
          </span>
        </legend>
        <label
          className="grid min-h-20 cursor-pointer place-items-center rounded-lg border border-dashed border-control bg-background p-3 text-center hover:border-brand focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring"
          htmlFor={inputId}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            addFiles(event.dataTransfer.files);
          }}
        >
          <span className="flex items-center justify-center gap-3 text-left">
            <UploadCloud aria-hidden="true" className="size-6 shrink-0 text-brand-text" />
            <span>
              <strong className="block text-body-sm text-primary">
                이미지를 드래그하거나 클릭해 선택하세요.
              </strong>
              <span className="mt-1 block text-caption text-tertiary">
                JPG, PNG, WEBP · 파일당 10MB 이하
              </span>
            </span>
          </span>
        </label>
        <input
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          id={inputId}
          multiple
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
          type="file"
        />
        {error ? (
          <span className="text-body-sm font-normal text-status-danger" role="alert">
            {error}
          </span>
        ) : null}
        <ul className="grid grid-cols-3 gap-2">
          {files.map((file, index) => (
            <ReportImageThumbnail
              file={file}
              index={index}
              key={`${file.name}-${file.size}-${file.lastModified}`}
              onOpen={setPreviewIndex}
              onRemove={(removeIndex) =>
                onChange(files.filter((_, fileIndex) => fileIndex !== removeIndex))
              }
            />
          ))}
        </ul>
      </fieldset>
      <ReportImagePreviewDialog
        files={files}
        index={activePreviewIndex}
        onClose={() => setPreviewIndex(null)}
        onIndexChange={setPreviewIndex}
      />
    </>
  );
}

function ReportImageThumbnail({
  file,
  index,
  onOpen,
  onRemove,
}: {
  file: File;
  index: number;
  onOpen: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const reader = new FileReader();
    function handleLoad(): void {
      if (typeof reader.result === "string") setUrl(reader.result);
    }
    reader.addEventListener("load", handleLoad);
    reader.readAsDataURL(file);
    return () => {
      reader.removeEventListener("load", handleLoad);
      reader.abort();
    };
  }, [file]);

  return (
    <li className="group relative h-14 overflow-hidden rounded-lg border border-default">
      <button
        aria-label={`첨부 이미지 ${index + 1} 크게 보기`}
        className="absolute inset-0 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
        onClick={() => onOpen(index)}
        type="button"
      >
        {url ? (
          <Image
            fill
            unoptimized
            alt={`첨부 이미지 ${index + 1} 미리보기`}
            className="object-cover"
            sizes="120px"
            src={url}
          />
        ) : null}
      </button>
      <button
        aria-label={`첨부 이미지 ${index + 1} 삭제`}
        className="absolute top-1 right-1 z-base grid size-7 cursor-pointer place-items-center rounded-full bg-black/70 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        onClick={() => onRemove(index)}
        type="button"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </li>
  );
}
