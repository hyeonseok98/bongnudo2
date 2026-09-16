import {
  infiniteQueryOptions,
  mutationOptions,
  queryOptions,
  type InfiniteData,
} from "@tanstack/react-query";

import {
  createArchive,
  getArchive,
  getArchiveEditorOptions,
  getPublicArchives,
  searchArchiveParticipants,
  getSystemArchiveClips,
  getSystemArchiveClipSummary,
  saveArchive,
} from "@/apis/archives/get-archives";
import type {
  ArchiveListCursor,
  ArchiveListFilters,
  ArchivePage,
  ArchiveSaveInput,
} from "@/features/archives/archive";
import type { ClipCursor, ClipPage, ClipSort } from "@/features/clips/clip";

export const archiveQueries = {
  all: () => ["archives"] as const,
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
      queryKey: [...archiveQueries.all(), "list", filters] as const,
      queryFn: ({ pageParam }) => getPublicArchives(filters, pageParam),
      initialPageParam: null,
      getNextPageParam: (page) => page.nextCursor,
    }),
  participantSearch: (query: string) =>
    queryOptions({
      enabled: query.length > 0,
      queryKey: [...archiveQueries.all(), "participant-search", query] as const,
      queryFn: () => searchArchiveParticipants(query),
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
};

export const archiveMutations = {
  create: () => mutationOptions({ mutationFn: createArchive }),
  save: () => mutationOptions({
    mutationFn: ({ archiveId, input }: { archiveId: string; input: ArchiveSaveInput }) =>
      saveArchive(archiveId, input),
  }),
};
