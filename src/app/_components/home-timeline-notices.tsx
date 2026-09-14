"use client";

import { Bell, Clock3 } from "lucide-react";
import Link from "next/link";

import { useHomeTimeline } from "@/app/_hooks/use-home-timeline";
import { TimelineCategoryBadge } from "@/app/timeline/_components/timeline-category-badge";
import { formatTimelineTime } from "@/app/timeline/_components/timeline-date-time";
import { Skeleton } from "@/components/ui/skeleton";
import { getKstDateFromInstant } from "@/features/timeline/timeline-params";

import { HomeDirectoryLink } from "./home-section";

const HOME_TIMELINE_SKELETON_COUNT = 5;

export function HomeTimelineNotices() {
  const timelineQuery = useHomeTimeline();
  const events = timelineQuery.data?.events ?? [];

  return (
    <section
      aria-label="실시간 타임라인과 서버 공지사항"
      className="grid items-stretch gap-4 lg:grid-cols-2"
    >
      <article className="flex min-h-72 flex-col rounded-xl border border-default bg-surface-raised p-4 sm:p-5">
        <header className="flex items-center justify-between gap-3 border-b border-default pb-3">
          <div className="flex min-w-0 items-center gap-2">
            <Clock3
              aria-hidden="true"
              className="size-5 shrink-0 text-brand-text"
            />
            <h2 className="truncate text-heading-sm font-semibold text-primary">
              실시간 타임라인
            </h2>
          </div>
          <HomeDirectoryLink href="/timeline">전체보기</HomeDirectoryLink>
        </header>

        {timelineQuery.isPending ? (
          <HomeTimelineSkeleton />
        ) : timelineQuery.isError ? (
          <HomePanelMessage isError>
            타임라인을 불러오지 못했습니다.
          </HomePanelMessage>
        ) : events.length > 0 ? (
          <ol className="divide-y divide-border-default">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  className="flex min-w-0 cursor-pointer items-center gap-3 rounded-md py-3 transition-colors duration-default hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
                  href={`/timeline?date=${getKstDateFromInstant(event.occurredAt)}&event=${event.id}`}
                >
                  <time
                    className="w-11 shrink-0 text-body-sm font-semibold text-primary"
                    dateTime={event.occurredAt}
                  >
                    {formatTimelineTime(event.occurredAt)}
                  </time>
                  <p className="min-w-0 flex-1 truncate text-body-sm text-secondary">
                    {event.title}
                  </p>
                  <TimelineCategoryBadge categorySlug={event.category.slug}>
                    {event.category.name}
                  </TimelineCategoryBadge>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <HomePanelMessage description="새로운 기록이 등록되면 이곳에 표시됩니다.">
            등록된 타임라인이 없습니다.
          </HomePanelMessage>
        )}
      </article>

      <article className="flex min-h-72 flex-col rounded-xl border border-default bg-surface-raised p-4 sm:p-5">
        <header className="flex items-center gap-2 border-b border-default pb-3">
          <Bell aria-hidden="true" className="size-5 text-brand-text" />
          <h2 className="text-heading-sm font-semibold text-primary">
            서버 공지사항
          </h2>
        </header>
        <HomePanelMessage>등록된 서버 공지사항이 없습니다.</HomePanelMessage>
      </article>
    </section>
  );
}

function HomeTimelineSkeleton() {
  return (
    <div aria-label="최신 타임라인을 불러오는 중" role="status">
      {Array.from({ length: HOME_TIMELINE_SKELETON_COUNT }, (_, index) => (
        <div
          className="flex items-center gap-3 border-b border-default py-3 last:border-b-0"
          key={index}
        >
          <Skeleton className="h-4 w-11 shrink-0" />
          <Skeleton className="h-4 min-w-0 flex-1" />
          <Skeleton className="h-6 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function HomePanelMessage({
  children,
  description,
  isError = false,
}: {
  children: string;
  description?: string;
  isError?: boolean;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8 text-center">
      <div role={isError ? "alert" : "status"}>
        <p
          className={
            isError
              ? "text-body-sm text-status-danger"
              : "text-body-sm text-tertiary"
          }
        >
          {children}
        </p>
        {description ? (
          <p className="mt-1 text-caption text-tertiary">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
