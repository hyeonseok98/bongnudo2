"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import type { MyArchiveListItem } from "@/features/archives/archive";
import { archiveMutations, archiveQueries } from "@/queries/archive-queries";

interface MyArchiveDeleteDialogProps {
  archive: MyArchiveListItem;
  onClose: () => void;
  open: boolean;
}

export function MyArchiveDeleteDialog({
  archive,
  onClose,
  open,
}: MyArchiveDeleteDialogProps) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation(archiveMutations.softDelete());

  function handleDelete() {
    deleteMutation.mutate(archive.id, {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: archiveQueries.myListKey("owned") }),
          queryClient.invalidateQueries({ queryKey: archiveQueries.myListKey("deleted") }),
          queryClient.invalidateQueries({ queryKey: archiveQueries.detail(archive.id).queryKey }),
          ...(archive.visibility === "public"
            ? [queryClient.invalidateQueries({ queryKey: archiveQueries.lists() })]
            : []),
        ]);
        onClose();
      },
    });
  }

  return (
    <DialogPrimitive.Root onOpenChange={(nextOpen) => !nextOpen && onClose()} open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-modal bg-black/60" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-modal w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-default bg-surface-raised p-5 shadow-2xl outline-none">
          <DialogPrimitive.Title className="text-heading-sm font-semibold text-primary">
            아카이브를 삭제할까요?
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-2 text-body-sm text-secondary">
            삭제하면 즉시 목록에서 숨겨지며, 30일 동안 복구할 수 있습니다.
          </DialogPrimitive.Description>
          {deleteMutation.isError ? (
            <p className="mt-3 text-body-sm text-status-danger" role="alert">
              {deleteMutation.error.message}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <Button disabled={deleteMutation.isPending} onClick={onClose} type="button" variant="outline">
              취소
            </Button>
            <Button
              className="border-status-danger text-status-danger hover:bg-status-danger/10 hover:text-status-danger"
              disabled={deleteMutation.isPending}
              onClick={handleDelete}
              type="button"
              variant="outline"
            >
              {deleteMutation.isPending ? "삭제 중" : "삭제"}
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
