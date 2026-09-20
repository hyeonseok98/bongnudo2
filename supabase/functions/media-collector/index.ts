import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.115.0";
import { z } from "npm:zod@4.5.4";

const BATCH_SIZE = 24;
const CONCURRENCY = 4;
const RECENT_LOOKBACK_MILLISECONDS = 72 * 60 * 60 * 1_000;
const FIRST_REPLAY_PAGE = 0;
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 15_000;

const collectorKindSchema = z.enum(["clips", "replays"]);
const runClaimSchema = z.object({
  lease_token: z.string().uuid(),
  next_offset: z.number().int().nonnegative(),
  run_id: z.string().uuid(),
  season_id: z.number().int(),
  target_count: z.number().int().nonnegative(),
});
const seasonDaySchema = z.object({ ends_at: z.string().min(1), id: z.string().uuid(), season_id: z.number().int(), starts_at: z.string().min(1) });
const targetSchema = z.object({
  id: z.string().uuid(), season_id: z.number().int(), streamer_id: z.string().uuid(),
  streamer: z.object({ chzzk_channel_id: z.string().min(1).nullable(), id: z.string().uuid(), name: z.string().min(1) }),
});
const existingClipSchema = z.object({ duration_seconds: z.number().int().nullable(), provider_clip_id: z.string().min(1), provider_video_id: z.string().nullable(), thumbnail_url: z.string().nullable(), title: z.string(), view_count: z.number().int().nullable() });
const existingReplaySchema = z.object({ duration_seconds: z.number().int().nullable(), live_started_at: z.string().min(1).nullable(), provider_video_id: z.string().min(1), provider_video_no: z.number().int().nullable(), published_at: z.string().min(1).nullable(), thumbnail_url: z.string().nullable(), title: z.string(), view_count: z.number().int().nullable() });
const clipItemSchema = z.object({ clipUID: z.string().min(1), clipTitle: z.string().min(1), createdDate: z.string().min(1), duration: z.number().finite().nonnegative().nullish(), readCount: z.number().finite().nonnegative().nullish(), thumbnailImageUrl: z.string().url().nullish(), videoId: z.string().min(1).nullish() });
const replayItemSchema = z.object({ duration: z.number().finite().nonnegative().nullish(), publishDate: z.string().min(1).nullish(), publishDateAt: z.number().finite().nonnegative().nullish(), readCount: z.number().finite().nonnegative().nullish(), thumbnailImageUrl: z.string().url().nullish(), videoId: z.string().min(1).nullish(), videoNo: z.number().finite().int().nonnegative(), videoTitle: z.string().min(1), videoType: z.string().min(1) });
const clipResponseSchema = z.object({ content: z.object({ data: z.array(clipItemSchema), page: z.object({ next: z.object({ clipUID: z.string().min(1) }).nullable() }).nullish() }) });
const replayResponseSchema = z.object({ content: z.object({ data: z.array(replayItemSchema).optional().default([]), totalPages: z.number().int().nonnegative().nullish() }) });
const replayDetailResponseSchema = z.object({ content: z.object({ liveOpenDate: z.string().min(1).nullable().optional() }) });

interface SeasonDay { endsAt: string; id: string; startsAt: string; }
interface CollectorTarget { channelId: string | null; seasonId: number; seasonParticipantId: string; streamerId: string; streamerName: string; }
interface ChzzkClip { clipCreatedAt: string; clipId: string; durationSeconds: number | null; providerVideoId: string | null; thumbnailUrl: string | null; title: string; url: string; viewCount: number | null; }
interface ChzzkReplay { durationSeconds: number | null; providerVideoId: string; providerVideoNo: number; publishedAt: string | null; thumbnailUrl: string | null; title: string; url: string; viewCount: number | null; }
interface ExistingClip { durationSeconds: number | null; providerVideoId: string | null; thumbnailUrl: string | null; title: string; viewCount: number | null; }
interface ExistingReplay { durationSeconds: number | null; liveStartedAt: string | null; providerVideoNo: number | null; publishedAt: string | null; thumbnailUrl: string | null; title: string; viewCount: number | null; }
interface CollectionResult { discovered: number; inserted: number; pages: number; updated: number; }
interface CollectionSummary extends CollectionResult { failed: number; }

Deno.serve(async (request) => {
  if (request.method !== "POST" || !hasValidAuthorization(request)) return Response.json({ message: "인증되지 않은 요청임." }, { status: 401 });

  const kind = await getCollectorKind(request);
  if (kind === null) return Response.json({ message: "수집 종류가 올바르지 않음." }, { status: 400 });

  const client = createServiceClient();
  let claim: z.infer<typeof runClaimSchema> | null = null;

  try {
    claim = await claimBatch(client, kind);
    if (claim === null) return Response.json({ kind, status: "already_running" }, { status: 202 });

    const [seasonDays, targets] = await Promise.all([
      loadSeasonDays(client, claim.season_id),
      loadTargets(client, claim.season_id, claim.next_offset),
    ]);
    const summary = await collectTargets(client, kind, targets, seasonDays);
    const isLastBatch = targets.length < BATCH_SIZE || claim.next_offset + targets.length >= claim.target_count;
    const completion = await completeBatch(client, claim, summary, targets.length, isLastBatch);
    if (completion.has_more) await dispatchNextBatch(client, claim.run_id);

    return Response.json({ kind, processedParticipantCount: targets.length, status: completion.status, summary });
  } catch (error) {
    if (claim !== null) await failRun(client, claim, getErrorMessage(error));
    console.error("Media collector worker failed", error);
    return Response.json({ message: "미디어 수집 작업에 실패함." }, { status: 500 });
  }
});

function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase 서비스 환경변수가 설정되지 않음.");
  return createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

function hasValidAuthorization(request: Request): boolean {
  const expectedSecret = Deno.env.get("MEDIA_COLLECTOR_CRON_SECRET");
  const authorization = request.headers.get("authorization");
  return Boolean(expectedSecret && authorization?.startsWith("Bearer ") && securelyEqual(expectedSecret, authorization.slice("Bearer ".length)));
}

function securelyEqual(expected: string, received: string): boolean {
  const expectedBytes = new TextEncoder().encode(expected);
  const receivedBytes = new TextEncoder().encode(received);
  const maxLength = Math.max(expectedBytes.length, receivedBytes.length);
  let difference = expectedBytes.length ^ receivedBytes.length;
  for (let index = 0; index < maxLength; index += 1) difference |= (expectedBytes[index] ?? 0) ^ (receivedBytes[index] ?? 0);
  return difference === 0;
}

async function getCollectorKind(request: Request): Promise<z.infer<typeof collectorKindSchema> | null> {
  const body: unknown = await request.json().catch(() => null);
  const result = z.object({ kind: collectorKindSchema }).safeParse(body);
  return result.success ? result.data.kind : null;
}

async function claimBatch(client: SupabaseClient, kind: z.infer<typeof collectorKindSchema>): Promise<z.infer<typeof runClaimSchema> | null> {
  const { data, error } = await client.rpc("claim_media_collector_batch", { p_collector_kind: kind });
  if (error) throw new Error("수집 작업을 시작하지 못함.");
  return z.array(runClaimSchema).parse(data)[0] ?? null;
}

async function loadSeasonDays(client: SupabaseClient, seasonId: number): Promise<SeasonDay[]> {
  const { data, error } = await client.from("season_days").select("id, season_id, starts_at, ends_at").eq("season_id", seasonId).order("starts_at", { ascending: true });
  if (error) throw new Error("시즌 일차를 불러오지 못함.");
  return z.array(seasonDaySchema).parse(data).map((day) => ({ endsAt: day.ends_at, id: day.id, startsAt: day.starts_at }));
}

async function loadTargets(client: SupabaseClient, seasonId: number, offset: number): Promise<CollectorTarget[]> {
  const { data, error } = await client
    .from("season_participants")
    .select("id, season_id, streamer_id, streamer:streamers!inner(id, name, chzzk_channel_id)")
    .eq("season_id", seasonId)
    .not("streamer.chzzk_channel_id", "is", null)
    .order("id", { ascending: true })
    .range(offset, offset + BATCH_SIZE - 1);
  if (error) throw new Error("수집 대상을 불러오지 못함.");
  return z.array(targetSchema).parse(data).map((target) => ({ channelId: target.streamer.chzzk_channel_id, seasonId: target.season_id, seasonParticipantId: target.id, streamerId: target.streamer_id, streamerName: target.streamer.name }));
}

async function collectTargets(client: SupabaseClient, kind: z.infer<typeof collectorKindSchema>, targets: CollectorTarget[], seasonDays: SeasonDay[]): Promise<CollectionSummary> {
  const results = await runWithConcurrency(targets, async (target) => {
    if (!target.channelId) return { discovered: 0, inserted: 0, pages: 0, updated: 0 };
    return kind === "clips" ? collectTargetClips(client, target, seasonDays) : collectTargetReplays(client, target, seasonDays);
  });
  return results.reduce<CollectionSummary>((summary, result) => {
    if (result instanceof Error) {
      console.warn("미디어 대상 수집 실패", result.message);
      return { ...summary, failed: summary.failed + 1 };
    }
    return { discovered: summary.discovered + result.discovered, failed: summary.failed, inserted: summary.inserted + result.inserted, pages: summary.pages + result.pages, updated: summary.updated + result.updated };
  }, { discovered: 0, failed: 0, inserted: 0, pages: 0, updated: 0 });
}

async function runWithConcurrency<T, TResult>(values: T[], run: (value: T) => Promise<TResult>): Promise<Array<TResult | Error>> {
  const results: Array<TResult | Error> = [];
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, values.length) }, async () => {
    while (nextIndex < values.length) {
      const value = values[nextIndex];
      nextIndex += 1;
      try { results.push(await run(value)); } catch (error) { results.push(toError(error)); }
    }
  }));
  return results;
}

async function collectTargetClips(client: SupabaseClient, target: CollectorTarget, seasonDays: SeasonDay[]): Promise<CollectionResult> {
  const collected = await collectClipsUntil(target.channelId!, new Date(Date.now() - RECENT_LOOKBACK_MILLISECONDS), new Date());
  const existingById = await findExistingClips(client, collected.items.map((clip) => clip.clipId));
  const now = new Date().toISOString();
  const rows = collected.items.map((clip) => {
    const existing = existingById.get(clip.clipId);
    return {
      clip_created_at: clip.clipCreatedAt, clip_url: clip.url, collected_at: now,
      duration_seconds: clip.durationSeconds ?? existing?.durationSeconds ?? null, provider: "chzzk", provider_clip_id: clip.clipId,
      provider_video_id: clip.providerVideoId ?? existing?.providerVideoId ?? null,
      season_day_id: getSeasonDayByDateTime(seasonDays, clip.clipCreatedAt)?.id ?? null, season_id: target.seasonId,
      season_participant_id: target.seasonParticipantId, streamer_id: target.streamerId,
      thumbnail_url: clip.thumbnailUrl ?? existing?.thumbnailUrl ?? null, title: clip.title || existing?.title || "제목 없음", updated_at: now,
      view_count: clip.viewCount ?? existing?.viewCount ?? null,
    };
  });
  await upsertRows(client, "clips", rows, "provider,provider_clip_id");
  return countUpserts(collected.items.map((clip) => clip.clipId), existingById, collected.pages);
}

async function collectTargetReplays(client: SupabaseClient, target: CollectorTarget, seasonDays: SeasonDay[]): Promise<CollectionResult> {
  const collected = await collectReplaysUntil(target.channelId!, new Date(Date.now() - RECENT_LOOKBACK_MILLISECONDS), new Date());
  const existingById = await findExistingReplays(client, collected.items.map((replay) => replay.providerVideoId));
  const liveStartedAtById = await getLiveStartedAtByReplay(collected.items, existingById);
  const now = new Date().toISOString();
  const rows = collected.items.map((replay) => {
    const existing = existingById.get(replay.providerVideoId);
    const liveStartedAt = liveStartedAtById.get(replay.providerVideoId) ?? null;
    return {
      collected_at: now, duration_seconds: replay.durationSeconds ?? existing?.durationSeconds ?? null, live_started_at: liveStartedAt,
      provider: "chzzk", provider_video_id: replay.providerVideoId, provider_video_no: replay.providerVideoNo ?? existing?.providerVideoNo ?? null,
      published_at: replay.publishedAt ?? existing?.publishedAt ?? null, replay_url: replay.url,
      season_day_id: liveStartedAt ? getSeasonDayByOverlap(seasonDays, liveStartedAt, replay.durationSeconds ?? existing?.durationSeconds ?? null)?.id ?? null : null,
      season_id: target.seasonId, season_participant_id: target.seasonParticipantId, streamer_id: target.streamerId,
      thumbnail_url: replay.thumbnailUrl ?? existing?.thumbnailUrl ?? null, title: replay.title || existing?.title || "제목 없음", updated_at: now,
      view_count: replay.viewCount ?? existing?.viewCount ?? null,
    };
  });
  await upsertRows(client, "replays", rows, "provider,provider_video_id");
  return countUpserts(collected.items.map((replay) => replay.providerVideoId), existingById, collected.pages);
}

async function collectClipsUntil(channelId: string, earliestTime: Date, latestTime: Date): Promise<{ items: ChzzkClip[]; pages: number }> {
  const clipsById = new Map<string, ChzzkClip>();
  const visitedCursors = new Set<string>();
  let cursor: string | null = null;
  let pages = 0;
  while (true) {
    const page = await fetchClipPage(channelId, cursor);
    pages += 1;
    for (const clip of page.items) {
      const createdAt = new Date(clip.clipCreatedAt);
      if (createdAt >= earliestTime && createdAt <= latestTime) clipsById.set(clip.clipId, clip);
    }
    const oldest = page.items.at(-1);
    if (page.items.length === 0 || oldest === undefined || new Date(oldest.clipCreatedAt) < earliestTime || page.nextClipId === null || visitedCursors.has(page.nextClipId)) break;
    visitedCursors.add(page.nextClipId);
    cursor = page.nextClipId;
  }
  return { items: [...clipsById.values()], pages };
}

async function collectReplaysUntil(channelId: string, earliestTime: Date, latestTime: Date): Promise<{ items: ChzzkReplay[]; pages: number }> {
  const replaysById = new Map<string, ChzzkReplay>();
  let page = FIRST_REPLAY_PAGE;
  let shouldContinue = true;
  while (shouldContinue) {
    const result = await fetchReplayPage(channelId, page);
    for (const replay of result.items) {
      const publishedAt = replay.publishedAt ? new Date(replay.publishedAt) : null;
      if (publishedAt === null || (publishedAt >= earliestTime && publishedAt <= latestTime)) replaysById.set(replay.providerVideoId, replay);
    }
    shouldContinue = page + 1 < result.totalPages && (result.oldestSourcePublishedAt === null || new Date(result.oldestSourcePublishedAt) >= earliestTime);
    page += 1;
  }
  return { items: [...replaysById.values()], pages: page };
}

async function fetchClipPage(channelId: string, cursor: string | null): Promise<{ items: ChzzkClip[]; nextClipId: string | null }> {
  const searchParams = new URLSearchParams({ sortType: "RECENT" });
  if (cursor !== null) searchParams.set("clipUID", cursor);
  const result = clipResponseSchema.safeParse(await fetchJson(`https://api.chzzk.naver.com/service/v1/channels/${encodeURIComponent(channelId)}/clips?${searchParams.toString()}`));
  if (!result.success) throw new Error("치지직 클립 응답 형식이 변경됨.");
  return {
    items: result.data.content.data.map((item) => ({ clipCreatedAt: parseKstDateTime(item.createdDate), clipId: item.clipUID, durationSeconds: toIntegerOrNull(item.duration), providerVideoId: item.videoId ?? null, thumbnailUrl: item.thumbnailImageUrl ?? null, title: item.clipTitle, url: `https://chzzk.naver.com/clips/${item.clipUID}`, viewCount: toIntegerOrNull(item.readCount) })),
    nextClipId: result.data.content.page?.next?.clipUID ?? null,
  };
}

async function fetchReplayPage(channelId: string, page: number): Promise<{ items: ChzzkReplay[]; oldestSourcePublishedAt: string | null; totalPages: number }> {
  const result = replayResponseSchema.safeParse(await fetchJson(`https://api.chzzk.naver.com/service/v1/channels/${encodeURIComponent(channelId)}/videos?videoType=&sortType=LATEST&page=${page}`));
  if (!result.success) throw new Error("치지직 다시보기 응답 형식이 변경됨.");
  return {
    items: result.data.content.data.filter((item): item is typeof item & { videoId: string } => item.videoType === "REPLAY" && typeof item.videoId === "string").map((item) => ({ durationSeconds: toIntegerOrNull(item.duration), providerVideoId: item.videoId, providerVideoNo: item.videoNo, publishedAt: getPublishedAt(item.publishDateAt, item.publishDate), thumbnailUrl: item.thumbnailImageUrl ?? null, title: item.videoTitle, url: `https://chzzk.naver.com/video/${item.videoNo}`, viewCount: toIntegerOrNull(item.readCount) })),
    oldestSourcePublishedAt: result.data.content.data.map((item) => getPublishedAt(item.publishDateAt, item.publishDate)).filter((value): value is string => value !== null).at(-1) ?? null,
    totalPages: Math.max(result.data.content.totalPages ?? page, page),
  };
}

async function getLiveStartedAtByReplay(replays: ChzzkReplay[], existingById: Map<string, ExistingReplay>): Promise<Map<string, string | null>> {
  const entries = await runWithConcurrency(replays, async (replay) => {
    const existing = existingById.get(replay.providerVideoId);
    if (existing?.liveStartedAt) return [replay.providerVideoId, existing.liveStartedAt] as const;
    try { return [replay.providerVideoId, await fetchReplayLiveStartedAt(replay.providerVideoNo)] as const; }
    catch (error) { console.warn("다시보기 상세 시각을 불러오지 못함", replay.providerVideoNo, getErrorMessage(error)); return [replay.providerVideoId, null] as const; }
  });
  return new Map(entries.filter((entry): entry is readonly [string, string | null] => !(entry instanceof Error)));
}

async function fetchReplayLiveStartedAt(videoNo: number): Promise<string | null> {
  const result = replayDetailResponseSchema.safeParse(await fetchJson(`https://api.chzzk.naver.com/service/v2/videos/${encodeURIComponent(String(videoNo))}`));
  if (!result.success) throw new Error("치지직 다시보기 상세 응답 형식이 변경됨.");
  return result.data.content.liveOpenDate ? parseKstDateTime(result.data.content.liveOpenDate) : null;
}

async function fetchJson(url: string): Promise<unknown> { return (await fetchWithRetry(url)).json(); }

async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": "BongnurokCollector/1.0" }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (response.ok) return response;
      if (!shouldRetry(response.status) || attempt === MAX_ATTEMPTS) throw new Error(`치지직 요청 실패: HTTP ${response.status}`);
      await wait(getRetryDelay(response, attempt));
    } catch (error) {
      lastError = toError(error);
      if (lastError.message.startsWith("치지직 요청 실패: HTTP") || attempt === MAX_ATTEMPTS) break;
      await wait(500 * 2 ** (attempt - 1));
    }
  }
  throw lastError ?? new Error("치지직 요청에 실패함.");
}

async function findExistingClips(client: SupabaseClient, clipIds: string[]): Promise<Map<string, ExistingClip>> {
  const rows = await loadInChunks(clipIds, async (ids) => {
    const { data, error } = await client.from("clips").select("provider_clip_id, provider_video_id, title, thumbnail_url, duration_seconds, view_count").eq("provider", "chzzk").in("provider_clip_id", ids);
    if (error) throw new Error("기존 클립을 확인하지 못함.");
    return z.array(existingClipSchema).parse(data);
  });
  return new Map(rows.map((row) => [row.provider_clip_id, { durationSeconds: row.duration_seconds, providerVideoId: row.provider_video_id, thumbnailUrl: row.thumbnail_url, title: row.title, viewCount: row.view_count }]));
}

async function findExistingReplays(client: SupabaseClient, videoIds: string[]): Promise<Map<string, ExistingReplay>> {
  const rows = await loadInChunks(videoIds, async (ids) => {
    const { data, error } = await client.from("replays").select("provider_video_id, provider_video_no, title, thumbnail_url, duration_seconds, view_count, live_started_at, published_at").eq("provider", "chzzk").in("provider_video_id", ids);
    if (error) throw new Error("기존 다시보기를 확인하지 못함.");
    return z.array(existingReplaySchema).parse(data);
  });
  return new Map(rows.map((row) => [row.provider_video_id, { durationSeconds: row.duration_seconds, liveStartedAt: row.live_started_at, providerVideoNo: row.provider_video_no, publishedAt: row.published_at, thumbnailUrl: row.thumbnail_url, title: row.title, viewCount: row.view_count }]));
}

async function loadInChunks<T>(values: string[], load: (chunk: string[]) => Promise<T[]>): Promise<T[]> {
  const result: T[] = [];
  for (const chunk of chunks([...new Set(values)], 200)) result.push(...await load(chunk));
  return result;
}

async function upsertRows(client: SupabaseClient, table: "clips" | "replays", rows: object[], onConflict: string): Promise<void> {
  for (const chunk of chunks(rows, 250)) {
    if (chunk.length === 0) continue;
    const { error } = await client.from(table).upsert(chunk, { onConflict });
    if (error) throw new Error("수집 데이터를 저장하지 못함.");
  }
}

function countUpserts<T>(ids: string[], existingById: Map<string, T>, pages: number): CollectionResult {
  return ids.reduce<CollectionResult>((result, id) => ({ discovered: result.discovered + 1, inserted: result.inserted + (existingById.has(id) ? 0 : 1), pages, updated: result.updated + (existingById.has(id) ? 1 : 0) }), { discovered: 0, inserted: 0, pages, updated: 0 });
}

async function completeBatch(client: SupabaseClient, claim: z.infer<typeof runClaimSchema>, summary: CollectionSummary, processedParticipantCount: number, isLastBatch: boolean): Promise<{ has_more: boolean; status: string }> {
  const { data, error } = await client.rpc("complete_media_collector_batch", { p_failed_count: summary.failed, p_found_count: summary.discovered, p_inserted_count: summary.inserted, p_is_last_batch: isLastBatch, p_lease_token: claim.lease_token, p_page_count: summary.pages, p_processed_participant_count: processedParticipantCount, p_run_id: claim.run_id, p_updated_count: summary.updated });
  if (error) throw new Error("수집 실행 상태를 저장하지 못함.");
  return z.object({ has_more: z.boolean(), status: z.string() }).parse(data?.[0]);
}

async function dispatchNextBatch(client: SupabaseClient, runId: string): Promise<void> {
  const { error } = await client.rpc("dispatch_media_collector_batch", { p_run_id: runId });
  if (error) throw new Error("다음 수집 작업을 예약하지 못함.");
}

async function failRun(client: SupabaseClient, claim: z.infer<typeof runClaimSchema>, message: string): Promise<void> {
  const { error } = await client.rpc("fail_media_collector_run", { p_error_message: message, p_lease_token: claim.lease_token, p_run_id: claim.run_id });
  if (error) console.error("수집 실패 상태를 저장하지 못함", error);
}

function getSeasonDayByDateTime(seasonDays: SeasonDay[], targetTime: string): SeasonDay | null {
  const targetTimestamp = Date.parse(targetTime);
  if (Number.isNaN(targetTimestamp)) return null;
  return seasonDays.find((day) => Date.parse(day.startsAt) <= targetTimestamp && targetTimestamp < Date.parse(day.endsAt)) ?? null;
}

function getSeasonDayByOverlap(seasonDays: SeasonDay[], startsAt: string, durationSeconds: number | null): SeasonDay | null {
  const start = Date.parse(startsAt);
  if (Number.isNaN(start) || durationSeconds === null || durationSeconds <= 0) return null;
  const end = start + durationSeconds * 1_000;
  let bestMatch: { day: SeasonDay; overlap: number } | null = null;
  for (const day of seasonDays) {
    const dayStart = Date.parse(day.startsAt); const dayEnd = Date.parse(day.endsAt);
    if (start >= dayEnd || end <= dayStart) continue;
    const overlap = Math.min(end, dayEnd) - Math.max(start, dayStart);
    if (bestMatch === null || overlap > bestMatch.overlap) bestMatch = { day, overlap };
  }
  return bestMatch?.day ?? null;
}

function parseKstDateTime(value: string): string {
  const normalized = value.replace(" ", "T");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(normalized)) throw new Error("치지직 날짜 형식이 올바르지 않음.");
  const timestamp = new Date(`${normalized}+09:00`);
  if (Number.isNaN(timestamp.getTime())) throw new Error("치지직 날짜를 해석하지 못함.");
  return timestamp.toISOString();
}

function getPublishedAt(epochMilliseconds: number | null | undefined, kstDateTime: string | null | undefined): string | null {
  if (epochMilliseconds !== null && epochMilliseconds !== undefined) return new Date(epochMilliseconds).toISOString();
  return kstDateTime ? parseKstDateTime(kstDateTime) : null;
}

function chunks<T>(values: T[], size: number): T[][] { const result: T[][] = []; for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size)); return result; }
function toIntegerOrNull(value: number | null | undefined): number | null { return value === null || value === undefined ? null : Math.trunc(value); }
function shouldRetry(status: number): boolean { return status === 429 || status >= 500; }
function getRetryDelay(response: Response, attempt: number): number { const retryAfter = response.status === 429 ? Number(response.headers.get("retry-after")) : Number.NaN; return Number.isFinite(retryAfter) && retryAfter >= 0 ? retryAfter * 1_000 : 500 * 2 ** (attempt - 1); }
function wait(milliseconds: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }
function toError(error: unknown): Error { return error instanceof Error ? error : new Error("수집에 실패함."); }
function getErrorMessage(error: unknown): string { return error instanceof Error ? error.message : "수집에 실패함."; }
