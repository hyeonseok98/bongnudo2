"use client";

import { ArrowLeft, Check, LogIn, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { RetryButton } from "@/components/ui/retry-button";
import { Textarea } from "@/components/ui/textarea";
import type {
  ArchiveCategory,
  ArchiveEditPolicy,
  ArchiveStructureMode,
  ArchiveVisibility,
} from "@/features/archives/archive";
import { archiveMutations, archiveQueries } from "@/queries/archive-queries";
import { cn } from "@/utils/cn";

import { createNewArchiveContent } from "./archive-editor-draft";
import { ArchiveCreationSteps } from "./archive-creation-steps";
import { ArchiveCreateSkeleton } from "./archive-create-skeleton";

interface ArchiveCreateContentProps {
  isSignedIn: boolean;
}

interface ArchiveCreateErrors {
  title?: string;
}

export function ArchiveCreateContent({ isSignedIn }: ArchiveCreateContentProps) {
  const router = useRouter();
  const optionsQuery = useQuery(archiveQueries.editorOptions());
  const createMutation = useMutation(archiveMutations.create());
  const [structureMode, setStructureMode] = useState<ArchiveStructureMode>("freeform");
  const [category, setCategory] = useState<ArchiveCategory>("other");
  const [visibility, setVisibility] = useState<ArchiveVisibility>("public");
  const [editPolicy, setEditPolicy] = useState<ArchiveEditPolicy>("owner_only");
  const [errors, setErrors] = useState<ArchiveCreateErrors>({});
  const [message, setMessage] = useState<string | null>(null);

  function changeVisibility(nextVisibility: ArchiveVisibility) {
    setVisibility(nextVisibility);

    if (nextVisibility === "private") {
      setEditPolicy("owner_only");
    }
  }

  function handleSubmit(formData: FormData) {
    if (!optionsQuery.data) {
      return;
    }

    const title = formData.get("title");
    const description = formData.get("description");

    if (typeof title !== "string" || !title.trim()) {
      setErrors({ title: "제목을 입력해주세요." });
      return;
    }

    setErrors({});
    setMessage(null);
    createMutation.mutate({
      content: createNewArchiveContent(structureMode, optionsQuery.data.seasonDays),
      metadata: {
        category,
        description: typeof description === "string" && description.trim() ? description : null,
        editPolicy,
        status: "ongoing",
        structureMode,
        title,
        visibility,
      },
      seasonId: optionsQuery.data.seasonId,
    }, {
      onError: (error) => setMessage(error.message),
      onSuccess: (result) => router.push(`/archives/${result.archiveId}/edit`),
    });
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-4 py-10 text-center">
        <div>
          <h1 className="text-heading font-semibold text-primary">로그인이 필요합니다.</h1>
          <p className="mt-2 text-body-sm text-secondary">아카이브를 만들려면 로그인해주세요.</p>
        </div>
        <Link className={buttonVariants()} href="/login?returnTo=%2Farchives%2Fnew">
          <LogIn aria-hidden="true" className="size-4" />
          로그인하기
        </Link>
      </div>
    );
  }

  if (optionsQuery.isPending) {
    return <ArchiveCreateSkeleton />;
  }

  if (optionsQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-body-sm text-status-danger">
        <p>아카이브 생성 정보를 불러오지 못했습니다.</p>
        <RetryButton isPending={optionsQuery.isFetching} onRetry={() => void optionsQuery.refetch()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-5 sm:py-6 lg:py-8">
      <Link className={buttonVariants({ size: "sm", variant: "ghost" })} href="/archives">
        <ArrowLeft aria-hidden="true" className="size-4" />
        아카이브 목록
      </Link>

      <header className="mt-5">
        <h1 className="text-title font-bold text-primary">새 아카이브 만들기</h1>
        <p className="mt-2 text-body text-secondary">기본 정보를 입력하고 클립을 구성해주세요.</p>
      </header>

      <div className="mt-7"><ArchiveCreationSteps currentStep={1} /></div>

      <form action={handleSubmit} className="mt-6 rounded-xl border border-default bg-surface-raised p-5 sm:p-6">
        <fieldset className="space-y-7" disabled={createMutation.isPending}>
          <FormField error={errors.title} label="제목" required>
            <Input
              aria-invalid={errors.title ? true : undefined}
              maxLength={60}
              name="title"
              onChange={() => errors.title && setErrors({})}
              placeholder="아카이브 제목을 입력해주세요."
            />
          </FormField>
          <FormField label="설명 (선택)">
            <Textarea maxLength={500} name="description" placeholder="아카이브를 소개해주세요. (선택)" />
          </FormField>
          <FormField label="분류" required>
            <Select
              className="w-full sm:w-52"
              label="아카이브 분류"
              onValueChange={setCategory}
              options={[
                { label: "인물", value: "character" },
                { label: "사건", value: "incident" },
                { label: "시리즈", value: "series" },
                { label: "기타", value: "other" },
              ]}
              value={category}
            />
          </FormField>

          <fieldset className="space-y-3">
            <legend className="text-body-sm font-medium text-primary">구성 방법 <span className="ml-2 text-caption font-medium text-status-danger">필수</span></legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <StructureModeCard
                description="원하는 챕터와 순서로 이야기를 구성"
                isSelected={structureMode === "freeform"}
                onSelect={() => setStructureMode("freeform")}
                title="자유롭게 구성"
              />
              <StructureModeCard
                description="봉누도 일차를 기준으로 챕터를 구성"
                isSelected={structureMode === "day_based"}
                onSelect={() => setStructureMode("day_based")}
                title="일차별로 구성"
              />
            </div>
          </fieldset>

          <div className="flex flex-wrap items-start gap-5">
            <FormField className="w-full sm:w-52" label="공개 범위" required>
              <Select
                className="w-full"
                label="아카이브 공개 범위"
                onValueChange={changeVisibility}
                options={[
                  { label: "비공개", value: "private" },
                  { label: "공개", value: "public" },
                ]}
                value={visibility}
              />
            </FormField>
            {visibility === "public" ? <FormField className="w-full sm:w-64" label="편집 정책">
              <Select
                className="w-full"
                label="아카이브 편집 정책"
                onValueChange={setEditPolicy}
                options={[
                  { label: "소유자만 편집", value: "owner_only" },
                  { label: "로그인 사용자 편집 허용", value: "public_edit" },
                ]}
                value={editPolicy}
              />
            </FormField> : null}
          </div>
          {visibility === "public" ? <p className="-mt-3 text-caption text-secondary">공개한 아카이브는 다시 비공개로 전환할 수 없습니다.</p> : null}
        </fieldset>

        {message ? <p className="mt-5 text-body-sm text-status-danger" role="alert">{message}</p> : null}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-default pt-5">
          <Link className={buttonVariants({ variant: "outline" })} href="/archives">
            취소
          </Link>
          <Button disabled={createMutation.isPending} type="submit">
            {createMutation.isPending ? <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> : <Plus aria-hidden="true" className="size-4" />}
            {createMutation.isPending ? "기본 정보를 저장하는 중" : "다음: 클립 구성"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function StructureModeCard({
  description,
  isSelected,
  onSelect,
  title,
}: {
  description: string;
  isSelected: boolean;
  onSelect: () => void;
  title: string;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        "cursor-pointer rounded-xl border p-4 text-left transition-colors",
        isSelected
          ? "border-brand bg-surface-selected"
          : "border-default bg-background hover:border-brand/60",
      )}
      onClick={onSelect}
      type="button"
    >
      <span className="flex items-center gap-2 text-body-sm font-semibold text-primary">
        <span className={cn("grid size-4 place-items-center rounded-full border", isSelected ? "border-brand" : "border-default")}>
          {isSelected ? <Check aria-hidden="true" className="size-3 text-brand-text" /> : null}
        </span>
        {title}
      </span>
      <span className="mt-2 block text-caption text-secondary">{description}</span>
    </button>
  );
}
