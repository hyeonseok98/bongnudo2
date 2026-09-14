"use client";

import { Bell, Clock3 } from "lucide-react";

import { TimelineCategoryBadge } from "@/app/timeline/_components/timeline-list";
import { useTimeline } from "@/app/timeline/_hooks/use-timeline";
import type { TimelineQueryFilters } from "@/features/timeline/timeline";

const VISIBLE_TIMELINE_EVENT_COUNT = 5;
const kstTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  timeZone: "Asia/Seoul",
});

export function HomeTimelineNotices({ today }: { today: string }) {
  const filters: TimelineQueryFilters = {
    affiliation: "",
    category: "",
    date: today,
    day: 0,
    job: "",
    participant: "",
    query: "",
    scope: "page",
    sort: "desc",
    tag: "",
    viewMode: "date",
  };
  const timelineQuery = useTimeline(filters);
  const events =
    timelineQuery.data?.events.slice(0, VISIBLE_TIMELINE_EVENT_COUNT) ?? [];

  return (
    <section
      aria-label="실시간 타임라인과 서버 공지사항"
      className="grid items-stretch gap-4 lg:grid-cols-2"
    >
      <article className="flex min-h-72 flex-col rounded-xl border border-default bg-surface-raised p-4 sm:p-5">
        <header className="flex items-center gap-2 border-b border-default pb-3">
          <Clock3 aria-hidden="true" className="size-5 text-brand-text" />
          <h2 className="text-heading-sm font-semibold text-primary">
            실시간 타임라인
          </h2>
        </header>

        {timelineQuery.isPending ? (
          <HomePanelMessage>타임라인을 불러오는 중입니다.</HomePanelMessage>
        ) : timelineQuery.isError ? (
          <HomePanelMessage isError>
            타임라인을 불러오지 못했습니다.
          </HomePanelMessage>
        ) : events.length > 0 ? (
          <ol className="divide-y divide-border-default">
            {events.map((event) => (
              <li
                className="flex min-w-0 items-center gap-3 py-3"
                key={event.id}
              >
                <time
                  className="w-11 shrink-0 text-body-sm font-semibold text-primary"
                  dateTime={event.occurredAt}
                >
                  {kstTimeFormatter.format(new Date(event.occurredAt))}
                </time>
                <p className="min-w-0 flex-1 truncate text-body-sm text-secondary">
                  {event.title || event.content}
                </p>
                <TimelineCategoryBadge categorySlug={event.category.slug}>
                  {event.category.name}
                </TimelineCategoryBadge>
              </li>
            ))}
          </ol>
        ) : (
          <HomePanelMessage>오늘 등록된 타임라인이 없습니다.</HomePanelMessage>
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

function HomePanelMessage({
  children,
  isError = false,
}: {
  children: string;
  isError?: boolean;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8 text-center">
      <p
        className={
          isError
            ? "text-body-sm text-status-danger"
            : "text-body-sm text-tertiary"
        }
        role={isError ? "alert" : "status"}
      >
        {children}
      </p>
    </div>
  );
}
