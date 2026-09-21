"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  ArchiveEditorOptions,
  ArchiveMetadataInput,
  ArchiveRelatedParticipant,
} from "@/features/archives/archive";

import { ArchiveRelationFields } from "./archive-relation-fields";

interface ArchiveSettingsDialogProps {
  metadata: ArchiveMetadataInput;
  relatedParticipants: ArchiveRelatedParticipant[];
  seasonDays: ArchiveEditorOptions["seasonDays"];
  onChange: (metadata: ArchiveMetadataInput) => void;
  onClose: () => void;
  open: boolean;
}

export function ArchiveSettingsDialog({
  metadata,
  relatedParticipants,
  seasonDays,
  onChange,
  onClose,
  open,
}: ArchiveSettingsDialogProps) {
  const [draft, setDraft] = useState(metadata);
  const [draftParticipants, setDraftParticipants] = useState(relatedParticipants);
  const [relationErrors, setRelationErrors] = useState<{
    participants?: string;
    seasonDays?: string;
  }>({});

  function updateMetadata(update: Partial<ArchiveMetadataInput>) {
    const nextMetadata = { ...draft, ...update };

    if (nextMetadata.visibility === "private") {
      nextMetadata.editPolicy = "owner_only";
    }

    setDraft(nextMetadata);
  }

  function saveSettings() {
    const errors: typeof relationErrors = {};

    if (draft.category === "character" && draftParticipants.length === 0) {
      errors.participants = "인물 아카이브는 관련 인물을 한 명 이상 선택해주세요.";
    }

    if (draft.category === "incident" && draft.relatedSeasonDayIds.length === 0) {
      errors.seasonDays = "사건 아카이브는 관련 일차를 한 개 이상 선택해주세요.";
    }

    if (Object.keys(errors).length > 0) {
      setRelationErrors(errors);
      return;
    }

    onChange({
      ...draft,
      relatedParticipantIds: draftParticipants.map((participant) => participant.id),
    });
    onClose();
  }

  return (
    <DialogPrimitive.Root onOpenChange={(nextOpen) => !nextOpen && onClose()} open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-modal bg-black/60" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-modal max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-default bg-surface-raised p-5 shadow-2xl outline-none">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-heading-sm font-semibold text-primary">
                아카이브 설정
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-body-sm text-secondary">
                제목, 공개 범위와 편집 정책을 관리합니다.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close aria-label="설정 닫기" className="cursor-pointer text-secondary hover:text-primary">
              <X aria-hidden="true" className="size-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="mt-5 space-y-5">
            <FormField label="제목">
              <Input maxLength={60} onChange={(event) => updateMetadata({ title: event.target.value })} value={draft.title} />
            </FormField>
            <FormField label="설명">
              <Textarea
                className="min-h-28"
                maxLength={500}
                onChange={(event) => updateMetadata({ description: event.target.value })}
                value={draft.description ?? ""}
              />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="주제">
                <Select
                  className="w-full"
                  label="아카이브 주제"
                  onValueChange={(category) => updateMetadata({ category })}
                  options={[
                    { label: "인물", value: "character" },
                    { label: "사건", value: "incident" },
                    { label: "시리즈", value: "series" },
                    { label: "기타", value: "other" },
                  ]}
                  value={draft.category}
                />
              </FormField>
              <FormField label="상태">
                <Select
                  className="w-full"
                  label="아카이브 상태"
                  onValueChange={(status) => updateMetadata({ status })}
                  options={[
                    { label: "진행 중", value: "ongoing" },
                    { label: "완료", value: "completed" },
                  ]}
                  value={draft.status}
                />
              </FormField>
            </div>
            <ArchiveRelationFields
              onParticipantsChange={(participants) => {
                setDraftParticipants(participants);
                setRelationErrors((current) => ({ ...current, participants: undefined }));
              }}
              onSeasonDayIdsChange={(relatedSeasonDayIds) => {
                updateMetadata({ relatedSeasonDayIds });
                setRelationErrors((current) => ({ ...current, seasonDays: undefined }));
              }}
              participantError={relationErrors.participants}
              participants={draftParticipants}
              seasonDayError={relationErrors.seasonDays}
              seasonDayIds={draft.relatedSeasonDayIds}
              seasonDays={seasonDays}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="공개 범위">
                <Select
                  className="w-full"
                  label="아카이브 공개 범위"
                  onValueChange={(visibility) => updateMetadata({ visibility })}
                  options={[
                    { label: "비공개", value: "private" },
                    { label: "공개", value: "public" },
                  ]}
                  value={draft.visibility}
                />
              </FormField>
              <FormField label="편집 정책">
                <Select
                  className="w-full"
                  disabled={draft.visibility === "private"}
                  label="아카이브 편집 정책"
                  onValueChange={(editPolicy) => updateMetadata({ editPolicy })}
                  options={[
                    { label: "소유자만 편집", value: "owner_only" },
                    { label: "로그인 사용자 편집 허용", value: "public_edit" },
                  ]}
                  value={draft.editPolicy}
                />
              </FormField>
            </div>
            <p className="text-caption text-secondary">
              공개한 아카이브는 다시 비공개로 전환할 수 없습니다.
            </p>
            <div className="flex justify-end gap-2 border-t border-default pt-4">
              <Button onClick={onClose} type="button" variant="outline">취소</Button>
              <Button onClick={saveSettings} type="button">설정 저장</Button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
