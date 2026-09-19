"use client";

import { ArrowLeft, Check, LogIn, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
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
import { ArchiveCreateSkeleton } from "./archive-create-skeleton";

interface ArchiveCreateContentProps {
  isSignedIn: boolean;
}

export function ArchiveCreateContent({ isSignedIn }: ArchiveCreateContentProps) {
  const router = useRouter();
  const optionsQuery = useQuery(archiveQueries.editorOptions());
  const createMutation = useMutation(archiveMutations.create());
  const [structureMode, setStructureMode] = useState<ArchiveStructureMode>("freeform");
  const [category, setCategory] = useState<ArchiveCategory>("other");
  const [visibility, setVisibility] = useState<ArchiveVisibility>("private");
  const [editPolicy, setEditPolicy] = useState<ArchiveEditPolicy>("owner_only");
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
      setMessage("제목을 입력해주세요.");
      return;
    }

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

      <header className="mt-4">
        <p className="text-body-sm font-medium text-brand-text">사용자 제작 아카이브</p>
        <h1 className="mt-1 text-title font-bold text-primary">새 아카이브 만들기</h1>
        <p className="mt-2 text-body-sm text-secondary">기본 정보를 정한 뒤 클립을 담아 나만의 기록을 만들어보세요.</p>
      </header>

      <ol aria-label="아카이브 제작 단계" className="mt-6 grid grid-cols-2 gap-3">
        <li className="rounded-lg border border-brand bg-surface-selected px-4 py-3 text-body-sm font-semibold text-primary">
          <span className="mr-2 text-brand-text">1</span>
          기본 정보
        </li>
        <li className="rounded-lg border border-default px-4 py-3 text-body-sm font-medium text-secondary">
          <span className="mr-2">2</span>
          클립 구성
        </li>
      </ol>

      <form action={handleSubmit} className="mt-5 rounded-xl border border-default bg-surface-raised p-5 sm:p-6">
        <fieldset className="space-y-6" disabled={createMutation.isPending}>
          <label className="block space-y-2 text-body-sm font-medium text-primary">
            <span>제목</span>
            <Input maxLength={60} name="title" placeholder="아카이브 제목을 입력해주세요." required />
          </label>
          <label className="block space-y-2 text-body-sm font-medium text-primary">
            <span>설명</span>
            <Textarea maxLength={500} name="description" placeholder="아카이브를 소개해주세요. (선택)" />
          </label>
          <label className="block space-y-2 text-body-sm font-medium text-primary">
            <span>분류</span>
            <Select
              className="w-full"
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
          </label>

          <fieldset>
            <legend className="text-body-sm font-medium text-primary">구성 방법</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
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

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-body-sm font-medium text-primary">
              <span>공개 범위</span>
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
            </label>
            <label className="space-y-2 text-body-sm font-medium text-primary">
              <span>편집 정책</span>
              <Select
                className="w-full"
                disabled={visibility === "private"}
                label="아카이브 편집 정책"
                onValueChange={setEditPolicy}
                options={[
                  { label: "소유자만 편집", value: "owner_only" },
                  { label: "로그인 사용자 편집 허용", value: "public_edit" },
                ]}
                value={editPolicy}
              />
            </label>
          </div>
          <p className="text-caption text-secondary">
            공개한 아카이브는 다시 비공개로 전환할 수 없습니다.
          </p>
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
