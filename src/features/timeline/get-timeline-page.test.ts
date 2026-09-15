import { describe, expect, it, vi } from "vitest";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

import { getTimelinePage } from "./get-timeline-page";

vi.mock("@/lib/r2", () => ({
  getR2PublicUrl: vi.fn((key: string | null) =>
    key ? `https://images.example.com/${key}` : null,
  ),
}));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdminClient: vi.fn(),
}));

describe("getTimelinePage", () => {
  it("클립 외부 메타데이터를 기다리지 않고 썸네일을 lazy 상태로 반환함", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        categories: [{ name: "일상", slug: "daily" }],
        events: [
          {
            category: { name: "일상", slug: "daily" },
            content: "내용",
            createdAt: "2026-09-14T03:00:00.000Z",
            id: "00000000-0000-4000-8000-000000000001",
            media: [
              {
                clipUrl: "https://chzzk.naver.com/clips/clip-id",
                id: "00000000-0000-4000-8000-000000000002",
                mediaType: "chzzk_clip",
                objectKey: null,
              },
            ],
            occurredAt: "2026-09-14T02:00:00.000Z",
            participants: [],
            reportCount: 1,
            tags: [],
            title: "클립 기록",
          },
        ],
        isTruncated: false,
        popularTags: [],
        totalCount: 1,
      },
      error: null,
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ rpc } as never);

    const page = await getTimelinePage({
      affiliation: "",
      category: "",
      date: "2026-09-14",
      day: 0,
      job: "",
      participant: "",
      query: "",
      scope: "page",
      sort: "desc",
      tag: "",
      viewMode: "date",
    });

    expect(page.events[0]?.media).toEqual([
      {
        clipUrl: "https://chzzk.naver.com/clips/clip-id",
        id: "00000000-0000-4000-8000-000000000002",
        mediaType: "chzzk_clip",
        thumbnailUrl: null,
      },
    ]);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
