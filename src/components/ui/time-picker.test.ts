import { describe, expect, it } from "vitest";

import { formatTimeValue } from "./time-picker";

describe("formatTimeValue", () => {
  it.each(["00:00", "09:05", "12:00", "23:59"])(
    "%s를 24시간 HH:mm 형식으로 유지함",
    (value) => {
      expect(formatTimeValue(value)).toBe(value);
    },
  );
});
