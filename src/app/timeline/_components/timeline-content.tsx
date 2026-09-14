"use client";

import { useRef, useState } from "react";

import {
  buildJobAffiliationFilterNodes,
  buildStreamerAffiliationFilterData,
  filterCharacters,
} from "@/app/characters/_utils/character-directory";
import type { HierarchicalFilterSelection } from "@/components/filters/hierarchical-filter";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { TimelineQueryFilters } from "@/features/timeline/timeline";
import { resolveTimelineEvent } from "@/features/timeline/timeline-event-navigation";
import { getInitialTimelineMediaId } from "@/features/timeline/timeline-media";
import {
  hasTimelineFilters,
  TIMELINE_SORT_OPTIONS,
} from "@/features/timeline/timeline-params";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/utils/cn";

import { useCharacters } from "../../characters/_hooks/use-characters";
import { useTimeline } from "../_hooks/use-timeline";
import { useTimelineDirectory } from "../_hooks/use-timeline-directory";
import { TimelineFilters } from "./timeline-filters";
import { TimelineList, TimelineListSkeleton } from "./timeline-list";
import { TimelineMediaDialog } from "./timeline-media-dialog";
import { CorrectionDialog } from "./correction-dialog";
import { ReportDialog } from "./report-dialog";
import { ReportLoginDialog } from "./report-login-dialog";

interface TimelineContentProps {
  isAuthenticated: boolean;
  initialDay: number;
  today: string;
}

export function TimelineContent({
  isAuthenticated,
  initialDay,
  today,
}: TimelineContentProps) {
  const didOpenMediaFromList = useRef(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const directory = useTimelineDirectory(today, initialDay);
  const debouncedQuery = useDebouncedValue(directory.query, 300);
  const queryFilters: TimelineQueryFilters = {
    affiliation: directory.affiliation,
    category: directory.category,
    date: directory.date,
    day: directory.day,
    job: directory.job,
    participant: directory.participant,
    query: debouncedQuery,
    scope: "page",
    sort: directory.sort,
    tag: directory.tag,
    viewMode: directory.viewMode,
  };
  const timelineQuery = useTimeline(queryFilters);
  const navigationQuery = useTimeline(
    { ...queryFilters, scope: "season" },
    Boolean(directory.eventId),
  );
  const charactersQuery = useCharacters();
  const characters = charactersQuery.data?.characters ?? [];
  const streamerAffiliations =
    charactersQuery.data?.streamerAffiliations ?? [];
  const jobNodes = buildJobAffiliationFilterNodes(characters);
  const affiliationFilterData = buildStreamerAffiliationFilterData(
    characters,
    streamerAffiliations,
  );
  const selectedParticipant = characters.find(
    (character) => character.id === directory.participant,
  );
  const selectedParticipantLabel = selectedParticipant
    ? (selectedParticipant.rpName ?? "RP명 없음")
    : null;
  const timeline = timelineQuery.data;
  const pageEvents = timeline?.events ?? [];
  const navigationEvents = navigationQuery.data?.events ?? [];
  const selectedEvent = resolveTimelineEvent(
    pageEvents,
    navigationEvents,
    directory.eventId,
  );
  const correctionEvent =
    timeline?.events.find(
      (event) => event.id === directory.correctionEventId,
    ) ?? null;

  function getJobResultCount(selection: HierarchicalFilterSelection) {
    return filterCharacters(
      characters,
      {
        jobSelection: selection,
        query: "",
        streamerAffiliationSelection: { ids: [] },
      },
      streamerAffiliations,
    ).length;
  }

  function getAffiliationResultCount(selection: HierarchicalFilterSelection) {
    return filterCharacters(
      characters,
      {
        jobSelection: { ids: [] },
        query: "",
        streamerAffiliationSelection: selection,
      },
      streamerAffiliations,
    ).length;
  }

  function handleMediaOpen(eventId: string, mediaId: string) {
    didOpenMediaFromList.current = true;
    directory.openMedia(eventId, mediaId);
  }

  function handleMediaClose() {
    if (didOpenMediaFromList.current) {
      didOpenMediaFromList.current = false;
      window.history.back();
      return;
    }

    directory.closeMedia();
  }

  function handleMediaTagChange(tagSlug: string) {
    didOpenMediaFromList.current = false;
    directory.applyTagFromMedia(tagSlug);
  }

  function handleMediaFilterChange(
    mediaFilter: Parameters<typeof directory.changeMediaType>[0],
  ): void {
    directory.changeMediaType(mediaFilter);
    if (!selectedEvent) return;
    directory.changeMedia(
      getInitialTimelineMediaId(selectedEvent, mediaFilter) ?? "",
    );
  }

  function handleReportSuccess(message: string): void {
    setFeedback(message);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-title font-bold text-primary">전체 타임라인</h1>
          <p className="text-body text-secondary">
            봉누도에서 벌어지는 모든 순간, 사람들이 만들어가는 이야기를 한눈에.
          </p>
        </div>
        <Button onClick={directory.openReport}>제보하기</Button>
      </header>

      {feedback ? (
        <div
          className="flex items-center justify-between gap-3 rounded-lg bg-brand/15 px-3 py-2 text-body-sm text-primary"
          role="status"
        >
          <p>{feedback}</p>
          <Button
            aria-label="알림 닫기"
            onClick={() => setFeedback(null)}
            size="sm"
            variant="ghost"
          >
            닫기
          </Button>
        </div>
      ) : null}

      <TimelineFilters
        affiliationNodes={affiliationFilterData.nodes}
        affiliationQuickOptions={affiliationFilterData.quickOptions}
        categories={timeline?.categories ?? []}
        directory={directory}
        getAffiliationResultCount={getAffiliationResultCount}
        getJobResultCount={getJobResultCount}
        jobNodes={jobNodes}
        popularTags={timeline?.popularTags ?? []}
        selectedParticipantLabel={selectedParticipantLabel}
        today={today}
      />

      <section aria-labelledby="timeline-results-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            className="text-body-sm text-secondary"
            id="timeline-results-heading"
          >
            {directory.viewMode === "date"
              ? `${directory.date} 타임라인`
              : `${directory.day}일차 타임라인`}
            {timeline ? (
              <strong className="ml-1 font-semibold text-brand-text">
                {timeline.totalCount}건
              </strong>
            ) : null}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-body-sm text-secondary">정렬</span>
            <Select
              label={
                directory.sort === "desc" ? "최근 기록부터" : "처음 기록부터"
              }
              onValueChange={directory.changeSort}
              options={TIMELINE_SORT_OPTIONS}
              value={directory.sort}
            />
          </div>
        </div>

        {timelineQuery.isError ? (
          <TimelineStatus isError>
            타임라인을 불러오지 못했습니다.
          </TimelineStatus>
        ) : !timeline || timelineQuery.isFetching ? (
          <TimelineListSkeleton />
        ) : timeline.events.length > 0 ? (
          <>
            <TimelineList
              events={timeline.events}
              onEventOpen={handleMediaOpen}
              onRequestCorrection={directory.openCorrection}
              onTagChange={directory.changeTag}
            />
            {timeline.isTruncated ? (
              <p className="text-center text-body-sm text-secondary">
                이벤트가 많아 최근 200건까지만 표시합니다.
              </p>
            ) : null}
          </>
        ) : (
          <TimelineStatus
            actionLabel={
              hasTimelineFilters(queryFilters) ? "필터 초기화" : "제보하기"
            }
            description={
              hasTimelineFilters(queryFilters)
                ? "검색어나 선택한 조건을 조정해보세요."
                : "아직 기록이 없다면 첫 제보를 남겨보세요."
            }
            onAction={
              hasTimelineFilters(queryFilters)
                ? directory.clearFilters
                : directory.openReport
            }
          >
            {hasTimelineFilters(queryFilters)
              ? "조건에 맞는 타임라인이 없습니다."
              : "해당 날짜에 등록된 타임라인이 없습니다."}
          </TimelineStatus>
        )}
      </section>

      <TimelineMediaDialog
        event={selectedEvent}
        eventId={directory.eventId}
        events={navigationEvents}
        isLoading={navigationQuery.isPending && !selectedEvent}
        mediaFilter={directory.mediaType}
        mediaId={directory.mediaId}
        onClose={handleMediaClose}
        onEventChange={directory.openMediaEvent}
        onMediaChange={directory.changeMedia}
        onMediaFilterChange={handleMediaFilterChange}
        onTagChange={handleMediaTagChange}
      />

      {!isAuthenticated && directory.reportIntent ? (
        <ReportLoginDialog
          intent={directory.reportIntent}
          onClose={directory.closeReportIntent}
        />
      ) : null}
      {isAuthenticated && directory.reportIntent === "report" ? (
        <ReportDialog
          onClose={directory.closeReportIntent}
          onSuccess={handleReportSuccess}
          today={today}
        />
      ) : null}
      {isAuthenticated &&
      directory.reportIntent === "correction" &&
      correctionEvent ? (
        <CorrectionDialog
          event={correctionEvent}
          onClose={directory.closeReportIntent}
          onSuccess={handleReportSuccess}
        />
      ) : null}
    </div>
  );
}

function TimelineStatus({
  actionLabel,
  children,
  description,
  isError = false,
  onAction,
}: {
  actionLabel?: string;
  children: string;
  description?: string;
  isError?: boolean;
  onAction?: () => void;
}) {
  return (
    <div
      className="grid min-h-72 place-items-center rounded-xl bg-surface-muted px-4 text-center"
      role={isError ? "alert" : "status"}
    >
      <div className="space-y-3">
        <p
          className={cn(
            "text-body font-semibold text-primary",
            isError && "text-status-danger",
          )}
        >
          {children}
        </p>
        {description ? (
          <p className="text-body-sm text-secondary">{description}</p>
        ) : null}
        {actionLabel && onAction ? (
          <Button onClick={onAction} size="sm" variant="outline">
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
