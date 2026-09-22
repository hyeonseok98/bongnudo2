"use client";

import {
  type InfiniteData,
  type QueryKey,
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type {
  ArchiveDetail,
  ArchiveDiscoveryHome,
  ArchiveListItem,
  ArchivePage,
  ArchivePeoplePage,
  ArchivePersonDetail,
} from "@/features/archives/archive";
import type { ArchiveRecommendationResult } from "@/features/archives/archive-recommendation-client";
import { archiveMutations, archiveQueries } from "@/queries/archive-queries";

interface UseArchiveRecommendationOptions extends ArchiveRecommendationResult {
  archiveId: string;
}

interface ArchiveRecommendationSnapshot {
  data: unknown;
  queryKey: QueryKey;
}

export function useArchiveRecommendation({
  archiveId,
  recommendationCount,
  recommended,
}: UseArchiveRecommendationOptions) {
  const queryClient = useQueryClient();
  const mutationOptions = archiveMutations.recommendation(archiveId);
  const relatedMutationCount = useIsMutating({ mutationKey: mutationOptions.mutationKey });
  const mutation = useMutation({
    ...mutationOptions,
    onMutate: async () => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: archiveQueries.detail(archiveId).queryKey }),
        queryClient.cancelQueries({ queryKey: archiveQueries.lists() }),
        queryClient.cancelQueries({ queryKey: archiveQueries.dayRelated() }),
        queryClient.cancelQueries({ queryKey: archiveQueries.persons() }),
        queryClient.cancelQueries({ queryKey: archiveQueries.peopleLists() }),
        queryClient.cancelQueries({ queryKey: archiveQueries.home().queryKey }),
      ]);

      const snapshots = getArchiveRecommendationSnapshots(queryClient, archiveId);
      const optimisticResult = {
        recommendationCount: Math.max(0, recommendationCount + (recommended ? -1 : 1)),
        recommended: !recommended,
      };

      updateArchiveRecommendationCaches(queryClient, archiveId, optimisticResult);
      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      for (const snapshot of context?.snapshots ?? []) {
        queryClient.setQueryData(snapshot.queryKey, snapshot.data);
      }
    },
    onSuccess: (result) => {
      updateArchiveRecommendationCaches(queryClient, archiveId, result);
    },
  });

  return {
    error: mutation.error,
    isPending: mutation.isPending || relatedMutationCount > 0,
    toggle: () => {
      if (queryClient.isMutating({ mutationKey: mutationOptions.mutationKey }) === 0) {
        mutation.mutate();
      }
    },
  };
}

function getArchiveRecommendationSnapshots(
  queryClient: ReturnType<typeof useQueryClient>,
  archiveId: string,
): ArchiveRecommendationSnapshot[] {
  const queries = [
    ...queryClient.getQueriesData({ queryKey: archiveQueries.detail(archiveId).queryKey }),
    ...queryClient.getQueriesData({ queryKey: archiveQueries.lists() }),
    ...queryClient.getQueriesData({ queryKey: archiveQueries.dayRelated() }),
    ...queryClient.getQueriesData({ queryKey: archiveQueries.persons() }),
    ...queryClient.getQueriesData({ queryKey: archiveQueries.peopleLists() }),
    ...queryClient.getQueriesData({ queryKey: archiveQueries.home().queryKey }),
  ];

  return queries.map(([queryKey, data]) => ({ data, queryKey }));
}

function updateArchiveRecommendationCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  archiveId: string,
  result: ArchiveRecommendationResult,
): void {
  queryClient.setQueryData<ArchiveDiscoveryHome>(archiveQueries.home().queryKey, (data) => data ? {
    ...data,
    featured: data.featured.map((archive) => patchArchiveRecommendation(archive, archiveId, result)),
    recent: data.recent.map((archive) => patchArchiveRecommendation(archive, archiveId, result)),
  } : data);
  queryClient.setQueryData<ArchiveDetail>(
    archiveQueries.detail(archiveId).queryKey,
    (archive) => archive ? patchArchiveRecommendation(archive, archiveId, result) : archive,
  );
  queryClient.setQueriesData<InfiniteData<ArchivePage>>(
    { queryKey: archiveQueries.lists() },
    (data) => data ? {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.map((archive) => patchArchiveRecommendation(archive, archiveId, result)),
      })),
    } : data,
  );
  queryClient.setQueriesData<ArchiveListItem[]>(
    { queryKey: archiveQueries.dayRelated() },
    (archives) => archives?.map((archive) => patchArchiveRecommendation(archive, archiveId, result)),
  );
  queryClient.setQueriesData<ArchivePersonDetail>(
    { queryKey: archiveQueries.persons() },
    (detail) => detail ? {
      ...detail,
      relatedArchives: detail.relatedArchives.map((archive) => (
        patchArchiveRecommendation(archive, archiveId, result)
      )),
    } : detail,
  );
  queryClient.setQueriesData<InfiniteData<ArchivePeoplePage>>(
    { queryKey: archiveQueries.peopleLists() },
    (data) => data ? {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.map((section) => ({
          ...section,
          archives: section.archives.map((archive) => (
            patchArchiveRecommendation(archive, archiveId, result)
          )),
        })),
      })),
    } : data,
  );
}

function patchArchiveRecommendation<
  T extends { id: string; recommendationCount: number; viewerRecommended: boolean },
>(
  archive: T,
  archiveId: string,
  result: ArchiveRecommendationResult,
): T {
  return archive.id === archiveId
    ? {
        ...archive,
        recommendationCount: result.recommendationCount,
        viewerRecommended: result.recommended,
      }
    : archive;
}
