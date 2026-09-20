import {
  infiniteQueryOptions,
  keepPreviousData,
  mutationOptions,
  queryOptions,
  type InfiniteData,
} from "@tanstack/react-query";

import {
  createArchive,
  deleteArchive,
  getArchive,
  getArchiveEditorOptions,
  getArchivePersonDetail,
  getArchivePeopleSections,
  getMyArchives,
  getPublicArchivesForSeasonDay,
  getPublicArchives,
  searchArchiveParticipants,
  getSystemArchiveClips,
  getSystemArchiveClipNeighbors,
  getSystemArchiveClipSummary,
  saveArchive,
  restoreArchive,
} from "@/apis/archives/get-archives";
import type {
  ArchiveListCursor,
  ArchiveListFilters,
  ArchivePage,
  ArchivePeopleFilters,
  ArchivePeoplePage,
  ArchiveSaveInput,
  MyArchiveCursor,
  MyArchivePage,
  MyArchiveTab,
} from "@/features/archives/archive";
import type { ClipCursor, ClipPage, ClipSort } from "@/features/clips/clip";

export const archiveQueries = {
  all: () => ["archives"] as const,
  lists: () => [...archiveQueries.all(), "list"] as const,
  my: () => [...archiveQueries.all(), "my"] as const,
  myListKey: (tab: MyArchiveTab) => [...archiveQueries.my(), tab] as const,
  detail: (archiveId: string) =>
    queryOptions({
      queryKey: [...archiveQueries.all(), "detail", archiveId] as const,
      queryFn: () => getArchive(archiveId),
    }),
  editorOptions: () =>
    queryOptions({
      queryKey: [...archiveQueries.all(), "editor-options"] as const,
      queryFn: getArchiveEditorOptions,
    }),
  list: (filters: ArchiveListFilters) =>
    infiniteQueryOptions<
      ArchivePage,
      Error,
      InfiniteData<ArchivePage, ArchiveListCursor | null>,
      readonly ["archives", "list", ArchiveListFilters],
      ArchiveListCursor | null
    >({
      queryKey: [...archiveQueries.lists(), filters] as const,
      queryFn: ({ pageParam }) => getPublicArchives(filters, pageParam),
      placeholderData: keepPreviousData,
      initialPageParam: null,
      getNextPageParam: (page) => page.nextCursor,
    }),
  dayRelatedArchives: (seasonDayId: string | null) =>
    queryOptions({
      enabled: seasonDayId !== null,
      queryKey: [...archiveQueries.all(), "day-related", seasonDayId] as const,
      queryFn: () => {
        if (!seasonDayId) {
          throw new Error("봉누도 일차 정보가 올바르지 않습니다.");
        }

        return getPublicArchivesForSeasonDay(seasonDayId);
      },
    }),
  myList: (tab: MyArchiveTab) =>
    infiniteQueryOptions<
      MyArchivePage,
      Error,
      InfiniteData<MyArchivePage, MyArchiveCursor | null>,
      readonly ["archives", "my", MyArchiveTab],
      MyArchiveCursor | null
    >({
      queryKey: archiveQueries.myListKey(tab),
      queryFn: ({ pageParam }) => getMyArchives(tab, pageParam),
      initialPageParam: null,
      getNextPageParam: (page) => page.nextCursor,
    }),
  participantSearch: (query: string) =>
    queryOptions({
      enabled: query.length > 0,
      queryKey: [...archiveQueries.all(), "participant-search", query] as const,
      queryFn: () => searchArchiveParticipants(query),
    }),
  person: (participantId: string | null) =>
    queryOptions({
      enabled: participantId !== null,
      queryKey: [...archiveQueries.all(), "person", participantId] as const,
      queryFn: () => {
        if (!participantId) {
          throw new Error("인물 정보가 올바르지 않습니다.");
        }

        return getArchivePersonDetail(participantId);
      },
    }),
  people: (filters: ArchivePeopleFilters) =>
    infiniteQueryOptions<
      ArchivePeoplePage,
      Error,
      InfiniteData<ArchivePeoplePage, string | null>,
      readonly ["archives", "people", ArchivePeopleFilters],
      string | null
    >({
      queryKey: [...archiveQueries.all(), "people", filters] as const,
      queryFn: ({ pageParam }) => getArchivePeopleSections(filters, pageParam),
      initialPageParam: null,
      getNextPageParam: (page) => page.nextCursor,
      placeholderData: keepPreviousData,
    }),
  systemClipSummary: (archiveId: string) =>
    queryOptions({
      queryKey: [...archiveQueries.all(), "system-clip-summary", archiveId] as const,
      queryFn: () => getSystemArchiveClipSummary(archiveId),
    }),
  systemClips: (
    archiveId: string,
    { day, sort }: { day: number | null; sort: ClipSort },
  ) =>
    infiniteQueryOptions<
      ClipPage,
      Error,
      InfiniteData<ClipPage, ClipCursor | null>,
      readonly ["archives", "system-clips", string, number | null, ClipSort],
      ClipCursor | null
    >({
      queryKey: [
        ...archiveQueries.all(),
        "system-clips",
        archiveId,
        day,
        sort,
      ] as const,
      queryFn: ({ pageParam }) =>
        getSystemArchiveClips(archiveId, { cursor: pageParam, day, sort }),
      initialPageParam: null,
      getNextPageParam: (page) => page.nextCursor,
    }),
  systemClipNeighbors: (
    archiveId: string,
    clipId: string | null,
    { day, sort }: { day: number | null; sort: ClipSort },
  ) =>
    queryOptions({
      enabled: clipId !== null,
      queryKey: [
        ...archiveQueries.all(),
        "system-clip-neighbors",
        archiveId,
        clipId,
        day,
        sort,
      ] as const,
      queryFn: () => {
        if (clipId === null) {
          throw new Error("클립 정보가 올바르지 않습니다.");
        }

        return getSystemArchiveClipNeighbors(archiveId, clipId, { day, sort });
      },
    }),
};

export const archiveMutations = {
  create: () => mutationOptions({ mutationFn: createArchive }),
  save: () => mutationOptions({
    mutationFn: ({ archiveId, input }: { archiveId: string; input: ArchiveSaveInput }) =>
      saveArchive(archiveId, input),
  }),
  softDelete: () => mutationOptions({ mutationFn: deleteArchive }),
  restore: () => mutationOptions({ mutationFn: restoreArchive }),
};
