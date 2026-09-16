"use client";

import { LogIn, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ArchiveCategory, ArchiveStructureMode } from "@/features/archives/archive";
import { archiveMutations, archiveQueries } from "@/queries/archive-queries";

import { createNewArchiveContent } from "./archive-editor-draft";

interface ArchiveCreateContentProps {
  isSignedIn: boolean;
}

export function ArchiveCreateContent({ isSignedIn }: ArchiveCreateContentProps) {
  const router = useRouter();
  const optionsQuery = useQuery(archiveQueries.editorOptions());
  const createMutation = useMutation(archiveMutations.create());
  const [structureMode, setStructureMode] = useState<ArchiveStructureMode>("freeform");
  const [category, setCategory] = useState<ArchiveCategory>("other");
  const [message, setMessage] = useState<string | null>(null);

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

    createMutation.mutate({
      content: createNewArchiveContent(structureMode, optionsQuery.data.seasonDays),
      metadata: {
        category,
        description: typeof description === "string" && description.trim() ? description : null,
        editPolicy: "owner_only",
        status: "ongoing",
        structureMode,
        title,
        visibility: "private",
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
    return <p className="py-10 text-body-sm text-secondary">아카이브 생성 정보를 불러오는 중입니다.</p>;
  }

  if (optionsQuery.isError) {
    return <p className="py-10 text-body-sm text-status-danger">아카이브 생성 정보를 불러오지 못했습니다.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl py-5 sm:py-6 lg:py-8">
      <header>
        <p className="text-body-sm font-medium text-brand-text">사용자 제작 아카이브</p>
        <h1 className="mt-1 text-title font-bold text-primary">새 아카이브 만들기</h1>
        <p className="mt-2 text-body-sm text-secondary">기본 정보를 정한 뒤 클립을 담아 나만의 기록을 만들어보세요.</p>
      </header>

      <form action={handleSubmit} className="mt-6 space-y-5 rounded-xl border border-default bg-surface-raised p-5">
        <label className="block space-y-1.5 text-body-sm font-medium text-primary">
          제목
          <Input name="title" placeholder="아카이브 제목을 입력해주세요." required />
        </label>
        <label className="block space-y-1.5 text-body-sm font-medium text-primary">
          설명
          <Textarea name="description" placeholder="아카이브를 소개해주세요. (선택)" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-body-sm font-medium text-primary">
            분류
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
          <label className="space-y-1.5 text-body-sm font-medium text-primary">
            구성 방식
            <Select
              className="w-full"
              label="아카이브 구성 방식"
              onValueChange={setStructureMode}
              options={[
                { label: "자유 구성", value: "freeform" },
                { label: "봉누도 일차별", value: "day_based" },
              ]}
              value={structureMode}
            />
          </label>
        </div>
        <p className="rounded-lg bg-surface-muted px-3 py-2 text-caption text-secondary">
          {structureMode === "freeform"
            ? "챕터와 클립 순서를 원하는 대로 구성할 수 있습니다."
            : "운영 일차별 챕터가 생성되며, 같은 일차의 클립만 담을 수 있습니다."}
        </p>
        {message ? <p className="text-body-sm text-status-danger">{message}</p> : null}
        <div className="flex justify-end">
          <Button disabled={createMutation.isPending} type="submit">
            <Plus aria-hidden="true" className="size-4" />
            {createMutation.isPending ? "생성 중" : "아카이브 만들기"}
          </Button>
        </div>
      </form>
    </div>
  );
}
