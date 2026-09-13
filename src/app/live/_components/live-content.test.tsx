import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useCharacters: vi.fn(),
  useLiveBroadcasts: vi.fn(),
  useLiveDirectory: vi.fn(),
}));

vi.mock("../../characters/_hooks/use-characters", () => ({
  useCharacters: mocks.useCharacters,
}));
vi.mock("../_hooks/use-live-broadcasts", () => ({
  useLiveBroadcasts: mocks.useLiveBroadcasts,
}));
vi.mock("../_hooks/use-live-directory", () => ({
  useLiveDirectory: mocks.useLiveDirectory,
}));
vi.mock("./live-filters", () => ({ LiveFilters: () => null }));
vi.mock("./live-grid", () => ({ LiveGrid: () => <div>LIVE grid</div> }));
vi.mock("../../characters/_components/selected-filter-summary", () => ({
  SelectedFilterSummary: () => null,
}));

import { LiveContent } from "./live-content";

describe("LiveContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useCharacters.mockReturnValue({
      data: {
        characters: [{
          id: "participant-1",
          streamerId: "streamer-1",
          chzzkChannelId: "channel-1",
          slug: "streamer-1",
          streamerName: "스트리머",
          rpName: null,
          profileImageUrl: null,
          channelUrl: null,
          streamerAffiliations: [],
          affiliations: [],
          roleHistories: [],
        }],
        streamerAffiliations: [],
      },
      isError: false,
      isPending: false,
    });
    mocks.useLiveBroadcasts.mockReturnValue({
      data: {
        broadcasts: [{
          liveId: 1,
          title: "방송 제목",
          thumbnailUrl: "https://example.com/thumbnail.jpg",
          concurrentUserCount: 123,
          channelId: "channel-1",
          channelName: "스트리머",
        }],
        refreshedAt: "2026-09-12T10:00:00.000Z",
      },
      isError: false,
      isPending: false,
    });
    mocks.useLiveDirectory.mockReturnValue({
      q: "",
      jobSelection: { ids: [] },
      streamerAffiliationSelection: { ids: [] },
      sort: "viewers",
      changeQuery: vi.fn(),
      applyJobs: vi.fn(),
      applyStreamerAffiliations: vi.fn(),
      removeJob: vi.fn(),
      removeStreamerAffiliation: vi.fn(),
      changeSort: vi.fn(),
      resetFilters: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("background refetch가 실패해도 기존 성공 데이터를 유지함", () => {
    mocks.useLiveBroadcasts.mockReturnValue({
      ...mocks.useLiveBroadcasts(),
      isError: true,
    });

    render(<LiveContent />);

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("LIVE grid")).toBeTruthy();
  });

  it("시청자 수 오름차순과 내림차순을 선택할 수 있음", () => {
    render(<LiveContent />);

    expect(screen.getByRole("option", { name: "시청자순 ↓" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "시청자순 ↑" })).toBeTruthy();

    fireEvent.change(screen.getByRole("combobox", { name: "LIVE 정렬" }), {
      target: { value: "viewers-asc" },
    });

    expect(mocks.useLiveDirectory().changeSort).toHaveBeenCalledWith(
      "viewers-asc",
    );
  });
});
