import { mutationOptions, queryOptions } from "@tanstack/react-query";

import {
  createArchive,
  getArchive,
  getArchiveEditorOptions,
  saveArchive,
} from "@/apis/archives/get-archives";
import type { ArchiveSaveInput } from "@/features/archives/archive";

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
};

export const archiveMutations = {
  create: () => mutationOptions({ mutationFn: createArchive }),
  save: () => mutationOptions({
    mutationFn: ({ archiveId, input }: { archiveId: string; input: ArchiveSaveInput }) =>
      saveArchive(archiveId, input),
  }),
};
