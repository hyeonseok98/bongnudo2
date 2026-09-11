import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { getCurrentLiveStreams } from "@/features/live/get-current-live-streams";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!hasValidCronAuthorization(request)) {
    return NextResponse.json(
      { message: "인증되지 않은 요청임." },
      { status: 401 },
    );
  }

  try {
    const sampledAt = getMinuteSampledAt(new Date());
    const liveStreams = await getCurrentLiveStreams();

    if (liveStreams.length === 0) {
      return NextResponse.json({ stored: 0 });
    }

    const snapshots = liveStreams.map(({ seasonParticipantId, broadcast }) => ({
      season_participant_id: seasonParticipantId,
      viewer_count: broadcast.concurrentUserCount,
      sampled_at: sampledAt,
    }));

    const result = await getSupabaseAdminClient()
      .from("live_viewer_snapshots")
      .upsert(snapshots, {
        ignoreDuplicates: true,
        onConflict: "season_participant_id,sampled_at",
      })
      .select("id");

    if (result.error) {
      throw new Error("시청자 수 스냅샷을 저장하지 못함.", {
        cause: result.error,
      });
    }

    return NextResponse.json({ stored: result.data.length });
  } catch (error) {
    console.error("Failed to collect live viewer snapshots", error);

    return NextResponse.json(
      { message: "시청자 수 스냅샷을 수집하지 못함." },
      { status: 500 },
    );
  }
}

export function getMinuteSampledAt(date: Date): string {
  const sampledAt = new Date(date);
  sampledAt.setUTCSeconds(0, 0);

  return sampledAt.toISOString();
}

function hasValidCronAuthorization(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || !authorization?.startsWith("Bearer ")) {
    return false;
  }

  const receivedSecret = authorization.slice("Bearer ".length);
  const expectedBuffer = Buffer.from(cronSecret);
  const receivedBuffer = Buffer.from(receivedSecret);

  return expectedBuffer.length === receivedBuffer.length
    && timingSafeEqual(expectedBuffer, receivedBuffer);
}
