import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const cronSql = readFileSync(
  resolve(process.cwd(), "supabase/live-viewer-snapshots-cron.sql"),
  "utf8",
);

describe("LIVE refresh Cron SQL", () => {
  it("LIVE 정밀 집계와 마지막 04:00 snapshot, 운영 외 2분 갱신을 등록함", () => {
    const schedules = Array.from(
      cronSql.matchAll(
        /perform cron\.schedule\(\s*'([^']+)',\s*'([^']+)'/g,
      ),
      ([, name, schedule]) => ({ name, schedule }),
    );

    expect(schedules).toEqual([
      {
        name: "live-refresh-server-evening",
        schedule: "* 9-18 * * *",
      },
      {
        name: "live-refresh-server-0400",
        schedule: "0 19 * * *",
      },
      {
        name: "live-refresh-offhours-evening",
        schedule: "1-59/2 19-23 * * *",
      },
      {
        name: "live-refresh-offhours-morning",
        schedule: "1-59/2 0-8 * * *",
      },
    ]);
  });
});
