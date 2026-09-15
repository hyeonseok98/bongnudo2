"use client";

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, X } from "lucide-react";
import { useRef, useState } from "react";

import { uploadReportImages } from "@/apis/reports/report-uploads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  buildReportRequest,
  createInitialReportForm,
  getActiveReportDraft,
  getReportFormErrors,
  isReportFormReady,
  type ReportConfirmations,
  type ReportFormErrors,
  type ReportFormState,
} from "@/features/reports/report-form";
import { compressReportImages } from "@/features/reports/report-image";
import type { ReportOptions, UserReportType } from "@/features/reports/report-options";
import { reportMutations } from "@/queries/report-mutations";
import { reportQueries } from "@/queries/report-queries";

import { ReportImageUpload } from "./report-image-upload";

interface ReportDialogProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
}

type SubmissionStep = "idle" | "processing" | "uploading" | "submitting";

const REPORT_TYPES: {
  description: string;
  label: string;
  value: UserReportType;
}[] = [
  { description: "서비스에서 발견한 문제", label: "오류 제보", value: "bug" },
  { description: "서비스 개선 아이디어", label: "아이디어", value: "idea" },
];

const CONFIRMATIONS: {
  id: keyof ReportConfirmations;
  label: string;
}[] = [
  {
    id: "isRespectful",
    label: "사실에 기반해 타인을 존중하는 표현으로 작성했습니다.",
  },
  {
    id: "canUseAsRecord",
    label: "제보한 내용이 봉누록 서비스 개선에 활용되는 것에 동의합니다.",
  },
];

export function ReportDialog({ onClose, onSuccess }: ReportDialogProps) {
  const [form, setForm] = useState(createInitialReportForm);
  const [fieldErrors, setFieldErrors] = useState<ReportFormErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionStep, setSubmissionStep] = useState<SubmissionStep>("idle");
  const [isDirty, setIsDirty] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const optionsQuery = useQuery(reportQueries.options());
  const mutation = useMutation(reportMutations.create());
  const isPending = submissionStep !== "idle";
  const draft = getActiveReportDraft(form);
  const confirmations = form.confirmations[form.reportType];

  function updateForm(update: Partial<ReportFormState>): void {
    setForm((current) => ({ ...current, ...update }));
    setIsDirty(true);
  }

  function updateDraft(update: Partial<typeof draft>): void {
    setForm((current) => ({
      ...current,
      drafts: {
        ...current.drafts,
        [current.reportType]: {
          ...current.drafts[current.reportType],
          ...update,
        },
      },
    }));
    setIsDirty(true);
  }

  function updateConfirmations(update: Partial<ReportConfirmations>): void {
    setForm((current) => ({
      ...current,
      confirmations: {
        ...current.confirmations,
        [current.reportType]: {
          ...current.confirmations[current.reportType],
          ...update,
        },
      },
    }));
    setIsDirty(true);
    setFieldErrors((current) => ({ ...current, confirmations: undefined }));
  }

  function handleTypeChange(reportType: UserReportType): void {
    if (reportType === form.reportType) return;
    updateForm({ reportType });
    setFieldErrors({});
    setSubmissionError(null);
  }

  function finishClose(): void {
    if (isPending) return;
    setForm(createInitialReportForm());
    setFieldErrors({});
    setSubmissionError(null);
    setIsDirty(false);
    setIsDiscardDialogOpen(false);
    mutation.reset();
    onClose();
  }

  function requestClose(): void {
    if (isPending) return;
    if (isDirty) {
      setIsDiscardDialogOpen(true);
      return;
    }
    finishClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const nextErrors = getReportFormErrors(form);
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setSubmissionError(null);
    let currentStep: SubmissionStep = "processing";

    try {
      setSubmissionStep(currentStep);
      const compressedImages = await compressReportImages(form.files);
      currentStep = "uploading";
      setSubmissionStep(currentStep);
      const imageObjectKeys = await uploadReportImages(compressedImages);
      currentStep = "submitting";
      setSubmissionStep(currentStep);
      await mutation.mutateAsync(buildReportRequest(form, imageObjectKeys));
      onSuccess("제보가 접수되었습니다.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "제보를 저장하지 못했습니다.";
      if (currentStep === "processing" || currentStep === "uploading") {
        setFieldErrors((current) => ({ ...current, images: message }));
      } else {
        setSubmissionError(message);
      }
    } finally {
      setSubmissionStep("idle");
    }
  }

  return (
    <>
      <DialogPrimitive.Root
        disablePointerDismissal
        onOpenChange={(isOpen, eventDetails) => {
          if (!isOpen) {
            eventDetails.cancel();
            requestClose();
          }
        }}
        open
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-modal bg-black/70" />
          <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-modal flex h-[min(46rem,calc(100dvh-1rem))] w-[calc(100vw-1rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-default bg-surface-raised shadow-2xl outline-none sm:h-[min(46rem,calc(100dvh-2rem))] sm:w-[calc(100vw-2rem)]">
            <header className="flex shrink-0 items-start gap-3 border-b border-default bg-surface-muted px-5 py-3.5 sm:px-6">
              <span className="min-w-0 flex-1">
                <DialogPrimitive.Title className="block text-title-sm font-bold text-primary">
                  제보하기
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-0.5 block text-body-sm text-secondary">
                  서비스 오류와 개선 의견을 알려주세요.
                </DialogPrimitive.Description>
              </span>
              <Button aria-label="제보 닫기" disabled={isPending} onClick={requestClose} size="icon" variant="ghost">
                <X aria-hidden="true" />
              </Button>
            </header>

            <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
              <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 md:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.75fr)] sm:p-6">
                <div className="space-y-4">
                  <fieldset className="space-y-2">
                    <legend className="text-caption font-semibold text-secondary">제보 유형</legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {REPORT_TYPES.map((reportType) => (
                        <button
                          aria-pressed={form.reportType === reportType.value}
                          className="cursor-pointer rounded-lg border border-default bg-background px-3 py-2.5 text-left transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring aria-pressed:border-brand aria-pressed:bg-surface-selected"
                          key={reportType.value}
                          onClick={() => handleTypeChange(reportType.value)}
                          type="button"
                        >
                          <strong className="block text-body-sm text-primary">{reportType.label}</strong>
                          <span className="mt-1 block text-caption text-tertiary">{reportType.description}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <FieldLabel error={fieldErrors.categoryId} label="분류" required>
                    <CategorySelect
                      onChange={(categoryId) => {
                        updateDraft({ categoryId });
                        setFieldErrors((current) => ({ ...current, categoryId: undefined }));
                      }}
                      options={optionsQuery.data}
                      reportType={form.reportType}
                      value={draft.categoryId}
                    />
                  </FieldLabel>

                  <FieldLabel error={fieldErrors.title} label="제목" required>
                    <Input
                      aria-invalid={Boolean(fieldErrors.title)}
                      maxLength={100}
                      onChange={(event) => {
                        updateDraft({ title: event.target.value });
                        setFieldErrors((current) => ({ ...current, title: undefined }));
                      }}
                      placeholder={getTitlePlaceholder(form.reportType)}
                      value={draft.title}
                    />
                    <CharacterCount current={draft.title.length} max={100} />
                  </FieldLabel>

                  <FieldLabel error={fieldErrors.content} label="내용" required>
                    <Textarea
                      aria-invalid={Boolean(fieldErrors.content)}
                      className="h-32 min-h-32"
                      maxLength={400}
                      onChange={(event) => {
                        updateDraft({ content: event.target.value });
                        setFieldErrors((current) => ({ ...current, content: undefined }));
                      }}
                      placeholder={getContentPlaceholder(form.reportType)}
                      value={draft.content}
                    />
                    <CharacterCount current={draft.content.length} max={400} />
                  </FieldLabel>
                </div>

                <aside className="min-w-0 rounded-lg bg-surface-inset p-4">
                  <ReportImageUpload
                    error={fieldErrors.images}
                    files={form.files}
                    onChange={(files) => {
                      updateForm({ files });
                      setFieldErrors((current) => ({ ...current, images: undefined }));
                    }}
                    onError={(images) => setFieldErrors((current) => ({ ...current, images }))}
                  />
                </aside>
              </div>

              <footer className="grid shrink-0 gap-3 border-t border-default bg-surface-muted px-5 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
                <div>
                  <ConfirmationFields confirmations={confirmations} error={fieldErrors.confirmations} onChange={updateConfirmations} />
                  {optionsQuery.isError ? <p className="mt-1 text-caption text-status-danger" role="alert">제보 선택 항목을 불러오지 못했습니다.</p> : null}
                  {submissionError ? <p className="mt-1 text-caption text-status-danger" role="alert">{submissionError}</p> : null}
                </div>
                <div className="flex justify-end gap-2">
                  <Button disabled={isPending} onClick={requestClose} type="button" variant="outline">취소</Button>
                  <Button disabled={isPending || optionsQuery.isPending || optionsQuery.isError || !isReportFormReady(form)} type="submit">
                    <Send aria-hidden="true" />
                    {getSubmissionLabel(submissionStep)}
                  </Button>
                </div>
              </footer>
            </form>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
      <DiscardReportDialog isOpen={isDiscardDialogOpen} onCancel={() => setIsDiscardDialogOpen(false)} onDiscard={finishClose} />
    </>
  );
}

function CategorySelect({
  onChange,
  options,
  reportType,
  value,
}: {
  onChange: (value: string) => void;
  options?: ReportOptions;
  reportType: UserReportType;
  value: string;
}) {
  const categories =
    options?.categories.filter(
      (category) => category.reportType === reportType,
    ) ?? [];
  const selectOptions = [
    { label: "분류를 선택해주세요.", value: "" },
    ...categories.map((category) => ({
      label: category.name,
      value: category.id,
    })),
  ];

  return (
    <Select
      className="w-full"
      disabled={!options}
      label="제보 분류"
      onValueChange={onChange}
      options={selectOptions}
      value={value}
    />
  );
}

function FieldLabel({
  children,
  error,
  label,
  required = false,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-caption font-semibold text-secondary">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-status-danger">
            *
          </span>
        ) : null}
      </span>
      {children}
      {error ? (
        <span className="block text-caption text-status-danger" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function CharacterCount({ current, max }: { current: number; max: number }) {
  return <p className="text-right text-caption tabular-nums text-tertiary">{current}/{max}</p>;
}

function ConfirmationFields({
  confirmations,
  error,
  onChange,
}: {
  confirmations: ReportConfirmations;
  error?: string;
  onChange: (update: Partial<ReportConfirmations>) => void;
}) {
  const isAllChecked = CONFIRMATIONS.every(
    (confirmation) => confirmations[confirmation.id],
  );
  const isPartiallyChecked = CONFIRMATIONS.some(
    (confirmation) => confirmations[confirmation.id],
  );

  return (
    <fieldset className="space-y-1.5">
      <legend className="sr-only">제출 전 확인</legend>
      <label className="flex cursor-pointer items-start gap-2 text-caption font-semibold text-primary">
        <input
          checked={isAllChecked}
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand"
          onChange={() => {
            const nextValue = !isAllChecked;
            onChange({ canUseAsRecord: nextValue, isRespectful: nextValue });
          }}
          ref={(node) => {
            if (node) node.indeterminate = !isAllChecked && isPartiallyChecked;
          }}
          type="checkbox"
        />
        모두 동의합니다.
      </label>
      <div className="grid gap-1.5">
        {CONFIRMATIONS.map((confirmation) => (
          <label
            className="flex cursor-pointer items-start gap-2 text-caption text-secondary"
            key={confirmation.id}
          >
            <input
              checked={confirmations[confirmation.id]}
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand"
              onChange={() =>
                onChange({
                  [confirmation.id]: !confirmations[confirmation.id],
                })
              }
              required
              type="checkbox"
            />
            <span>
              {confirmation.label}
              <span aria-hidden="true" className="ml-1 text-status-danger">
                *
              </span>
              <span className="sr-only">필수</span>
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <span className="block text-caption text-status-danger" role="alert">
          {error}
        </span>
      ) : null}
    </fieldset>
  );
}

function DiscardReportDialog({
  isOpen,
  onCancel,
  onDiscard,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onDiscard: () => void;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  return (
    <AlertDialogPrimitive.Root
      onOpenChange={(open) => !open && onCancel()}
      open={isOpen}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Backdrop className="fixed inset-0 z-popover bg-black/60" />
        <AlertDialogPrimitive.Popup
          className="fixed top-1/2 left-1/2 z-popover w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-default bg-surface-raised p-5 shadow-2xl outline-none"
          initialFocus={titleRef}
        >
          <AlertDialogPrimitive.Title
            className="text-title-sm font-bold text-primary outline-none"
            ref={titleRef}
            tabIndex={-1}
          >
            작성 중인 내용을 버릴까요?
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-2 text-body-sm text-secondary">
            저장하지 않은 제보 내용은 복구할 수 없습니다.
          </AlertDialogPrimitive.Description>
          <div className="mt-5 flex justify-end gap-2">
            <Button onClick={onCancel} type="button" variant="outline">
              계속 작성
            </Button>
            <Button onClick={onDiscard} type="button">
              내용 버리기
            </Button>
          </div>
        </AlertDialogPrimitive.Popup>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

function getTitlePlaceholder(reportType: UserReportType): string {
  return reportType === "bug"
    ? "어떤 오류인지 한눈에 알 수 있는 제목을 입력해주세요."
    : "개선 아이디어를 간단히 요약해주세요.";
}

function getContentPlaceholder(reportType: UserReportType): string {
  return reportType === "bug"
    ? "오류가 발생한 상황과 재현 방법을 작성해주세요."
    : "개선되었으면 하는 점과 기대 효과를 작성해주세요.";
}

function getSubmissionLabel(step: SubmissionStep): string {
  if (step === "processing") return "이미지 처리 중...";
  if (step === "uploading") return "이미지 업로드 중...";
  if (step === "submitting") return "제보 등록 중...";
  return "제보하기";
}
