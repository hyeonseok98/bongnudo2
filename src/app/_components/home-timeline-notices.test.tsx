import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ useHomeTimeline: vi.fn() }));

vi.mock("@/app/_hooks/use-home-timeline", () => ({
  useHomeTimeline: mocks.useHomeTimeline,
}));

import { HomeTimelineNotices } from "./home-timeline-notices";

describe("HomeTimelineNotices", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("최신 기록을 KST 시각과 상세 링크로 표시함", () => {
    mocks.useHomeTimeline.mockReturnValue({
      data: {
        events: [
          createEvent(
            "00000000-0000-4000-8000-000000000001",
            "날짜를 넘긴 최신 기록",
            "2026-09-13T16:03:00.000Z",
          ),
          createEvent(
            "00000000-0000-4000-8000-000000000002",
            "이전 기록",
            "2026-09-13T15:52:00.000Z",
          ),
        ],
      },
      isError: false,
      isPending: false,
    });

    render(<HomeTimelineNotices />);

    expect(screen.getByText("01:03")).toBeTruthy();
    expect(screen.getByText("00:52")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /날짜를 넘긴 최신 기록/ }).getAttribute("href"),
    ).toBe(
      "/timeline?date=2026-09-14&event=00000000-0000-4000-8000-000000000001",
    );
    expect(screen.getByRole("link", { name: "전체보기" }).getAttribute("href"))
      .toBe("/timeline");
  });

  it("데이터가 없으면 빈 상태를 표시함", () => {
    mocks.useHomeTimeline.mockReturnValue({
      data: { events: [] },
      isError: false,
      isPending: false,
    });

    render(<HomeTimelineNotices />);

    expect(screen.getByText("등록된 타임라인이 없습니다.")).toBeTruthy();
    expect(
      screen.getByText("새로운 기록이 등록되면 이곳에 표시됩니다."),
    ).toBeTruthy();
  });

  it("로딩 중 compact skeleton row 5개를 표시함", () => {
    mocks.useHomeTimeline.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
    });

    render(<HomeTimelineNotices />);

    expect(
      screen.getByRole("status", { name: "최신 타임라인을 불러오는 중" })
        .children,
    ).toHaveLength(5);
  });

  it("Timeline 조회 실패를 카드 내부 오류로 표시함", () => {
    mocks.useHomeTimeline.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
    });

    render(<HomeTimelineNotices />);

    expect(screen.getByRole("alert").textContent).toBe(
      "타임라인을 불러오지 못했습니다.",
    );
    expect(screen.getByText("등록된 서버 공지사항이 없습니다.")).toBeTruthy();
  });
});

function createEvent(id: string, title: string, occurredAt: string) {
  return {
    category: { name: "일상", slug: "daily" },
    id,
    occurredAt,
    title,
  };
}
