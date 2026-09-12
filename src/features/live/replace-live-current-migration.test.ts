import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260912125541_fix_replace_live_current_delete.sql",
  ),
  "utf8",
);

describe("replace_live_current 후속 migration", () => {
  it("WHERE 절 없는 전체 삭제를 사용하지 않음", () => {
    expect(migration).not.toMatch(/delete from public\.live_current\s*;/i);
    expect(migration).toMatch(
      /delete from public\.live_current\s+where season_participant_id is not null;/i,
    );
  });

  it("기존 행 삭제 후 전달된 배열을 삽입하고 삽입 건수를 반환함", () => {
    const deleteIndex = migration.indexOf("delete from public.live_current");
    const insertIndex = migration.indexOf("insert into public.live_current");

    expect(migration).toContain(
      "create or replace function public.replace_live_current(\n"
      + "  p_run_id uuid,\n"
      + "  p_live_streams jsonb,\n"
      + "  p_refreshed_at timestamptz\n"
      + ")",
    );
    expect(deleteIndex).toBeGreaterThan(-1);
    expect(insertIndex).toBeGreaterThan(deleteIndex);
    expect(migration).toContain("from jsonb_to_recordset(p_live_streams)");
    expect(migration).toContain("get diagnostics inserted_count = row_count;");
    expect(migration).toContain("return inserted_count;");
  });
});
