"use client";

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

import { CharacterAvatar } from "@/app/characters/_components/character-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ReportParticipantSearchResult } from "@/features/reports/search-report-participants";
import {
  buildReportRequest,
  createInitialReportForm,
  MAX_REPORT_CLIP_COUNT,
  MAX_REPORT_IMAGE_COUNT,
  type ReportConfirmations,
  type ReportFormState,
  validateReportForm,
} from "@/features/reports/report-form";
import { compressReportImages, validateReportImageFiles } from "@/features/reports/report-image";
import type { ReportOptions, UserReportType } from "@/features/reports/report-options";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { reportMutations } from "@/queries/report-mutations";
import { reportQueries } from "@/queries/report-queries";
import { timelineQueries } from "@/queries/timeline-queries";
import { uploadReportImages } from "@/apis/reports/report-uploads";

interface ReportDialogProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
  today: string;
}

type SubmissionStep = "idle" | "processing" | "uploading" | "submitting";

const REPORT_TYPES: { description: string; label: string; value: UserReportType }[] = [
  { description: "타임라인에 기록할 사건과 일상", label: "타임라인 제보", value: "timeline" },
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
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionStep, setSubmissionStep] = useState<SubmissionStep>("idle");
  const optionsQuery = useQuery(reportQueries.options());
  const mutation = useMutation(reportMutations.create());
  const queryClient = useQueryClient();
  const isPending = submissionStep !== "idle";

  function updateForm(update: Partial<ReportFormState>): void {
    setForm((current) => ({ ...current, ...update }));
  }

  function handleTypeChange(reportType: UserReportType): void {
    updateForm({ categoryId: "", reportType });
    setSubmissionError(null);
  }

  function handleClose(): void {
    if (isPending) return;
    setForm(createInitialReportForm(today));
    setSubmissionError(null);
    mutation.reset();
    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const formError = validateReportForm(form);
    if (formError) {
      setSubmissionError(formError);
      return;
    }

    setSubmissionError(null);
    try {
      setSubmissionStep("processing");
      const compressedImages = await compressReportImages(form.files);
      setSubmissionStep("uploading");
      const imageObjectKeys = await uploadReportImages(compressedImages);
      setSubmissionStep("submitting");
      await mutation.mutateAsync(buildReportRequest(form, imageObjectKeys));

      if (form.reportType === "timeline") {
        await queryClient.invalidateQueries({ queryKey: timelineQueries.lists() });
      }

      onSuccess(
        form.reportType === "timeline"
          ? "제보가 등록되어 타임라인에 반영되었습니다."
          : "제보가 접수되었습니다.",
      );
      setForm(createInitialReportForm(today));
      onClose();
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : "제보를 저장하지 못했습니다.",
      );
    } finally {
      setSubmissionStep("idle");
    }
  }

  return (
    <DialogPrimitive.Root
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
      open
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-modal bg-black/70" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-modal flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-default bg-surface-raised shadow-2xl outline-none">
          <header className="flex items-start gap-3 border-b border-default bg-surface-muted px-5 py-4 sm:px-6">
            <span className="min-w-0 flex-1">
              <DialogPrimitive.Title className="block text-title-sm font-bold text-primary">
                제보하기
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 block text-body-sm text-secondary">
                목격한 이야기와 서비스에 대한 의견을 기록해주세요.
              </DialogPrimitive.Description>
            </span>
            <Button aria-label="제보 모달 닫기" disabled={isPending} onClick={handleClose} size="icon-sm" variant="ghost">
              <X aria-hidden="true" />
            </Button>
          </header>

          <form className="min-h-0 overflow-y-auto" onSubmit={handleSubmit}>
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.8fr)]">
              <div className="min-w-0 space-y-5">
                <fieldset className="space-y-2">
                  <legend className="text-caption font-semibold text-secondary">제보 유형</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {REPORT_TYPES.map((reportType) => (
                      <button
                        aria-pressed={form.reportType === reportType.value}
                        className="rounded-lg border border-default bg-background p-3 text-left transition-colors hover:bg-surface-muted aria-pressed:border-brand aria-pressed:bg-surface-selected"
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

                <div className={form.reportType === "timeline" ? "grid gap-4 sm:grid-cols-2" : "grid gap-4"}>
                  <FieldLabel label="분류" required>
                    <CategorySelect
                      options={optionsQuery.data}
                      reportType={form.reportType}
                      value={form.categoryId}
                      onChange={(categoryId) => updateForm({ categoryId })}
                    />
                  </FieldLabel>
                  {form.reportType === "timeline" ? (
                    <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-2">
                      <FieldLabel label="발생 날짜" required>
                        <Input
                          max={today}
                          onChange={(changeEvent) => updateForm({ occurredDate: changeEvent.target.value })}
                          required
                          type="date"
                          value={form.occurredDate}
                        />
                      </FieldLabel>
                      <FieldLabel label="시간" required>
                        <Input
                          onChange={(changeEvent) => updateForm({ occurredTime: changeEvent.target.value })}
                          required
                          type="time"
                          value={form.occurredTime}
                        />
                      </FieldLabel>
                    </div>
                  ) : null}
                </div>

                <FieldLabel label="제목" required>
                  <Input
                    maxLength={100}
                    onChange={(changeEvent) => updateForm({ title: changeEvent.target.value })}
                    placeholder={getTitlePlaceholder(form.reportType)}
                    required
                    value={form.title}
                  />
                  <CharacterCount current={form.title.length} max={100} />
                </FieldLabel>

                <FieldLabel label="내용" required>
                  <Textarea
                    maxLength={200}
                    onChange={(changeEvent) => updateForm({ content: changeEvent.target.value })}
                    placeholder={getContentPlaceholder(form.reportType)}
                    required
                    value={form.content}
                  />
                  <CharacterCount current={form.content.length} max={200} />
                </FieldLabel>

                {form.reportType === "timeline" ? (
                  <>
                    <ParticipantPicker
                      onChange={(participants) => updateForm({ participants })}
                      participants={form.participants}
                    />
                    <TagPicker
                      onChange={(tagIds) => updateForm({ tagIds })}
                      options={optionsQuery.data}
                      tagIds={form.tagIds}
                    />
                  </>
                ) : null}
              </div>

              <aside className="min-w-0 space-y-5 lg:border-l lg:border-default lg:pl-6">
                <ImageUploader
                  files={form.files}
                  onChange={(files) => updateForm({ files })}
                  onError={setSubmissionError}
                />
                {form.reportType === "timeline" ? (
                  <ClipFields
                    onChange={(clipUrls) => updateForm({ clipUrls })}
                    values={form.clipUrls}
                  />
                ) : null}
                {form.reportType === "timeline" ? (
                  <p className="rounded-lg border border-brand/30 bg-surface-selected p-3 text-caption text-secondary">
                    타임라인 제보는 제출 즉시 공개됩니다. 개인정보와 민감한 내용이 포함되지 않았는지 확인해주세요.
                  </p>
                ) : null}
              </aside>
            </div>

            <footer className="border-t border-default bg-surface-muted px-5 py-4 sm:px-6">
              <fieldset className="space-y-2">
                <legend className="sr-only">제출 전 확인</legend>
                {CONFIRMATIONS.filter(
                  (confirmation) => !confirmation.timelineOnly || form.reportType === "timeline",
                ).map((confirmation) => (
                  <label className="flex cursor-pointer items-start gap-2 text-caption text-primary" key={confirmation.id}>
                    <input
                      checked={form.confirmations[confirmation.id]}
                      className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand"
                      onChange={() =>
                        updateForm({
                          confirmations: {
                            ...form.confirmations,
                            [confirmation.id]: !form.confirmations[confirmation.id],
                          },
                        })
                      }
                      type="checkbox"
                    />
                    {confirmation.label}
                  </label>
                ))}
              </fieldset>
              {optionsQuery.isError ? (
                <p className="mt-3 text-caption text-status-danger" role="alert">제보 선택 항목을 불러오지 못했습니다.</p>
              ) : null}
              {submissionError ? (
                <p className="mt-3 text-caption text-status-danger" role="alert">{submissionError}</p>
              ) : null}
              <div className="mt-4 flex justify-end gap-2">
                <Button disabled={isPending} onClick={handleClose} type="button" variant="outline">취소</Button>
                <Button disabled={isPending || optionsQuery.isPending || optionsQuery.isError} type="submit">
                  <Send aria-hidden="true" />
                  {getSubmissionLabel(submissionStep)}
                </Button>
              </div>
            </footer>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function FieldLabel({ children, label, required = false }: { children: React.ReactNode; label: string; required?: boolean }) {
  return (
    <label className="grid gap-1.5 text-caption font-semibold text-secondary">
      <span>{label}{required ? <span className="ml-1 text-status-danger">*</span> : null}</span>
      {children}
    </label>
  );
}

function CharacterCount({ current, max }: { current: number; max: number }) {
  return <span className="text-right font-normal text-tertiary">{current}/{max}</span>;
}

function CategorySelect({ onChange, options, reportType, value }: { onChange: (value: string) => void; options: ReportOptions | undefined; reportType: UserReportType; value: string }) {
  const categoryOptions = [
    { label: "분류를 선택해주세요.", value: "" },
    ...(options?.categories ?? [])
      .filter((category) => category.reportType === reportType)
      .map((category) => ({ label: category.name, value: category.id })),
  ];
  return <Select className="w-full" label="제보 분류" onValueChange={onChange} options={categoryOptions} value={value} />;
}

function ParticipantPicker({ onChange, participants }: { onChange: (participants: ReportParticipantSearchResult[]) => void; participants: ReportParticipantSearchResult[] }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const searchQuery = useQuery(reportQueries.participantSearch(debouncedQuery));
  const selectedIds = new Set(participants.map((participant) => participant.seasonParticipantId));
  const results = (searchQuery.data ?? []).filter((participant) => !selectedIds.has(participant.seasonParticipantId));

  return (
    <fieldset className="space-y-2">
      <legend className="text-caption font-semibold text-secondary">관련 인물 <span className="font-normal text-tertiary">(선택)</span></legend>
      <div className="relative">
        <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tertiary" />
        <Input className="pl-9" onChange={(event) => setQuery(event.target.value)} placeholder="인물의 RP명 또는 스트리머명을 검색하세요." value={query} />
      </div>
      {participants.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {participants.map((participant, index) => (
            <li className="inline-flex items-center gap-2 rounded-full border border-default bg-surface-muted py-1 pr-2 pl-1" key={participant.seasonParticipantId}>
              <CharacterAvatar className="size-7 rounded-full" name={participant.rpName ?? participant.streamerName} profileImageUrl={null} sizes="28px" />
              <span className="text-caption text-primary">{participant.rpName ?? participant.streamerName}{index === 0 ? " · 대표" : ""}</span>
              <button aria-label={`${participant.rpName ?? participant.streamerName} 선택 해제`} className="cursor-pointer text-tertiary hover:text-primary" onClick={() => onChange(participants.filter((item) => item.seasonParticipantId !== participant.seasonParticipantId))} type="button"><X aria-hidden="true" className="size-3.5" /></button>
            </li>
          ))}
        </ul>
      ) : null}
      {query.trim() ? (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-default bg-background p-1">
          {searchQuery.isPending ? <p className="p-3 text-caption text-tertiary">검색 중입니다.</p> : results.length > 0 ? results.map((participant) => (
            <button className="flex w-full cursor-pointer items-center gap-3 rounded-md p-2 text-left hover:bg-surface-muted" key={participant.seasonParticipantId} onClick={() => { onChange([...participants, participant]); setQuery(""); }} type="button">
              <CharacterAvatar className="size-8 rounded-full" name={participant.rpName ?? participant.streamerName} profileImageUrl={null} sizes="32px" />
              <span className="min-w-0"><strong className="block truncate text-body-sm text-primary">{participant.rpName ?? participant.streamerName}</strong><span className="block truncate text-caption text-tertiary">{participant.organizationName ?? participant.streamerName}{participant.role ? ` · ${participant.role}` : ""}</span></span>
            </button>
          )) : <p className="p-3 text-caption text-tertiary">검색 결과가 없습니다.</p>}
        </div>
      ) : null}
      <p className="text-caption text-tertiary">가장 먼저 추가한 인물이 대표 인물로 설정됩니다.</p>
    </fieldset>
  );
}

function TagPicker({ onChange, options, tagIds }: { onChange: (tagIds: string[]) => void; options: ReportOptions | undefined; tagIds: string[] }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-caption font-semibold text-secondary">태그 <span className="font-normal text-tertiary">(선택)</span></legend>
      <div className="flex flex-wrap gap-2">
        {(options?.tags ?? []).map((tag) => {
          const isSelected = tagIds.includes(tag.id);
          return <button aria-pressed={isSelected} className="cursor-pointer rounded-full border border-default bg-background px-3 py-1.5 text-caption text-secondary hover:bg-surface-muted aria-pressed:border-brand aria-pressed:bg-surface-selected aria-pressed:text-brand-text" key={tag.id} onClick={() => onChange(isSelected ? tagIds.filter((id) => id !== tag.id) : [...tagIds, tag.id])} type="button">#{tag.name}</button>;
        })}
      </div>
    </fieldset>
  );
}

function ImageUploader({ files, onChange, onError }: { files: File[]; onChange: (files: File[]) => void; onError: (message: string | null) => void }) {
  const inputId = useId();

  function addFiles(nextFiles: FileList | File[]): void {
    const uniqueFiles = [...files, ...Array.from(nextFiles)].filter((file, index, all) => all.findIndex((candidate) => candidate.name === file.name && candidate.size === file.size && candidate.lastModified === file.lastModified) === index);
    try {
      validateReportImageFiles(uniqueFiles);
      onChange(uniqueFiles);
      onError(null);
    } catch (error) {
      onError(error instanceof Error ? error.message : "이미지를 확인해주세요.");
    }
  }

  return (
    <fieldset className="space-y-3 rounded-lg border border-default bg-background p-4">
      <legend className="px-1 text-body-sm font-semibold text-primary"><span className="inline-flex items-center gap-2"><FileImage aria-hidden="true" className="size-4 text-brand-text" />이미지 첨부 <span className="font-normal text-tertiary">{files.length}/{MAX_REPORT_IMAGE_COUNT}</span></span></legend>
      <label className="grid min-h-32 cursor-pointer place-items-center rounded-lg border border-dashed border-control bg-surface-muted p-4 text-center hover:border-brand" htmlFor={inputId} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }}>
        <span className="space-y-2"><UploadCloud aria-hidden="true" className="mx-auto size-7 text-brand-text" /><strong className="block text-body-sm text-primary">이미지를 드래그하거나 클릭해 선택하세요.</strong><span className="block text-caption text-tertiary">JPG, PNG, WEBP · 파일당 10MB 이하</span></span>
      </label>
      <input accept="image/jpeg,image/png,image/webp" className="sr-only" id={inputId} multiple onChange={(event) => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; }} type="file" />
      <ImagePreviews files={files} onRemove={(index) => onChange(files.filter((_, fileIndex) => fileIndex !== index))} />
    </fieldset>
  );
}

function ImagePreviews({ files, onRemove }: { files: File[]; onRemove: (index: number) => void }) {
  return <ul className="grid grid-cols-3 gap-2">{files.map((file, index) => <ImagePreview file={file} index={index} key={`${file.name}-${file.size}-${file.lastModified}`} onRemove={onRemove} />)}</ul>;
}

function ImagePreview({ file, index, onRemove }: { file: File; index: number; onRemove: (index: number) => void }) {
  const [url] = useState(() => URL.createObjectURL(file));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <li className="group relative aspect-square overflow-hidden rounded-lg border border-default"><Image alt={`첨부 이미지 ${index + 1} 미리보기`} className="object-cover" fill sizes="120px" src={url} /><button aria-label={`첨부 이미지 ${index + 1} 삭제`} className="absolute top-1 right-1 grid size-7 cursor-pointer place-items-center rounded-full bg-black/70 text-white" onClick={() => onRemove(index)} type="button"><X aria-hidden="true" className="size-4" /></button></li>;
}

function ClipFields({ onChange, values }: { onChange: (values: string[]) => void; values: string[] }) {
  const [fields, setFields] = useState(() => [{ id: "clip-initial", value: values[0] ?? "" }]);

  function updateFields(nextFields: { id: string; value: string }[]): void {
    setFields(nextFields);
    onChange(nextFields.map((field) => field.value));
  }

  return (
    <fieldset className="space-y-3 rounded-lg border border-default bg-background p-4">
      <legend className="px-1 text-body-sm font-semibold text-primary"><span className="inline-flex items-center gap-2"><LinkIcon aria-hidden="true" className="size-4 text-brand-text" />CHZZK 클립 <span className="font-normal text-tertiary">(선택)</span></span></legend>
      {fields.map((field, index) => <div className="flex gap-2" key={field.id}><Input aria-label={`클립 URL ${index + 1}`} onChange={(event) => updateFields(fields.map((item) => item.id === field.id ? { ...item, value: event.target.value } : item))} placeholder="https://chzzk.naver.com/clips/..." type="url" value={field.value} />{fields.length > 1 ? <Button aria-label={`클립 URL ${index + 1} 삭제`} onClick={() => updateFields(fields.filter((item) => item.id !== field.id))} size="icon" type="button" variant="ghost"><X aria-hidden="true" /></Button> : null}</div>)}
      <Button disabled={fields.length >= MAX_REPORT_CLIP_COUNT} onClick={() => updateFields([...fields, { id: crypto.randomUUID(), value: "" }])} size="sm" type="button" variant="outline"><Plus aria-hidden="true" />클립 추가</Button>
      <p className="text-caption text-tertiary">CHZZK 공식 클립 주소만 등록할 수 있습니다. 최대 5개</p>
    </fieldset>
  );
}

function getTitlePlaceholder(reportType: UserReportType): string {
  if (reportType === "bug") return "어떤 오류인지 한눈에 알 수 있는 제목을 입력해주세요.";
  if (reportType === "idea") return "개선 아이디어를 간단히 요약해주세요.";
  return "어떤 일이 있었나요? 한눈에 알 수 있는 제목을 입력해주세요.";
}

function getContentPlaceholder(reportType: UserReportType): string {
  if (reportType === "bug") return "오류가 발생한 상황과 재현 방법을 작성해주세요.";
  if (reportType === "idea") return "개선되었으면 하는 점과 기대 효과를 작성해주세요.";
  return "등장 인물, 상황, 장소 등 자세한 내용을 작성해주세요.";
}

function getSubmissionLabel(step: SubmissionStep): string {
  if (step === "processing") return "이미지 처리 중...";
  if (step === "uploading") return "이미지 업로드 중...";
  if (step === "submitting") return "제보 등록 중...";
  return "제보하기";
}
