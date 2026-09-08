import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { readBongnudo2Excel } from "./bongnudo2-excel-data.mjs";
import {
  applySyncPlan,
  buildSyncPlan,
  getDeleteSafetyWarnings,
  loadSyncContext,
  renderSyncPlan,
} from "./bongnudo2-sync-plan.mjs";

const DEFAULT_WORKBOOK_PATH = "data/봉누도2_데이터.xlsx";
const args = parseArgs(process.argv.slice(2));
loadLocalEnvironment();

if (!existsSync(args.workbookPath)) {
  throw new Error(`Excel 파일을 찾지 못함: ${args.workbookPath}`);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = args.apply
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    args.apply
      ? "적용하려면 NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요함."
      : "dry-run에는 NEXT_PUBLIC_SUPABASE_URL과 publishable 또는 anon key가 필요함.",
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const excel = await readBongnudo2Excel(args.workbookPath);
const context = await loadSyncContext(supabase, excel, args.seasonId);
const plan = buildSyncPlan(excel, context);
plan.excelData = excel;
console.log(renderSyncPlan(plan, args.apply ? "Apply Plan" : "Dry Run"));

if (!args.apply) {
  console.log("\nDB에는 아직 반영하지 않았습니다.");
  process.exit(0);
}

const warnings = getDeleteSafetyWarnings(plan);
if (warnings.length > 0 && !args.force) {
  throw new Error("대량 삭제 위험: --force 없이 실행할 수 없음.");
}

await applySyncPlan(supabase, plan, args.force);
console.log("\n적용 후 검증 완료: Excel desired state와 DB가 일치함.");

function parseArgs(values) {
  const workbookArgument = values.find((value) => !value.startsWith("--"));
  const seasonValue = values
    .find((value) => value.startsWith("--season="))
    ?.slice("--season=".length);
  const seasonId = seasonValue ? Number(seasonValue) : null;
  if (seasonValue && (!Number.isInteger(seasonId) || seasonId <= 0)) {
    throw new Error("--season은 양의 정수여야 함.");
  }

  return {
    workbookPath: resolve(workbookArgument ?? DEFAULT_WORKBOOK_PATH),
    seasonId,
    apply: values.includes("--apply"),
    force: values.includes("--force"),
  };
}

function loadLocalEnvironment() {
  for (const name of [".env.local", ".env"]) {
    const path = resolve(name);
    if (existsSync(path)) process.loadEnvFile(path);
  }
}