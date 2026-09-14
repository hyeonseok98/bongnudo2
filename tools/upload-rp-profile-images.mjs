import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const RP_PROFILE_DIRECTORY = "public/rp-profile";
const SEASON_SLUG = "bongnudo-2";
const FILE_NAME_PATTERN = /^(?<rpName>[^_]+)_(?:(?<variant>full)_)?(?<order>\d+)\.(?<extension>webp|png|jpe?g)$/i;
const LEGACY_FILE_NAME_PATTERN = /^(?<streamerName>[^_]+)_(?<rpName>[^_]+)_(?<order>\d+)\.(?<extension>webp|png|jpe?g)$/i;

export function parseRpProfileFileName(fileName) {
  const match = FILE_NAME_PATTERN.exec(fileName) ?? LEGACY_FILE_NAME_PATTERN.exec(fileName);

  if (!match?.groups) {
    return null;
  }

  return {
    extension: match.groups.extension.toLowerCase() === "jpg"
      ? "jpeg"
      : match.groups.extension.toLowerCase(),
    imageType: match.groups.variant === "full" ? "full" : "portrait",
    order: match.groups.order,
    rpName: match.groups.rpName,
  };
}

export function getRpProfileObjectKey({
  extension,
  imageType,
  order,
  rpName,
  streamerName,
}) {
  const variantSuffix = imageType === "full" ? "_full" : "";

  return `streamers/${streamerName}/rp-profile/${rpName}${variantSuffix}_${order}.${extension}`;
}

export async function getRpProfileUploadPlan({
  directoryEntries,
  participants,
}) {
  const participantsByRpName = new Map();

  for (const participant of participants) {
    if (!participant.rpName) {
      continue;
    }

    const key = participant.rpName;

    if (participantsByRpName.has(key)) {
      throw new Error(`중복된 RP 참가자 정보가 있음: ${participant.rpName}`);
    }

    participantsByRpName.set(key, participant);
  }

  const invalidFiles = [];
  const unmatchedFiles = [];
  const conflictingFiles = [];
  const uploads = [];
  const skipped = [];
  const plannedImageFields = new Set();

  for (const entry of directoryEntries) {
    if (!entry.isFile() || entry.name.startsWith(".")) {
      continue;
    }

    const parsed = parseRpProfileFileName(entry.name);

    if (!parsed) {
      invalidFiles.push(entry.name);
      continue;
    }

    const participant = participantsByRpName.get(parsed.rpName);

    if (!participant) {
      unmatchedFiles.push(entry.name);
      continue;
    }

    const imageField = parsed.imageType === "full"
      ? "fullBodyImageKey"
      : "portraitImageKey";
    const plannedImageField = `${participant.id}\u0000${imageField}`;
    const objectKey = getRpProfileObjectKey({
      ...parsed,
      streamerName: participant.streamerName,
    });

    if (participant[imageField] === objectKey) {
      skipped.push({ fileName: entry.name, objectKey, participant });
      continue;
    }

    if (participant[imageField]) {
      conflictingFiles.push({
        currentObjectKey: participant[imageField],
        fileName: entry.name,
        participant,
      });
      continue;
    }

    if (plannedImageFields.has(plannedImageField)) {
      conflictingFiles.push({
        currentObjectKey: null,
        fileName: entry.name,
        participant,
      });
      continue;
    }

    plannedImageFields.add(plannedImageField);
    uploads.push({ fileName: entry.name, imageField, objectKey, participant, parsed });
  }

  return { conflictingFiles, invalidFiles, skipped, unmatchedFiles, uploads };
}

async function main() {
  const apply = getApplyOption(process.argv.slice(2));
  const directoryPath = resolve(process.cwd(), RP_PROFILE_DIRECTORY);
  const directoryEntries = await readdir(directoryPath, { withFileTypes: true });
  const supabase = createSupabaseAdminClient();
  const participants = await getSeasonParticipants(supabase);
  const plan = await getRpProfileUploadPlan({ directoryEntries, participants });

  printPlan(plan);

  if (hasPlanErrors(plan)) {
    process.exitCode = 1;
    return;
  }

  if (!apply) {
    console.info("Dry run 완료: 실제 업로드와 DB 변경은 하지 않았습니다. 반영하려면 --apply를 사용해주세요.");
    return;
  }

  const r2 = createR2Client();

  for (const upload of plan.uploads) {
    const filePath = resolve(directoryPath, upload.fileName);
    const body = await readFile(filePath);

    await r2.client.send(
      new PutObjectCommand({
        Body: body,
        Bucket: r2.bucketName,
        ContentType: getContentType(upload.parsed.extension),
        Key: upload.objectKey,
      }),
    );

    const result = await supabase
      .from("season_participants")
      .update(getParticipantImageUpdate(upload))
      .eq("id", upload.participant.id)
      .select("id")
      .single();

    if (result.error) {
      throw new Error(`RP 프로필 키를 저장하지 못함: ${upload.fileName}`, {
        cause: result.error,
      });
    }

    console.info(`반영됨: ${upload.fileName} -> ${upload.objectKey}`);
  }
}

function getApplyOption(args) {
  if (args.length === 0) {
    return false;
  }

  if (args.length === 1 && args[0] === "--apply") {
    return true;
  }

  throw new Error("지원하지 않는 옵션입니다. --apply만 사용할 수 있습니다.");
}

function createSupabaseAdminClient() {
  const supabaseUrl = requireEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

async function getSeasonParticipants(supabase) {
  const result = await supabase
    .from("season_participants")
    .select(`
      id,
      rp_name,
      full_body_image_key,
      portrait_image_key,
      seasons!season_participants_season_id_fkey!inner (slug),
      streamer:streamers!inner (name)
    `)
    .eq("seasons.slug", SEASON_SLUG);

  if (result.error) {
    throw new Error("RP 참가자 정보를 불러오지 못함.", { cause: result.error });
  }

  return result.data.map((participant) => ({
    id: participant.id,
    fullBodyImageKey: participant.full_body_image_key,
    portraitImageKey: participant.portrait_image_key,
    rpName: participant.rp_name,
    streamerName: participant.streamer.name,
  }));
}

function createR2Client() {
  const accountId = requireEnvironmentVariable("R2_ACCOUNT_ID");
  const accessKeyId = requireEnvironmentVariable("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnvironmentVariable("R2_SECRET_ACCESS_KEY");
  const bucketName = requireEnvironmentVariable("R2_BUCKET_NAME");
  const endpoint = process.env.R2_ENDPOINT?.trim()
    || `https://${accountId}.r2.cloudflarestorage.com`;

  return {
    bucketName,
    client: new S3Client({
      credentials: { accessKeyId, secretAccessKey },
      endpoint,
      region: "auto",
    }),
  };
}

function requireEnvironmentVariable(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} 환경변수가 설정되지 않음.`);
  }

  return value;
}

function getParticipantImageUpdate(upload) {
  if (upload.imageField === "fullBodyImageKey") {
    return { full_body_image_key: upload.objectKey };
  }

  return {
    portrait_image_key: upload.objectKey,
    portrait_image_source_url: null,
  };
}

function getContentType(extension) {
  switch (extension) {
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      throw new Error(`지원하지 않는 이미지 확장자입니다: ${extension}`);
  }
}

function hasPlanErrors(plan) {
  return (
    plan.invalidFiles.length > 0
    || plan.unmatchedFiles.length > 0
    || plan.conflictingFiles.length > 0
  );
}

function printPlan(plan) {
  for (const upload of plan.uploads) {
    console.info(`업로드 예정: ${upload.fileName} -> ${upload.objectKey}`);
  }

  for (const skipped of plan.skipped) {
    console.info(`건너뜀(이미 연결됨): ${skipped.fileName} -> ${skipped.objectKey}`);
  }

  for (const fileName of plan.invalidFiles) {
    console.error(`잘못된 파일명: ${fileName} (RP명_순번.webp 또는 RP명_full_순번.webp 형식 필요)`);
  }

  for (const fileName of plan.unmatchedFiles) {
    console.error(`참가자를 찾을 수 없음: ${fileName}`);
  }

  for (const conflict of plan.conflictingFiles) {
    console.error(
      conflict.currentObjectKey
        ? `기존 RP 사진 키가 있어 중단함: ${conflict.fileName} (${conflict.currentObjectKey})`
        : `같은 RP 이미지 종류가 중복되어 중단함: ${conflict.fileName}`,
    );
  }
}

const isMainModule = process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMainModule) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
