import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, ".env.local");
const groupsPath = path.join(
  projectRoot,
  "src",
  "constants",
  "character-groups.ts",
);

if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseApiKey =
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseApiKey) {
  throw new Error(
    "Supabase 그룹 조회에 SUPABASE_URL과 API key 환경변수가 필요함.",
  );
}

const source = readFileSync(groupsPath, "utf8");
const featuredSlugs = parseFeaturedSlugs(source);
const existingGroups = parseExistingGroups(source);
const databaseGroups = await fetchDatabaseGroups(
  supabaseUrl,
  supabaseApiKey,
);
const mergedGroups = mergeGroups({
  databaseGroups,
  existingGroups,
  featuredSlugs,
});
const nextSource = renderGroupsFile(featuredSlugs, mergedGroups);

if (nextSource === source) {
  console.log("character group 상수가 이미 최신 상태임.");
} else {
  writeFileSync(groupsPath, nextSource, "utf8");
  console.log(`character group 상수 ${mergedGroups.length}개 동기화 완료.`);
}

async function fetchDatabaseGroups(url, apiKey) {
  const endpoint = new URL("/rest/v1/streamer_groups", url);
  endpoint.searchParams.set("select", "slug,name");

  const headers = {
    apikey: apiKey,
  };

  if (apiKey.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(endpoint, { headers });

  if (!response.ok) {
    throw new Error(
      `streamer_groups 조회 실패: HTTP ${response.status}`,
    );
  }

  const groups = await response.json();

  if (
    !Array.isArray(groups) ||
    groups.some(
      (group) =>
        typeof group !== "object" ||
        group === null ||
        typeof group.slug !== "string" ||
        typeof group.name !== "string",
    )
  ) {
    throw new Error("streamer_groups 응답 형식이 올바르지 않음.");
  }

  return groups.map(({ slug, name }) => ({ slug, name }));
}

function parseFeaturedSlugs(fileSource) {
  const match = fileSource.match(
    /FEATURED_CHARACTER_GROUP_SLUGS\s*=\s*\[([\s\S]*?)\]\s*as const;/,
  );

  if (!match) {
    throw new Error("featured character group 상수를 찾지 못함.");
  }

  return Array.from(match[1].matchAll(/"([^"]+)"/g), ([, slug]) => slug);
}

function parseExistingGroups(fileSource) {
  const match = fileSource.match(
    /CHARACTER_GROUPS[^=]*=\s*\[([\s\S]*?)\];/,
  );

  if (!match) {
    throw new Error("character group 상수를 찾지 못함.");
  }

  return Array.from(
    match[1].matchAll(
      /\{\s*slug:\s*"([^"]+)",\s*name:\s*"([^"]+)"\s*\}/g,
    ),
    ([, slug, name]) => ({ slug, name }),
  );
}

function mergeGroups({ databaseGroups, existingGroups, featuredSlugs }) {
  const databaseBySlug = new Map();

  for (const group of databaseGroups) {
    if (databaseBySlug.has(group.slug)) {
      throw new Error(`Supabase group slug가 중복됨: ${group.slug}`);
    }

    databaseBySlug.set(group.slug, group);
  }

  const mergedBySlug = new Map(
    existingGroups.map((group) => [group.slug, group]),
  );

  for (const group of databaseGroups) {
    if (!mergedBySlug.has(group.slug)) {
      mergedBySlug.set(group.slug, group);
    }
  }

  for (const group of existingGroups) {
    if (!databaseBySlug.has(group.slug)) {
      console.warn(
        `Supabase에 없는 기존 group을 유지함: ${group.slug} (${group.name})`,
      );
    }
  }

  const featuredOrder = new Map(
    featuredSlugs.map((slug, index) => [slug, index]),
  );

  return Array.from(mergedBySlug.values()).sort((left, right) => {
    const leftFeaturedIndex = featuredOrder.get(left.slug);
    const rightFeaturedIndex = featuredOrder.get(right.slug);

    if (leftFeaturedIndex !== undefined || rightFeaturedIndex !== undefined) {
      if (leftFeaturedIndex === undefined) return 1;
      if (rightFeaturedIndex === undefined) return -1;

      return leftFeaturedIndex - rightFeaturedIndex;
    }

    return (
      left.name.localeCompare(right.name, "ko-KR") ||
      left.slug.localeCompare(right.slug)
    );
  });
}

function renderGroupsFile(featuredSlugs, groups) {
  const featuredLines = featuredSlugs
    .map((slug) => `  ${JSON.stringify(slug)},`)
    .join("\n");
  const groupLines = groups
    .map(
      ({ slug, name }) =>
        `  { slug: ${JSON.stringify(slug)}, name: ${JSON.stringify(name)} },`,
    )
    .join("\n");

  return `import type { CharacterGroup } from "@/features/characters/character";

export const FEATURED_CHARACTER_GROUP_SLUGS = [
${featuredLines}
] as const;

export const CHARACTER_GROUPS: CharacterGroup[] = [
${groupLines}
];
`;
}
