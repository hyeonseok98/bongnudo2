"use client";

import Link from "next/link";
import { useQueryState, parseAsStringLiteral } from "nuqs";

import { Archive, Plus } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  MY_ARCHIVE_TAB_VALUES,
  type MyArchiveTab,
} from "@/features/archives/archive";
import { cn } from "@/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";

import { useMyArchives } from "../_hooks/use-my-archives";
import { MyArchiveRow } from "./my-archive-row";

const tabLabels: Record<MyArchiveTab, string> = {
  deleted: "삭제한",
  edited: "내가 편집한",
  owned: "내가 만든",
};

const emptyMessages: Record<MyArchiveTab, string> = {
  deleted: "복구할 수 있는 삭제된 아카이브가 없습니다.",
  edited: "아직 편집한 아카이브가 없습니다.",
  owned: "아직 만든 아카이브가 없습니다.",
};

export function MyArchivesContent() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(MY_ARCHIVE_TAB_VALUES).withDefault("owned"),
  );
  const archivesQuery = useMyArchives(tab);
  const archives = archivesQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-title font-bold text-primary">내 아카이브</h1>
          <p className="mt-1 text-body text-secondary">만든 기록과 참여한 아카이브를 관리합니다.</p>
        </div>
        <Link className={cn(buttonVariants(), "self-start sm:self-auto")} href="/archives/new">
          <Plus aria-hidden="true" />
          아카이브 만들기
        </Link>
      </header>

      <div aria-label="내 아카이브 분류" className="flex flex-wrap gap-2" role="tablist">
        {MY_ARCHIVE_TAB_VALUES.map((tabValue) => (
          <button
            aria-selected={tab === tabValue}
            className={cn(
              "cursor-pointer rounded-lg border px-3 py-2 text-body-sm font-medium transition-[background-color,border-color,color] duration-default",
              tab === tabValue
                ? "border-brand bg-brand/10 text-brand-text"
                : "border-default text-secondary hover:bg-surface-muted hover:text-primary",
            )}
            key={tabValue}
            onClick={() => void setTab(tabValue === "owned" ? null : tabValue, { history: "replace" })}
            role="tab"
            type="button"
          >
            {tabLabels[tabValue]}
          </button>
        ))}
      </div>

      {archivesQuery.isPending ? <MyArchivesLoading /> : null}
      {archivesQuery.isError ? <MyArchivesError /> : null}
      {!archivesQuery.isPending && !archivesQuery.isError ? (
        <section className="space-y-3">
          {archives.length > 0 ? (
            archives.map((archive) => <MyArchiveRow archive={archive} key={archive.id} tab={tab} />)
          ) : (
            <MyArchivesEmpty tab={tab} />
          )}
          {archivesQuery.hasNextPage ? (
            <div className="flex justify-center pt-2">
              <Button
                disabled={archivesQuery.isFetchingNextPage}
                onClick={() => void archivesQuery.fetchNextPage()}
                type="button"
                variant="outline"
              >
                {archivesQuery.isFetchingNextPage ? "아카이브를 더 불러오는 중입니다." : "아카이브 더 보기"}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function MyArchivesLoading() {
  return (
    <div aria-label="내 아카이브를 불러오는 중입니다." className="space-y-3" role="status">
      {Array.from({ length: 5 }, (_, index) => (
        <article className="grid overflow-hidden rounded-xl border border-default bg-surface-raised sm:grid-cols-[11rem_minmax(0,1fr)]" key={index}>
          <Skeleton className="aspect-video w-full rounded-none sm:aspect-auto" />
          <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
            <div className="space-y-3"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/5" /><Skeleton className="h-3 w-20" /></div>
            <div className="flex gap-2"><Skeleton className="h-9 w-16" /><Skeleton className="h-9 w-16" /><Skeleton className="h-9 w-16" /></div>
          </div>
        </article>
      ))}
    </div>
  );
}

function MyArchivesError() {
  return (
    <p className="rounded-xl border border-dashed border-default px-4 py-14 text-center text-body-sm text-status-danger" role="alert">
      내 아카이브를 불러오지 못했습니다.
    </p>
  );
}

function MyArchivesEmpty({ tab }: { tab: MyArchiveTab }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-default px-5 py-10 text-center">
      <Archive aria-hidden="true" className="size-8 text-tertiary" />
      <p className="mt-3 text-heading-sm font-semibold text-primary">{emptyMessages[tab]}</p>
    </div>
  );
}
