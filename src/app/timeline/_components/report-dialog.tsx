"use client";

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileImage,
  Link as LinkIcon,
  Plus,
  Search,
  Send,
  UploadCloud,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useState } from "react";

import { uploadReportImages } from "@/apis/reports/report-uploads";
import { CharacterAvatar } from "@/app/characters/_components/character-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PickerInput } from "@/components/ui/picker-input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  buildReportRequest,
  createInitialReportForm,
  getActiveReportDraft,
  getReportFormErrors,
  isReportFormReady,
  MAX_REPORT_CLIP_COUNT,
  MAX_REPORT_IMAGE_COUNT,
  type ReportClipField,
  type ReportConfirmations,
  type ReportFormErrors,
  type ReportFormState,
} from "@/features/reports/report-form";
import {
  compressReportImages,
  validateReportImageFiles,
} from "@/features/reports/report-image";
import type {
  ReportOptions,
  ReportTagOption,
  UserReportType,
} from "@/features/reports/report-options";
import type { ReportParticipantSearchResult } from "@/features/reports/search-report-participants";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { reportMutations } from "@/queries/report-mutations";
import { reportQueries } from "@/queries/report-queries";
import { timelineQueries } from "@/queries/timeline-queries";
import { cn } from "@/utils/cn";

interface ReportDialogProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
  today: string;
}

type SubmissionStep = "idle" | "processing" | "uploading" | "submitting";

const REPORT_TYPES: {
  description: string;
  label: string;
  value: UserReportType;
}[] = [
  {
    description: "타임라인에 기록할 사건과 일상",
    label: "타임라인 제보",
    value: "timeline",
  },
  { description: "서비스에서 발견한 문제", label: "오류 제보", value: "bug" },
  { description: "서비스 개선 아이디어", label: "아이디어", value: "idea" },
];

const CONFIRMATIONS: {
  id: keyof ReportConfirmations;
  label: string;
  timelineOnly?: boolean;
}[] = [
  {
    id: "isNotDuplicate",
    label: "동일하거나 매우 유사한 제보가 없는지 확인했습니다.",
    timelineOnly: true,
  },
  {
    id: "isRespectful",
    label: "사실에 기반해 타인을 존중하는 표현으로 작성했습니다.",
  },
  {
    id: "canUseAsRecord",
    label: "제보한 내용이 봉누도의 기록으로 활용되는 것에 동의합니다.",
  },
];

export function ReportDialog({ onClose, onSuccess, today }: ReportDialogProps) {
  const [form, setForm] = useState(() => createInitialReportForm(today));
  const [fieldErrors, setFieldErrors] = useState<ReportFormErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionStep, setSubmissionStep] = useState<SubmissionStep>("idle");
  const [isDirty, setIsDirty] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const optionsQuery = useQuery(reportQueries.options());
  const mutation = useMutation(reportMutations.create());
  const queryClient = useQueryClient();
  const isPending = submissionStep !== "idle";
  const draft = getActiveReportDraft(form);
  const confirmations = form.confirmations[form.reportType];
  const visibleConfirmations = CONFIRMATIONS.filter(
    (confirmation) =>
      !confirmation.timelineOnly || form.reportType === "timeline",
  );

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
    setForm(createInitialReportForm(today));
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

      if (form.reportType === "timeline") {
        await queryClient.invalidateQueries({ queryKey: timelineQueries.lists() });
      }

      onSuccess(
        form.reportType === "timeline"
          ? "제보가 등록되어 타임라인에 반영되었습니다."
          : "제보가 접수되었습니다.",
      );
      setIsDirty(false);
      setForm(createInitialReportForm(today));
      onClose();
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
          <DialogPrimitive.Popup
            className={cn(
              "fixed top-1/2 left-1/2 z-modal flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-default bg-surface-raised shadow-2xl outline-none sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)]",
              form.reportType === "timeline" ? "max-w-6xl" : "max-w-4xl",
            )}
          >
            <header className="flex shrink-0 items-start gap-3 border-b border-default bg-surface-muted px-5 py-3.5 sm:px-6">
              <span className="min-w-0 flex-1">
                <DialogPrimitive.Title className="block text-title-sm font-bold text-primary">
                  제보하기
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-0.5 block text-body-sm text-secondary">
                  목격한 이야기와 서비스에 대한 의견을 기록해주세요.
                </DialogPrimitive.Description>
              </span>
              <Button
                aria-label="제보 모달 닫기"
                disabled={isPending}
                onClick={requestClose}
                size="icon-sm"
                variant="ghost"
              >
                <X aria-hidden="true" />
              </Button>
            </header>

            <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
              <div
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto p-5 sm:p-6",
                  form.reportType === "timeline"
                    ? "grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.8fr)]"
                    : "grid gap-5",
                )}
              >
                <div className="min-w-0 space-y-4">
                  <fieldset className="space-y-2">
                    <legend className="text-caption font-semibold text-secondary">
                      제보 유형
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {REPORT_TYPES.map((reportType) => (
                        <button
                          aria-pressed={form.reportType === reportType.value}
                          className="cursor-pointer rounded-lg border border-default bg-background p-3 text-left transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring aria-pressed:border-brand aria-pressed:bg-surface-selected"
                          key={reportType.value}
                          onClick={() => handleTypeChange(reportType.value)}
                          type="button"
                        >
                          <strong className="block text-body-sm text-primary">
                            {reportType.label}
                          </strong>
                          <span className="mt-1 block text-caption text-tertiary">
                            {reportType.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div
                    className={
                      form.reportType === "timeline"
                        ? "grid gap-4 sm:grid-cols-2"
                        : "grid gap-4"
                    }
                  >
                    <FieldLabel error={fieldErrors.categoryId} label="분류" required>
                      <CategorySelect
                        onChange={(categoryId) => {
                          updateDraft({ categoryId });
                          setFieldErrors((current) => ({
                            ...current,
                            categoryId: undefined,
                          }));
                        }}
                        options={optionsQuery.data}
                        reportType={form.reportType}
                        value={draft.categoryId}
                      />
                    </FieldLabel>
                    {form.reportType === "timeline" ? (
                      <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2">
                        <FieldLabel error={fieldErrors.occurredAt} label="발생 날짜" required>
                          <PickerInput
                            aria-invalid={Boolean(fieldErrors.occurredAt)}
                            max={today}
                            onChange={(changeEvent) => {
                              updateForm({ occurredDate: changeEvent.target.value });
                              setFieldErrors((current) => ({
                                ...current,
                                occurredAt: undefined,
                              }));
                            }}
                            required
                            type="date"
                            value={form.occurredDate}
                          />
                        </FieldLabel>
                        <FieldLabel label="시간" required>
                          <PickerInput
                            aria-invalid={Boolean(fieldErrors.occurredAt)}
                            onChange={(changeEvent) => {
                              updateForm({ occurredTime: changeEvent.target.value });
                              setFieldErrors((current) => ({
                                ...current,
                                occurredAt: undefined,
                              }));
                            }}
                            required
                            type="time"
                            value={form.occurredTime}
                          />
                        </FieldLabel>
                      </div>
                    ) : null}
                  </div>

                  <FieldLabel error={fieldErrors.title} label="제목" required>
                    <Input
                      aria-invalid={Boolean(fieldErrors.title)}
                      maxLength={100}
                      onChange={(changeEvent) => {
                        updateDraft({ title: changeEvent.target.value });
                        setFieldErrors((current) => ({
                          ...current,
                          title: undefined,
                        }));
                      }}
                      placeholder={getTitlePlaceholder(form.reportType)}
                      required
                      value={draft.title}
                    />
                    <CharacterCount current={draft.title.length} max={100} />
                  </FieldLabel>

                  <FieldLabel error={fieldErrors.content} label="내용" required>
                    <Textarea
                      aria-invalid={Boolean(fieldErrors.content)}
                      maxLength={200}
                      onChange={(changeEvent) => {
                        updateDraft({ content: changeEvent.target.value });
                        setFieldErrors((current) => ({
                          ...current,
                          content: undefined,
                        }));
                      }}
                      placeholder={getContentPlaceholder(form.reportType)}
                      required
                      value={draft.content}
                    />
                    <CharacterCount current={draft.content.length} max={200} />
                  </FieldLabel>

                  {form.reportType === "timeline" ? (
                    <>
                      <ParticipantPicker
                        onChange={(participants) => updateForm({ participants })}
                        participants={form.participants}
                      />
                      <TagPicker
                        isError={optionsQuery.isError}
                        isLoading={optionsQuery.isPending}
                        onChange={(tagIds) => updateForm({ tagIds })}
                        options={optionsQuery.data}
                        tagIds={form.tagIds}
                      />
                    </>
                  ) : null}
                </div>

                <aside
                  className={cn(
                    "min-w-0 space-y-4",
                    form.reportType === "timeline" &&
                      "rounded-lg bg-surface-inset p-4 lg:p-5",
                  )}
                >
                  <ImageUploader
                    error={fieldErrors.images}
                    files={form.files}
                    onChange={(files) => {
                      updateForm({ files });
                      setFieldErrors((current) => ({
                        ...current,
                        images: undefined,
                      }));
                    }}
                    onError={(images) =>
                      setFieldErrors((current) => ({ ...current, images }))
                    }
                  />
                  {form.reportType === "timeline" ? (
                    <ClipFields
                      errors={fieldErrors.clips}
                      onChange={(clipFields) => {
                        updateForm({ clipFields });
                        setFieldErrors((current) => ({
                          ...current,
                          clips: undefined,
                        }));
                      }}
                      values={form.clipFields}
                    />
                  ) : null}
                  {form.reportType === "timeline" ? (
                    <div className="rounded-lg bg-surface-selected p-3 text-caption leading-relaxed text-primary">
                      <p>등록한 제보는 타임라인에 바로 반영됩니다.</p>
                      <p>같은 사건이나 내용이 이미 등록되어 있지 않은지 먼저 확인해주세요.</p>
                      <p>개인정보나 민감한 정보가 포함되지 않았는지 확인해주세요.</p>
                    </div>
                  ) : null}
                </aside>
              </div>

              <footer className="shrink-0 border-t border-default bg-surface-muted px-5 py-3.5 sm:px-6">
                <ConfirmationFields
                  confirmations={confirmations}
                  error={fieldErrors.confirmations}
                  onChange={updateConfirmations}
                  visibleConfirmations={visibleConfirmations}
                />
                {optionsQuery.isError ? (
                  <p className="mt-2 text-caption text-status-danger" role="alert">
                    제보 선택 항목을 불러오지 못했습니다.
                  </p>
                ) : null}
                {submissionError ? (
                  <p className="mt-2 text-caption text-status-danger" role="alert">
                    {submissionError}
                  </p>
                ) : null}
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    disabled={isPending}
                    onClick={requestClose}
                    type="button"
                    variant="outline"
                  >
                    취소
                  </Button>
                  <Button
                    disabled={
                      isPending ||
                      optionsQuery.isPending ||
                      optionsQuery.isError ||
                      !isReportFormReady(form)
                    }
                    type="submit"
                  >
                    <Send aria-hidden="true" />
                    {getSubmissionLabel(submissionStep)}
                  </Button>
                </div>
              </footer>
            </form>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <DiscardReportDialog
        isOpen={isDiscardDialogOpen}
        onCancel={() => setIsDiscardDialogOpen(false)}
        onDiscard={finishClose}
      />
    </>
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
    <div className="grid gap-1.5 text-caption font-semibold text-secondary">
      <span>
        {label}
        {required ? <span className="ml-1 text-status-danger">*</span> : null}
      </span>
      {children}
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

function FieldError({ children }: { children: string }) {
  return (
    <span className="font-normal text-status-danger" role="alert">
      {children}
    </span>
  );
}

function CharacterCount({ current, max }: { current: number; max: number }) {
  return (
    <span className="text-right font-normal text-tertiary">
      {current}/{max}
    </span>
  );
}

function CategorySelect({
  onChange,
  options,
  reportType,
  value,
}: {
  onChange: (value: string) => void;
  options: ReportOptions | undefined;
  reportType: UserReportType;
  value: string;
}) {
  const categoryOptions = [
    { label: "분류를 선택해주세요.", value: "" },
    ...(options?.categories ?? [])
      .filter((category) => category.reportType === reportType)
      .map((category) => ({ label: category.name, value: category.id })),
  ];

  return (
    <Select
      className="w-full"
      label="제보 분류"
      onValueChange={onChange}
      options={categoryOptions}
      value={value}
    />
  );
}

function ParticipantPicker({
  onChange,
  participants,
}: {
  onChange: (participants: ReportParticipantSearchResult[]) => void;
  participants: ReportParticipantSearchResult[];
}) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const searchQuery = useQuery(reportQueries.participantSearch(debouncedQuery));
  const selectedIds = new Set(
    participants.map((participant) => participant.seasonParticipantId),
  );
  const results = (searchQuery.data ?? []).filter(
    (participant) => !selectedIds.has(participant.seasonParticipantId),
  );

  return (
    <fieldset className="space-y-2">
      <legend className="text-caption font-semibold text-secondary">
        관련 인물 <span className="font-normal text-tertiary">(선택)</span>
      </legend>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tertiary"
        />
        <Input
          className="pl-9"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="RP명 또는 스트리머명을 검색하세요."
          value={query}
        />
      </div>
      {participants.length > 0 ? (
        <ul aria-label="선택한 관련 인물" className="flex flex-wrap gap-2">
          {participants.map((participant, index) => (
            <li
              className="inline-flex items-center gap-2 rounded-full bg-surface-muted py-1 pr-2 pl-1"
              key={participant.seasonParticipantId}
            >
              <CharacterAvatar
                className="size-7 rounded-full"
                name={participant.rpName ?? participant.streamerName}
                profileImageUrl={null}
                sizes="28px"
              />
              <span className="text-caption text-primary">
                {participant.rpName ?? participant.streamerName}
                {index === 0 ? " · 대표 인물" : ""}
              </span>
              <button
                aria-label={`${participant.rpName ?? participant.streamerName} 선택 해제`}
                className="cursor-pointer rounded-full text-tertiary hover:text-primary focus-visible:outline-2 focus-visible:outline-focus-ring"
                onClick={() =>
                  onChange(
                    participants.filter(
                      (item) =>
                        item.seasonParticipantId !== participant.seasonParticipantId,
                    ),
                  )
                }
                type="button"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {!query.trim() ? (
        <p className="text-caption text-tertiary">
          검색어를 입력하면 현재 시즌의 RP와 스트리머를 찾을 수 있습니다.
        </p>
      ) : (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-default bg-background p-1">
          {searchQuery.isPending ? (
            <p className="p-3 text-caption text-tertiary" role="status">
              인물을 검색하고 있습니다.
            </p>
          ) : searchQuery.isError ? (
            <p className="p-3 text-caption text-status-danger" role="alert">
              인물 검색 결과를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
            </p>
          ) : results.length > 0 ? (
            results.map((participant) => (
              <button
                className="flex w-full cursor-pointer items-center gap-3 rounded-md p-2 text-left hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-focus-ring"
                key={participant.seasonParticipantId}
                onClick={() => {
                  onChange([...participants, participant]);
                  setQuery("");
                }}
                type="button"
              >
                <CharacterAvatar
                  className="size-8 rounded-full"
                  name={participant.rpName ?? participant.streamerName}
                  profileImageUrl={null}
                  sizes="32px"
                />
                <span className="min-w-0">
                  <strong className="block truncate text-body-sm text-primary">
                    {participant.rpName ?? "RP명 없음"}
                  </strong>
                  <span className="block truncate text-caption text-tertiary">
                    {getParticipantDescription(participant)}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <p className="p-3 text-caption text-tertiary">
              일치하는 인물이 없습니다. RP명과 스트리머명을 다시 확인해주세요.
            </p>
          )}
        </div>
      )}
      <p className="text-caption text-tertiary">
        가장 먼저 추가한 인물이 대표 인물로 설정됩니다.
      </p>
    </fieldset>
  );
}

function getParticipantDescription(
  participant: ReportParticipantSearchResult,
): string {
  const affiliation = [participant.organizationName, participant.role]
    .filter(Boolean)
    .join(" · ");
  return affiliation
    ? `${affiliation} · 스트리머 ${participant.streamerName}`
    : `스트리머 ${participant.streamerName}`;
}

function TagPicker({
  isError,
  isLoading,
  onChange,
  options,
  tagIds,
}: {
  isError: boolean;
  isLoading: boolean;
  onChange: (tagIds: string[]) => void;
  options: ReportOptions | undefined;
  tagIds: string[];
}) {
  const [query, setQuery] = useState("");
  const tags = options?.tags ?? [];
  const selectedTags = tagIds.flatMap((tagId) => {
    const tag = tags.find((candidate) => candidate.id === tagId);
    return tag ? [tag] : [];
  });
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  const resultTags = tags
    .filter((tag) => !tagIds.includes(tag.id))
    .filter(
      (tag) =>
        !normalizedQuery ||
        tag.name.toLocaleLowerCase("ko-KR").includes(normalizedQuery) ||
        tag.slug.toLocaleLowerCase("ko-KR").includes(normalizedQuery),
    )
    .slice(0, 12);

  return (
    <fieldset className="space-y-2">
      <legend className="text-caption font-semibold text-secondary">
        태그 <span className="font-normal text-tertiary">(선택)</span>
      </legend>
      {selectedTags.length > 0 ? (
        <ul aria-label="선택한 태그" className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <li key={tag.id}>
              <TagButton
                isSelected
                onClick={() => onChange(tagIds.filter((id) => id !== tag.id))}
                tag={tag}
              />
            </li>
          ))}
        </ul>
      ) : null}
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tertiary"
        />
        <Input
          className="pl-9"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="태그 이름을 검색하세요."
          value={query}
        />
      </div>
      {isLoading ? (
        <p className="text-caption text-tertiary" role="status">
          태그를 불러오고 있습니다.
        </p>
      ) : isError ? (
        <p className="text-caption text-status-danger" role="alert">
          태그를 불러오지 못했습니다.
        </p>
      ) : (
        <div>
          <p className="mb-2 text-caption text-tertiary">
            {normalizedQuery ? "검색 결과" : "추천 태그"}
          </p>
          {resultTags.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {resultTags.map((tag) => (
                <li key={tag.id}>
                  <TagButton
                    onClick={() => {
                      onChange([...tagIds, tag.id]);
                      setQuery("");
                    }}
                    tag={tag}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-caption text-tertiary">일치하는 태그가 없습니다.</p>
          )}
        </div>
      )}
    </fieldset>
  );
}

function TagButton({
  isSelected = false,
  onClick,
  tag,
}: {
  isSelected?: boolean;
  onClick: () => void;
  tag: ReportTagOption;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-default bg-background px-3 py-1.5 text-caption text-secondary hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring aria-pressed:border-brand aria-pressed:bg-surface-selected aria-pressed:text-brand-text"
      onClick={onClick}
      type="button"
    >
      #{tag.name}
      {isSelected ? <X aria-hidden="true" className="size-3" /> : null}
    </button>
  );
}

function ImageUploader({
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
        nextError instanceof Error
          ? nextError.message
          : "이미지를 확인해주세요.",
      );
    }
  }

  return (
    <fieldset className="space-y-3">
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
        className="grid min-h-28 cursor-pointer place-items-center rounded-lg border border-dashed border-control bg-background p-4 text-center hover:border-brand focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring"
        htmlFor={inputId}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }}
      >
        <span className="space-y-2">
          <UploadCloud
            aria-hidden="true"
            className="mx-auto size-7 text-brand-text"
          />
          <strong className="block text-body-sm text-primary">
            이미지를 드래그하거나 클릭해 선택하세요.
          </strong>
          <span className="block text-caption text-tertiary">
            JPG, PNG, WEBP · 파일당 10MB 이하
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
      {error ? <FieldError>{error}</FieldError> : null}
      <ImagePreviews
        files={files}
        onRemove={(index) =>
          onChange(files.filter((_, fileIndex) => fileIndex !== index))
        }
      />
    </fieldset>
  );
}

function ImagePreviews({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (index: number) => void;
}) {
  return (
    <ul className="grid grid-cols-3 gap-2">
      {files.map((file, index) => (
        <ImagePreview
          file={file}
          index={index}
          key={`${file.name}-${file.size}-${file.lastModified}`}
          onRemove={onRemove}
        />
      ))}
    </ul>
  );
}

function ImagePreview({
  file,
  index,
  onRemove,
}: {
  file: File;
  index: number;
  onRemove: (index: number) => void;
}) {
  const [url] = useState(() => URL.createObjectURL(file));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <li className="group relative aspect-square overflow-hidden rounded-lg border border-default">
      <Image
        fill
        alt={`첨부 이미지 ${index + 1} 미리보기`}
        className="object-cover"
        sizes="120px"
        src={url}
      />
      <button
        aria-label={`첨부 이미지 ${index + 1} 삭제`}
        className="absolute top-1 right-1 grid size-7 cursor-pointer place-items-center rounded-full bg-black/70 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        onClick={() => onRemove(index)}
        type="button"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </li>
  );
}

function ClipFields({
  errors,
  onChange,
  values,
}: {
  errors?: Record<string, string>;
  onChange: (values: ReportClipField[]) => void;
  values: ReportClipField[];
}) {
  function removeField(field: ReportClipField, index: number): void {
    if (index === 0) {
      onChange(
        values.map((candidate) =>
          candidate.id === field.id ? { ...candidate, value: "" } : candidate,
        ),
      );
      return;
    }
    onChange(values.filter((candidate) => candidate.id !== field.id));
  }

  return (
    <fieldset className="space-y-3 border-t border-default pt-4">
      <legend className="text-body-sm font-semibold text-primary">
        <span className="inline-flex items-center gap-2">
          <LinkIcon aria-hidden="true" className="size-4 text-brand-text" />
          CHZZK 클립
          <span className="font-normal text-tertiary">
            {values.length}/{MAX_REPORT_CLIP_COUNT}
          </span>
        </span>
      </legend>
      <div className="space-y-2">
        {values.map((field, index) => (
          <div key={field.id}>
            <div className="flex gap-2">
              <Input
                aria-invalid={Boolean(errors?.[field.id])}
                aria-label={`클립 URL ${index + 1}`}
                onChange={(event) =>
                  onChange(
                    values.map((candidate) =>
                      candidate.id === field.id
                        ? { ...candidate, value: event.target.value }
                        : candidate,
                    ),
                  )
                }
                placeholder="https://chzzk.naver.com/clips/..."
                type="url"
                value={field.value}
              />
              <Button
                aria-label={`클립 URL ${index + 1} ${index === 0 ? "지우기" : "삭제"}`}
                disabled={index === 0 && !field.value}
                onClick={() => removeField(field, index)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            {errors?.[field.id] ? <FieldError>{errors[field.id]}</FieldError> : null}
          </div>
        ))}
      </div>
      <Button
        disabled={values.length >= MAX_REPORT_CLIP_COUNT}
        onClick={() =>
          onChange([
            ...values,
            { id: crypto.randomUUID(), value: "" },
          ])
        }
        size="sm"
        type="button"
        variant="outline"
      >
        <Plus aria-hidden="true" />
        클립 추가
      </Button>
      <p className="text-caption text-tertiary">
        CHZZK 공식 클립 주소만 등록할 수 있습니다.
      </p>
    </fieldset>
  );
}

function ConfirmationFields({
  confirmations,
  error,
  onChange,
  visibleConfirmations,
}: {
  confirmations: ReportConfirmations;
  error?: string;
  onChange: (update: Partial<ReportConfirmations>) => void;
  visibleConfirmations: typeof CONFIRMATIONS;
}) {
  const isAllChecked = visibleConfirmations.every(
    (confirmation) => confirmations[confirmation.id],
  );
  const isPartiallyChecked = visibleConfirmations.some(
    (confirmation) => confirmations[confirmation.id],
  );

  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">제출 전 확인</legend>
      <label className="flex cursor-pointer items-start gap-2 text-caption font-semibold text-primary">
        <input
          checked={isAllChecked}
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand"
          onChange={() => {
            const nextValue = !isAllChecked;
            onChange(
              Object.fromEntries(
                visibleConfirmations.map((confirmation) => [
                  confirmation.id,
                  nextValue,
                ]),
              ),
            );
          }}
          ref={(node) => {
            if (node) node.indeterminate = !isAllChecked && isPartiallyChecked;
          }}
          type="checkbox"
        />
        모두 동의합니다.
      </label>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visibleConfirmations.map((confirmation) => (
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
              type="checkbox"
            />
            {confirmation.label}
          </label>
        ))}
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
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
  return (
    <AlertDialogPrimitive.Root onOpenChange={(open) => !open && onCancel()} open={isOpen}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Backdrop className="fixed inset-0 z-popover bg-black/60" />
        <AlertDialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-popover w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-default bg-surface-raised p-5 shadow-2xl outline-none">
          <AlertDialogPrimitive.Title className="text-title-sm font-bold text-primary">
            작성 중인 내용을 버릴까요?
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-2 text-body-sm text-secondary">
            저장하지 않은 제보 내용은 복구할 수 없습니다.
          </AlertDialogPrimitive.Description>
          <div className="mt-5 flex justify-end gap-2">
            <Button autoFocus onClick={onCancel} type="button" variant="outline">
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
  if (reportType === "bug")
    return "어떤 오류인지 한눈에 알 수 있는 제목을 입력해주세요.";
  if (reportType === "idea") return "개선 아이디어를 간단히 요약해주세요.";
  return "어떤 일이 있었나요? 한눈에 알 수 있는 제목을 입력해주세요.";
}

function getContentPlaceholder(reportType: UserReportType): string {
  if (reportType === "bug")
    return "오류가 발생한 상황과 재현 방법을 작성해주세요.";
  if (reportType === "idea")
    return "개선되었으면 하는 점과 기대 효과를 작성해주세요.";
  return "등장 인물, 상황, 장소 등 자세한 내용을 작성해주세요.";
}

function getSubmissionLabel(step: SubmissionStep): string {
  if (step === "processing") return "이미지 처리 중...";
  if (step === "uploading") return "이미지 업로드 중...";
  if (step === "submitting") return "제보 등록 중...";
  return "제보하기";
}
