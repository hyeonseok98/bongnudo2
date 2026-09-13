"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { reportMutations } from "@/queries/report-mutations";
import { reportQueries } from "@/queries/report-queries";

interface ReportEntryButtonProps {
  isAuthenticated: boolean;
  today: string;
}

const CONFIRMATIONS = [
  {
    id: "isNotDuplicate",
    label: "동일하거나 매우 유사한 제보가 없는지 확인했습니다.",
  },
  {
    id: "isRespectful",
    label: "사실에 기반해 타인을 존중하는 표현으로 작성했습니다.",
  },
  {
    id: "canUseAsRecord",
    label: "검토 후 타임라인 기록으로 활용될 수 있음에 동의합니다.",
  },
] as const;

type ConfirmationId = (typeof CONFIRMATIONS)[number]["id"];
type Confirmations = Record<ConfirmationId, boolean>;

const INITIAL_CONFIRMATIONS: Confirmations = {
  isNotDuplicate: false,
  isRespectful: false,
  canUseAsRecord: false,
};

export function ReportEntryButton({
  isAuthenticated,
  today,
}: ReportEntryButtonProps) {
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const router = useRouter();

  function handleOpen(): void {
    if (isAuthenticated) {
      setIsReportDialogOpen(true);
      return;
    }

    setIsLoginDialogOpen(true);
  }

  function handleLogin(): void {
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return (
    <>
      <Button onClick={handleOpen}>제보하기</Button>

      <LoginConfirmationDialog
        isOpen={isLoginDialogOpen}
        onLogin={handleLogin}
        onOpenChange={setIsLoginDialogOpen}
      />
      <TimelineReportDialog
        isOpen={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        today={today}
      />
    </>
  );
}

function LoginConfirmationDialog({
  isOpen,
  onLogin,
  onOpenChange,
}: {
  isOpen: boolean;
  onLogin: () => void;
  onOpenChange: (isOpen: boolean) => void;
}) {
  return (
    <DialogPrimitive.Root onOpenChange={onOpenChange} open={isOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-modal bg-black/60 transition-opacity duration-default data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <DialogPrimitive.Popup
          className="fixed top-1/2 left-1/2 z-modal w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-default bg-surface-raised p-5 shadow-2xl outline-none transition-[transform,opacity] duration-default data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none"
          finalFocus
        >
          <DialogPrimitive.Title className="text-body font-semibold text-primary">
            로그인이 필요합니다
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-2 text-body-sm text-secondary">
            제보를 작성하려면 로그인해야 합니다. 로그인 페이지로 이동하시겠습니까?
          </DialogPrimitive.Description>
          <div className="mt-5 flex justify-end gap-2">
            <DialogPrimitive.Close
              render={<Button variant="outline" />}
            >
              취소
            </DialogPrimitive.Close>
            <Button onClick={onLogin}>로그인으로 이동</Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function TimelineReportDialog({
  isOpen,
  onOpenChange,
  today,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  today: string;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [content, setContent] = useState("");
  const [confirmations, setConfirmations] =
    useState<Confirmations>(INITIAL_CONFIRMATIONS);
  const [occurredAt, setOccurredAt] = useState(`${today}T12:00`);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const categoriesQuery = useQuery({
    ...reportQueries.categories(),
    enabled: isOpen,
  });
  const createReportMutation = useMutation(reportMutations.create());
  const hasConfirmedAll = Object.values(confirmations).every(Boolean);

  function resetForm(): void {
    setCategoryId("");
    setContent("");
    setConfirmations(INITIAL_CONFIRMATIONS);
    setOccurredAt(`${today}T12:00`);
    setSubmissionError(null);
    setTitle("");
    createReportMutation.reset();
  }

  function handleOpenChange(nextIsOpen: boolean): void {
    onOpenChange(nextIsOpen);

    if (!nextIsOpen) {
      resetForm();
    }
  }

  function handleConfirmationChange(id: ConfirmationId): void {
    setConfirmations((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSubmissionError(null);

    if (!categoryId) {
      setSubmissionError("분류를 선택해주세요.");
      return;
    }

    if (
      !confirmations.isNotDuplicate ||
      !confirmations.isRespectful ||
      !confirmations.canUseAsRecord
    ) {
      setSubmissionError("필수 확인 항목에 동의해주세요.");
      return;
    }

    createReportMutation.mutate(
      {
        categoryId,
        clipUrls: [],
        confirmations: {
          isNotDuplicate: true,
          isRespectful: true,
          canUseAsRecord: true,
        },
        content,
        imageObjectKeys: [],
        occurredAt,
        participantIds: [],
        reportType: "timeline",
        tagIds: [],
        title,
      },
      {
        onError: (error) => {
          setSubmissionError(
            error instanceof Error
              ? error.message
              : "제보를 저장하지 못했습니다.",
          );
        },
      },
    );
  }

  const categoryOptions = [
    { label: "분류 선택", value: "" },
    ...(categoriesQuery.data ?? []).map((category) => ({
      label: category.name,
      value: category.id,
    })),
  ];

  return (
    <DialogPrimitive.Root onOpenChange={handleOpenChange} open={isOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-modal bg-black/60 transition-opacity duration-default data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <DialogPrimitive.Popup
          className="fixed top-1/2 left-1/2 z-modal flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-default bg-surface-raised shadow-2xl outline-none transition-[transform,opacity] duration-default data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none"
          finalFocus
        >
          <header className="flex items-start gap-3 border-b border-default px-5 py-4">
            <span className="min-w-0 flex-1">
              <DialogPrimitive.Title className="block text-body font-semibold text-primary">
                타임라인 제보하기
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 block text-caption text-secondary">
                검토 후 타임라인 기록으로 반영될 수 있습니다.
              </DialogPrimitive.Description>
            </span>
            <DialogPrimitive.Close
              render={
                <Button aria-label="제보 모달 닫기" size="icon-sm" variant="ghost" />
              }
            >
              <X aria-hidden="true" />
            </DialogPrimitive.Close>
          </header>

          <form
            className="min-h-0 space-y-5 overflow-y-auto px-5 py-4"
            onSubmit={handleSubmit}
          >
            {createReportMutation.isSuccess ? (
              <div className="rounded-lg border border-brand/40 bg-surface-muted p-4">
                <p className="text-body-sm font-semibold text-primary">
                  제보가 접수되었습니다.
                </p>
                <p className="mt-1 text-caption text-secondary">
                  검토 결과에 따라 타임라인에 반영됩니다.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-caption font-semibold text-secondary">
                    분류
                    <Select
                      className="w-full"
                      disabled={categoriesQuery.isPending || categoriesQuery.isError}
                      label="제보 분류"
                      onValueChange={setCategoryId}
                      options={categoryOptions}
                      value={categoryId}
                    />
                  </label>
                  <label className="grid gap-1.5 text-caption font-semibold text-secondary">
                    발생 시간
                    <Input
                      max={today + "T23:59"}
                      onChange={(event) => setOccurredAt(event.target.value)}
                      required
                      type="datetime-local"
                      value={occurredAt}
                    />
                  </label>
                </div>

                {categoriesQuery.isError ? (
                  <p className="text-caption text-status-danger" role="alert">
                    제보 분류를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                  </p>
                ) : null}

                <label className="grid gap-1.5 text-caption font-semibold text-secondary">
                  제목
                  <Input
                    maxLength={100}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="제보 내용을 요약해주세요."
                    required
                    value={title}
                  />
                </label>

                <label className="grid gap-1.5 text-caption font-semibold text-secondary">
                  내용
                  <textarea
                    className="min-h-32 w-full resize-y rounded-lg border border-control bg-background px-3 py-2.5 text-body-sm text-primary outline-none transition-[background-color,border-color] duration-default placeholder:text-tertiary hover:bg-surface-muted focus-visible:border-focus-ring motion-reduce:transition-none"
                    maxLength={200}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="언제, 어디서, 어떤 일이 있었는지 작성해주세요."
                    required
                    value={content}
                  />
                  <span className="text-right font-normal text-tertiary">
                    {content.length}/200
                  </span>
                </label>

                <fieldset className="space-y-2 rounded-lg border border-default bg-surface-inset p-3">
                  <legend className="px-1 text-caption font-semibold text-secondary">
                    제출 전 확인
                  </legend>
                  {CONFIRMATIONS.map((confirmation) => (
                    <label
                      className="flex cursor-pointer items-start gap-2 text-caption text-primary"
                      key={confirmation.id}
                    >
                      <input
                        checked={confirmations[confirmation.id]}
                        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand"
                        onChange={() => handleConfirmationChange(confirmation.id)}
                        type="checkbox"
                      />
                      {confirmation.label}
                    </label>
                  ))}
                </fieldset>

                {submissionError ? (
                  <p className="text-caption text-status-danger" role="alert">
                    {submissionError}
                  </p>
                ) : null}

                <div className="flex justify-end gap-2 border-t border-default pt-4">
                  <DialogPrimitive.Close
                    render={<Button type="button" variant="outline" />}
                  >
                    취소
                  </DialogPrimitive.Close>
                  <Button
                    disabled={
                      !hasConfirmedAll ||
                      createReportMutation.isPending ||
                      categoriesQuery.isPending ||
                      categoriesQuery.isError
                    }
                    type="submit"
                  >
                    {createReportMutation.isPending ? "제출 중..." : "제보 제출"}
                  </Button>
                </div>
              </>
            )}

            {createReportMutation.isSuccess ? (
              <div className="flex justify-end border-t border-default pt-4">
                <DialogPrimitive.Close render={<Button type="button" />}>
                  확인
                </DialogPrimitive.Close>
              </div>
            ) : null}
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
