import { beforeEach, describe, expect, it, vi } from "vitest";

import { getR2PublicUrl } from "@/lib/r2";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

import { searchReportParticipants } from "./search-report-participants";

vi.mock("@/lib/r2", () => ({ getR2PublicUrl: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdminClient: vi.fn(),
}));

describe("searchReportParticipants", () => {
  beforeEach(() => {
    vi.mocked(getR2PublicUrl).mockImplementation((key) =>
      key ? `https://images.example.com/${key}` : null,
    );
  });

  it("검색 RPC 한 번으로 프로필 이미지를 포함한 결과를 반환함", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          organization_name: "EMS",
          profile_image_key: "rp/do-hyeonjeong.webp",
          role: "원장",
          rp_name: "도현정",
          season_participant_id: "00000000-0000-4000-8000-000000000001",
          streamer_name: "강지",
        },
      ],
      error: null,
    });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ rpc } as never);

    await expect(searchReportParticipants("도현정")).resolves.toEqual([
      {
        organizationName: "EMS",
        profileImageUrl: "https://images.example.com/rp/do-hyeonjeong.webp",
        role: "원장",
        rpName: "도현정",
        seasonParticipantId: "00000000-0000-4000-8000-000000000001",
        streamerName: "강지",
      },
    ]);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
