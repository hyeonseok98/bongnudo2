import { describe, expect, it } from "vitest";

import { liveQueries } from "./live-queries";

describe("liveQueries", () => {
  it("LIVE 목록을 30초마다 background refetch함", () => {
    expect(liveQueries.list().refetchInterval).toBe(30_000);
  });
});
