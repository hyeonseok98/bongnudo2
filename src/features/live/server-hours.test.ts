import { describe, expect, it } from "vitest";

import { isBongnudoServerHours } from "./server-hours";

describe("isBongnudoServerHours", () => {
  it.each([
    ["17:59", "2026-09-12T08:59:00.000Z", false],
    ["18:00", "2026-09-12T09:00:00.000Z", true],
    ["23:59", "2026-09-12T14:59:00.000Z", true],
    ["00:00", "2026-09-12T15:00:00.000Z", true],
    ["03:59", "2026-09-12T18:59:00.000Z", true],
    ["04:00", "2026-09-12T19:00:00.000Z", true],
    ["04:01", "2026-09-12T19:01:00.000Z", false],
  ])("KST %s를 판정함", (_label, isoDate, expected) => {
    expect(isBongnudoServerHours(new Date(isoDate))).toBe(expected);
  });
});
