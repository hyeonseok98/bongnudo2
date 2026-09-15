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

  it("검색 결과에 치지직 LIVE URL을 추가하면서 기존 필드를 유지함", async () => {
    const participantId = "00000000-0000-4000-8000-000000000001";
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          organization_name: "EMS",
          profile_image_key: "rp/do-hyeonjeong.webp",
          role: "원장",
          rp_name: "도현정",
          season_participant_id: participantId,
          streamer_name: "강지",
        },
      ],
      error: null,
    });
    const inFilter = vi.fn().mockResolvedValue({
      data: [{
        id: participantId,
        streamer: { chzzk_channel_id: "bdc57cc4217173f0e89f63fba2f1c6e5" },
      }],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ in: inFilter });
    const from = vi.fn().mockReturnValue({ select });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ rpc, from } as never);

    await expect(searchReportParticipants("도현정")).resolves.toEqual([
      {
        chzzkLiveUrl:
          "https://chzzk.naver.com/live/bdc57cc4217173f0e89f63fba2f1c6e5",
        organizationName: "EMS",
        profileImageUrl: "https://images.example.com/rp/do-hyeonjeong.webp",
        role: "원장",
        rpName: "도현정",
        seasonParticipantId: "00000000-0000-4000-8000-000000000001",
        streamerName: "강지",
      },
    ]);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("season_participants");
    expect(inFilter).toHaveBeenCalledWith("id", [participantId]);
  });

  it("치지직 channel id가 비어 있으면 LIVE URL을 null로 반환함", async () => {
    const participantId = "00000000-0000-4000-8000-000000000001";
    const rpc = vi.fn().mockResolvedValue({
      data: [{
        organization_name: null,
        profile_image_key: null,
        role: null,
        rp_name: "RP 이름",
        season_participant_id: participantId,
        streamer_name: "스트리머",
      }],
      error: null,
    });
    const inFilter = vi.fn().mockResolvedValue({
      data: [{ id: participantId, streamer: { chzzk_channel_id: "  " } }],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ in: inFilter });
    const from = vi.fn().mockReturnValue({ select });
    vi.mocked(getSupabaseAdminClient).mockReturnValue({ rpc, from } as never);

    await expect(searchReportParticipants("RP 이름")).resolves.toMatchObject([
      { chzzkLiveUrl: null },
    ]);
  });
});
