"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { MyArchiveListItem, MyArchiveTab } from "@/features/archives/archive";
import { cn } from "@/utils/cn";
import { archiveMutations, archiveQueries } from "@/queries/archive-queries";

import { MyArchiveDeleteDialog } from "./my-archive-delete-dialog";

interface MyArchiveRowProps {
  archive: MyArchiveListItem;
  tab: MyArchiveTab;
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  day: "numeric",
  month: "numeric",
  timeZone: "Asia/Seoul",
  year: "numeric",
});

const editPolicyLabels = {
  owner_only: "소유자만 편집",
  public_edit: "공개 편집",
} as const;

const statusLabels = {
  completed: "완료",
  ongoing: "진행 중",
} as const;

const structureModeLabels = {
  day_based: "일차 기반",
  freeform: "자유 구성",
} as const;

export function MyArchiveRow({ archive, tab }: MyArchiveRowProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const restoreMutation = useMutation(archiveMutations.restore());

  function handleRestore() {
    restoreMutation.mutate(archive.id, {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: archiveQueries.myListKey("deleted") }),
          queryClient.invalidateQueries({ queryKey: archiveQueries.myListKey("owned") }),
          queryClient.invalidateQueries({ queryKey: archiveQueries.detail(archive.id).queryKey }),
          ...(archive.visibility === "public"
            ? [queryClient.invalidateQueries({ queryKey: archiveQueries.lists() })]
            : []),
        ]);
      },
    });
  }

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-default bg-surface-raised px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0 space-y-2">
        <h2 className="truncate text-heading-sm font-semibold text-primary">{archive.title}</h2>
        {tab === "edited" && archive.ownerName ? (
          <p className="text-body-sm text-secondary">작성자 {archive.ownerName}</p>
        ) : null}
        {tab === "deleted" ? (
          <DeletedArchiveMetadata archive={archive} />
        ) : (
          <ActiveArchiveMetadata archive={archive} tab={tab} />
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {tab !== "deleted" ? (
          <Link className={buttonVariants({ size: "sm", variant: "outline" })} href={`/archives/${archive.id}`}>
            보기
          </Link>
        ) : null}
        {tab !== "deleted" && archive.canEditContent ? (
          <Link className={buttonVariants({ size: "sm" })} href={`/archives/${archive.id}/edit`}>
            편집
          </Link>
        ) : null}
        {tab === "owned" && archive.canEditContent ? (
          <Button onClick={() => setIsDeleteDialogOpen(true)} size="sm" type="button" variant="ghost">
            삭제
          </Button>
        ) : null}
        {tab === "deleted" ? (
          <Button
            disabled={!archive.canRestore || restoreMutation.isPending}
            onClick={handleRestore}
            size="sm"
            type="button"
          >
            {restoreMutation.isPending ? "복구 중" : "복구"}
          </Button>
        ) : null}
      </div>

      {tab === "deleted" && restoreMutation.isError ? (
        <p className="basis-full text-body-sm text-status-danger" role="alert">
          {restoreMutation.error.message}
        </p>
      ) : null}

      {tab === "owned" ? (
        <MyArchiveDeleteDialog
          archive={archive}
          onClose={() => setIsDeleteDialogOpen(false)}
          open={isDeleteDialogOpen}
        />
      ) : null}
    </article>
  );
}

function ActiveArchiveMetadata({
  archive,
  tab,
}: {
  archive: MyArchiveListItem;
  tab: MyArchiveTab;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-secondary">
      <Badge variant="outline">{archive.visibility === "public" ? "공개" : "비공개"}</Badge>
      <Badge variant="outline">{statusLabels[archive.status]}</Badge>
      <span>{structureModeLabels[archive.structureMode]}</span>
      <span>·</span>
      <span>클립 {archive.clipCount}개</span>
      {tab === "edited" ? (
        <>
          <span>·</span>
          <span>마지막 참여 {formatDate(archive.lastEditedByMeAt)}</span>
          <span className={cn(archive.canEditContent ? "text-brand-text" : "text-tertiary")}>
            {archive.canEditContent ? "현재 편집 가능" : "현재 읽기 전용"}
          </span>
        </>
      ) : (
        <>
          <span>·</span>
          <span>최종 수정 {formatDate(archive.updatedAt)}</span>
          <span>·</span>
          <span>revision {archive.currentRevision}</span>
          <span>·</span>
          <span>{editPolicyLabels[archive.editPolicy]}</span>
        </>
      )}
    </div>
  );
}

function DeletedArchiveMetadata({ archive }: { archive: MyArchiveListItem }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-secondary">
      <span>삭제 {formatDate(archive.deletedAt)}</span>
      <span>·</span>
      <span>{formatDate(archive.restoreExpiresAt)}까지 복구 가능</span>
      {archive.restoreExpiresAt ? (
        <>
          <span>·</span>
          <span className={archive.canRestore ? "text-brand-text" : "text-tertiary"}>
            {formatRestoreWindow(archive.restoreExpiresAt, archive.canRestore)}
          </span>
        </>
      ) : null}
    </div>
  );
}

function formatDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : "날짜 정보 없음";
}

function formatRestoreWindow(restoreExpiresAt: string, canRestore: boolean): string {
  if (!canRestore) {
    return "복구 기간 만료";
  }

  const remainingDays = Math.max(
    1,
    Math.ceil((new Date(restoreExpiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
  );

  return `${remainingDays}일 남음`;
}
