import { z } from "zod";

const participantSearchResponseSchema = z.object({
  participants: z.array(z.object({
    rpName: z.string().nullable(),
    seasonParticipantId: z.uuid(),
    streamerName: z.string(),
  })),
});

export interface ParticipantSearchResult {
  rpName: string | null;
  seasonParticipantId: string;
  streamerName: string;
}

export async function searchReportParticipants(
  query: string,
): Promise<ParticipantSearchResult[]> {
  const searchParams = new URLSearchParams({ query });
  const response = await fetch(`/api/report-participants?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("인물을 검색하지 못했습니다.");
  }

  return participantSearchResponseSchema.parse(await response.json()).participants;
}
