"use client";

import Link from "next/link";
import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderArchive } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import type { MyArchiveListItem, MyArchiveTab } from "@/features/archives/archive";
import { archiveMutations, archiveQueries } from "@/queries/archive-queries";
import { cn } from "@/utils/cn";

import { MyArchiveDeleteDialog } from "./my-archive-delete-dialog";

interface MyArchiveRowProps {
  archive: MyArchiveListItem;
  tab: MyArchiveTab;
}

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
    <article className="grid overflow-hidden rounded-xl border border-default bg-surface-raised sm:grid-cols-[11rem_minmax(0,1fr)]">
      <ArchiveThumbnail archive={archive} />
      <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <h2 className="truncate text-heading-sm font-semibold text-primary">{archive.title}</h2>
          {archive.description ? (
            <p className="mt-2 line-clamp-2 text-body-sm leading-5 text-secondary">{archive.description}</p>
          ) : null}
          <p className="mt-3 text-caption text-secondary">클립 {archive.clipCount}개</p>
          {tab === "edited" && archive.ownerName ? (
            <p className="mt-1 text-caption text-tertiary">작성자 {archive.ownerName}</p>
          ) : null}
          {tab === "deleted" ? <DeletedArchiveStatus archive={archive} /> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
          <p className="text-body-sm text-status-danger" role="alert">
            {restoreMutation.error.message}
          </p>
        ) : null}
      </div>

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

function ArchiveThumbnail({ archive }: { archive: MyArchiveListItem }) {
  return (
    <div className="relative aspect-video overflow-hidden bg-surface-muted sm:aspect-auto">
      {archive.representativeImageUrl ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${JSON.stringify(archive.representativeImageUrl)})` }}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-tertiary">
          <FolderArchive aria-hidden="true" className="size-9" />
        </div>
      )}
    </div>
  );
}

function DeletedArchiveStatus({ archive }: { archive: MyArchiveListItem }) {
  if (!archive.restoreExpiresAt) {
    return <p className="mt-1 text-caption text-secondary">복구 기간 정보가 없습니다.</p>;
  }

  return (
    <p className={cn("mt-1 text-caption", archive.canRestore ? "text-secondary" : "text-tertiary")}>
      {archive.canRestore ? "복구할 수 있습니다." : "복구 기간이 만료되었습니다."}
    </p>
  );
}
