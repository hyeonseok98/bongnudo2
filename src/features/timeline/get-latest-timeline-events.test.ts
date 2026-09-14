import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabaseAdminClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdminClient: mocks.getSupabaseAdminClient,
}));

import {
  getLatestTimelineEvents,
  HOME_TIMELINE_EVENT_LIMIT,
} from "./get-latest-timeline-events";

describe("getLatestTimelineEvents", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-14T07:30:00.000Z"));
    mocks.getSupabaseAdminClient.mockReturnValue({ rpc: mocks.rpc });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("기존 Timeline RPC에 최신순과 limit 5를 전달하고 반환 순서를 유지함", async () => {
    const events = Array.from({ length: HOME_TIMELINE_EVENT_LIMIT }, (_, index) =>
      createEvent(
        `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        `${index + 1}번째 기록`,
      ),
    );
    mocks.rpc.mockResolvedValue({ data: { events }, error: null });

    await expect(getLatestTimelineEvents()).resolves.toEqual(events);
    expect(mocks.rpc).toHaveBeenCalledWith("get_timeline_page", {
      p_filters: {
        affiliation: null,
        categorySlug: null,
        dateEnd: "2026-09-14T07:30:00.000Z",
        dateStart: "1970-01-01T00:00:00.000Z",
        job: null,
        limit: HOME_TIMELINE_EVENT_LIMIT,
        participantId: null,
        search: null,
        sort: "desc",
        tagSlug: null,
      },
    });
  });
});

function createEvent(id: string, title: string) {
  return {
    category: { name: "일상", slug: "daily" },
    id,
    occurredAt: "2026-09-14T03:00:00.000Z",
    title,
  };
}
