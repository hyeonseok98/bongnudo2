import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TimelineListSkeleton } from "./timeline-list";

afterEach(cleanup);

describe("TimelineListSkeleton", () => {
  it("실제 표 컬럼을 유지한 skeleton row 4개를 표시함", () => {
    render(<TimelineListSkeleton />);

    const status = screen.getByRole("status", {
      name: "타임라인을 불러오는 중",
    });
    expect(status.children[1]?.children).toHaveLength(4);
    expect(status.className).not.toContain("overflow-y-auto");
  });
});
