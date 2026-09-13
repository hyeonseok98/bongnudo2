"use client";

import {
  buildCharacterFilterFacetData,
  buildJobAffiliationFilterNodes,
  buildStreamerAffiliationFilterData,
} from "@/app/characters/_utils/character-directory";
import { SelectedFilterSummary } from "@/app/characters/_components/selected-filter-summary";
import {
  getFilterNodeLabel,
  type HierarchicalFilterSelection,
} from "@/components/filters/hierarchical-filter";
import { Select } from "@/components/ui/select";
import { isLiveSort } from "@/features/live/live-stream";

import { useCharacters } from "../../characters/_hooks/use-characters";
import { useLiveBroadcasts } from "../_hooks/use-live-broadcasts";
import { useLiveDirectory } from "../_hooks/use-live-directory";
import {
  buildLiveStreams,
  filterLiveStreams,
  sortLiveStreams,
} from "../_utils/live-directory";
import { LiveFilters } from "./live-filters";
import { LiveGrid } from "./live-grid";

export function LiveContent() {
  const directory = useLiveDirectory();
  const charactersQuery = useCharacters();
  const broadcastsQuery = useLiveBroadcasts();
  const characters = charactersQuery.data?.characters ?? [];
  const streamerAffiliations = charactersQuery.data?.streamerAffiliations ?? [];
  const streams = buildLiveStreams(
    broadcastsQuery.data?.broadcasts ?? [],
    characters,
  );
  const liveCharacters = streams.map((stream) => stream.character);
  const filterCriteria = {
    query: directory.q,
    jobSelection: directory.jobSelection,
    streamerAffiliationSelection: directory.streamerAffiliationSelection,
  };
  const allJobNodes = buildJobAffiliationFilterNodes(liveCharacters);
  const filterFacetData = buildCharacterFilterFacetData(
    liveCharacters,
    streamerAffiliations,
    filterCriteria,
  );
  const allStreamerAffiliationFilterData = buildStreamerAffiliationFilterData(
    liveCharacters,
    streamerAffiliations,
  );
  const selectedJobs = directory.jobSelection.ids.map((id) => ({
    id,
    label: getFilterNodeLabel(allJobNodes, id) ?? id,
  }));
  const selectedStreamerAffiliations =
    directory.streamerAffiliationSelection.ids.map((slug) => ({
      slug,
      label:
        streamerAffiliations.find((affiliation) => affiliation.slug === slug)
          ?.name ?? slug,
    }));
  const filteredStreams = filterLiveStreams(
    streams,
    filterCriteria,
    streamerAffiliations,
  );
  const sortedStreams = sortLiveStreams(filteredStreams, directory.sort);

  function getJobResultCount(selection: HierarchicalFilterSelection) {
    return filterLiveStreams(
      streams,
      { ...filterCriteria, jobSelection: selection },
      streamerAffiliations,
    ).length;
  }

  function getStreamerAffiliationResultCount(
    selection: HierarchicalFilterSelection,
  ) {
    return filterLiveStreams(
      streams,
      { ...filterCriteria, streamerAffiliationSelection: selection },
      streamerAffiliations,
    ).length;
  }

  if (
    charactersQuery.isPending
    || (broadcastsQuery.isPending && !broadcastsQuery.data)
  ) {
    return (
      <div className="space-y-6">
        <LiveDirectoryHeading />
        <p className="text-body-sm text-secondary" role="status">
          실시간 방송 정보를 불러오는 중입니다.
        </p>
      </div>
    );
  }

  if (
    charactersQuery.isError
    || (broadcastsQuery.isError && !broadcastsQuery.data)
  ) {
    return (
      <div className="space-y-6">
        <LiveDirectoryHeading />
        <p className="text-body-sm text-status-danger" role="alert">
          실시간 방송 정보를 불러오지 못함.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LiveDirectoryHeading />

      <LiveFilters
        getJobResultCount={getJobResultCount}
        getStreamerAffiliationResultCount={
          getStreamerAffiliationResultCount
        }
        jobLabelNodes={allJobNodes}
        jobNodes={filterFacetData.jobNodes}
        jobValue={directory.jobSelection}
        query={directory.q}
        streamerAffiliationSelection={directory.streamerAffiliationSelection}
        streamerAffiliationNodes={filterFacetData.streamerAffiliations.nodes}
        streamerAffiliationLabelNodes={
          allStreamerAffiliationFilterData.nodes
        }
        streamerAffiliationQuickOptions={
          filterFacetData.streamerAffiliations.quickOptions
        }
        onJobApply={directory.applyJobs}
        onQueryChange={directory.changeQuery}
        onStreamerAffiliationsApply={directory.applyStreamerAffiliations}
      />

      <SelectedFilterSummary
        selectedJobs={selectedJobs}
        selectedStreamerAffiliations={selectedStreamerAffiliations}
        onClearAll={directory.resetFilters}
        onRemoveJob={directory.removeJob}
        onRemoveStreamerAffiliation={directory.removeStreamerAffiliation}
      />

      <section aria-labelledby="live-results-heading" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2
            className="text-body-sm text-secondary"
            id="live-results-heading"
          >
            현재 LIVE{" "}
            <strong className="font-semibold text-brand-text">
              {sortedStreams.length}명
            </strong>
          </h2>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-body-sm text-secondary">정렬</span>
            <Select
              label="LIVE 정렬"
              onChange={(event) => {
                if (isLiveSort(event.target.value)) {
                  directory.changeSort(event.target.value);
                }
              }}
              value={directory.sort}
            >
              <option value="viewers">시청자순 ↓</option>
              <option value="viewers-asc">시청자순 ↑</option>
              <option value="asc">가나다순 ↑</option>
              <option value="desc">가나다순 ↓</option>
            </Select>
          </div>
        </div>

        <div className="min-h-[55vh]">
          {sortedStreams.length > 0 ? (
            <LiveGrid streams={sortedStreams} />
          ) : (
            <LiveEmptyState hasLiveStreams={streams.length > 0} />
          )}
        </div>
      </section>
    </div>
  );
}

function LiveDirectoryHeading() {
  return (
    <div>
      <h1 className="text-title font-bold text-primary">실시간 현황</h1>
      <p className="mt-1 text-body text-secondary">
        현재 방송 중인 봉누도2 참가자를 확인해보세요.
      </p>
    </div>
  );
}

function LiveEmptyState({ hasLiveStreams }: { hasLiveStreams: boolean }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center bg-surface-muted px-5 py-10 text-center">
      <p className="text-heading-sm font-semibold text-primary">
        {hasLiveStreams
          ? "조건에 맞는 LIVE 방송이 없습니다."
          : "현재 방송 중인 참가자가 없습니다."}
      </p>
      {hasLiveStreams ? (
        <p className="mt-1 text-body-sm text-secondary">
          검색어나 선택한 필터를 변경해보세요.
        </p>
      ) : null}
    </div>
  );
}
