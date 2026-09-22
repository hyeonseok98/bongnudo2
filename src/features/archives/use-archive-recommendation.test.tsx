import type { PropsWithChildren } from "react";

import { QueryClient, QueryClientProvider, type InfiniteData } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ArchiveDetail, ArchiveListItem, ArchivePage } from "./archive";
import { useArchiveRecommendation } from "./use-archive-recommendation";
import { archiveQueries } from "@/queries/archive-queries";

const mocks = vi.hoisted(() => ({
  toggleArchiveRecommendation: vi.fn(),
}));

vi.mock("@/apis/archives/toggle-archive-recommendation", () => ({
  toggleArchiveRecommendation: mocks.toggleArchiveRecommendation,
}));

const archiveItem: ArchiveListItem = {
  archiveKind: "user",
  category: "other",
  clipCount: 1,
  description: null,
  firstClipCreatedAt: null,
  id: "f7c624e7-2837-4464-88ea-53a7bf905b10",
  lastClipCreatedAt: null,
  ownerName: null,
  publishedAt: "2026-09-22T00:00:00.000Z",
  recommendationCount: 3,
  representativeImageUrl: null,
  sortAt: "2026-09-22T00:00:00.000Z",
  status: "ongoing",
  systemParticipant: null,
  title: "추천 테스트",
  updatedAt: "2026-09-22T00:00:00.000Z",
  viewerRecommended: false,
};

const archiveDetail: ArchiveDetail = {
  archiveKind: "user",
  canEditContent: false,
  canEditMetadata: false,
  category: "other",
  chapters: [],
  creatorName: null,
  currentRevision: 1,
  description: null,
  editPolicy: "owner_only",
  id: archiveItem.id,
  isOwner: false,
  recommendationCount: 3,
  relatedParticipants: [],
  relatedSeasonDays: [],
  seasonId: 2,
  status: "ongoing",
  structureMode: "freeform",
  systemParticipant: null,
  title: archiveItem.title,
  updatedAt: archiveItem.updatedAt,
  viewerRecommended: false,
  visibility: "public",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("useArchiveRecommendation", () => {
  it("목록과 상세 cache를 즉시 갱신하고 서버 결과로 확정합니다", async () => {
    const queryClient = createQueryClient();
    seedArchiveCaches(queryClient);
    mocks.toggleArchiveRecommendation.mockResolvedValue({
      recommendationCount: 4,
      recommended: true,
    });
    const { result } = renderHook(() => useArchiveRecommendation({
      archiveId: archiveItem.id,
      recommendationCount: 3,
      recommended: false,
    }), { wrapper: createWrapper(queryClient) });

    act(() => result.current.toggle());

    await waitFor(() => {
      expect(getListItem(queryClient).recommendationCount).toBe(4);
      expect(getListItem(queryClient).viewerRecommended).toBe(true);
      expect(getDetail(queryClient).recommendationCount).toBe(4);
      expect(getDetail(queryClient).viewerRecommended).toBe(true);
    });
  });

  it("요청 실패 시 목록과 상세 cache snapshot을 복구합니다", async () => {
    const queryClient = createQueryClient();
    seedArchiveCaches(queryClient);
    let rejectRequest: ((error: Error) => void) | undefined;
    mocks.toggleArchiveRecommendation.mockReturnValue(new Promise((_resolve, reject) => {
      rejectRequest = reject;
    }));
    const { result } = renderHook(() => useArchiveRecommendation({
      archiveId: archiveItem.id,
      recommendationCount: 3,
      recommended: false,
    }), { wrapper: createWrapper(queryClient) });

    act(() => result.current.toggle());

    await waitFor(() => {
      expect(getListItem(queryClient).recommendationCount).toBe(4);
      expect(getDetail(queryClient).viewerRecommended).toBe(true);
    });

    act(() => rejectRequest?.(new Error("추천 처리에 실패했습니다.")));

    await waitFor(() => {
      expect(getListItem(queryClient).recommendationCount).toBe(3);
      expect(getListItem(queryClient).viewerRecommended).toBe(false);
      expect(getDetail(queryClient).recommendationCount).toBe(3);
      expect(getDetail(queryClient).viewerRecommended).toBe(false);
    });
  });

  it("빠른 연속 클릭에서도 같은 아카이브 요청은 한 번만 보냅니다", async () => {
    const queryClient = createQueryClient();
    seedArchiveCaches(queryClient);
    let resolveRequest: ((value: { recommendationCount: number; recommended: boolean }) => void) | undefined;
    mocks.toggleArchiveRecommendation.mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    const { result } = renderHook(() => useArchiveRecommendation({
      archiveId: archiveItem.id,
      recommendationCount: 3,
      recommended: false,
    }), { wrapper: createWrapper(queryClient) });

    act(() => {
      result.current.toggle();
      result.current.toggle();
    });

    await waitFor(() => expect(mocks.toggleArchiveRecommendation).toHaveBeenCalledTimes(1));

    act(() => resolveRequest?.({ recommendationCount: 4, recommended: true }));
    await waitFor(() => expect(getListItem(queryClient).viewerRecommended).toBe(true));
  });
});

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function seedArchiveCaches(queryClient: QueryClient): void {
  const listData: InfiniteData<ArchivePage> = {
    pageParams: [null],
    pages: [{ items: [archiveItem], nextCursor: null }],
  };

  queryClient.setQueryData(archiveQueries.list({
    category: null,
    participantId: null,
    query: "",
    sort: "updated",
    status: null,
    type: "all",
  }).queryKey, listData);
  queryClient.setQueryData(archiveQueries.detail(archiveItem.id).queryKey, archiveDetail);
}

function getListItem(queryClient: QueryClient): ArchiveListItem {
  const entries = queryClient.getQueriesData<InfiniteData<ArchivePage>>({
    queryKey: archiveQueries.lists(),
  });
  const item = entries[0]?.[1]?.pages[0]?.items[0];
  if (!item) throw new Error("목록 cache가 없습니다.");
  return item;
}

function getDetail(queryClient: QueryClient): ArchiveDetail {
  const detail = queryClient.getQueryData<ArchiveDetail>(archiveQueries.detail(archiveItem.id).queryKey);
  if (!detail) throw new Error("상세 cache가 없습니다.");
  return detail;
}
