import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const cronSql = readFileSync(
  resolve(process.cwd(), "supabase/live-viewer-snapshots-cron.sql"),
  "utf8",
);

describe("LIVE refresh Cron SQL", () => {
  it("운영시간 1분, KST 04:00 단일 실행, 운영시간 외 2분을 등록함", () => {
    const schedules = Array.from(
      cronSql.matchAll(
        /perform cron\.schedule\(\s*'([^']+)',\s*'([^']+)'/g,
      ),
      ([, name, schedule]) => ({ name, schedule }),
    );

    expect(schedules).toEqual([
      {
        name: "refresh-live-current-peak-kst",
        schedule: "* 8-18 * * *",
      },
      {
        name: "refresh-live-current-0400-kst",
        schedule: "0 19 * * *",
      },
      {
        name: "refresh-live-current-off-hours-0401-kst",
        schedule: "1-59/2 19 * * *",
      },
      {
        name: "refresh-live-current-off-hours-kst",
        schedule: "1-59/2 20-23,0-7 * * *",
      },
    ]);
  });
});
