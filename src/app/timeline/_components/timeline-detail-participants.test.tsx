import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import type { TimelineParticipant } from "@/features/timeline/timeline";

import { TimelineDetailParticipants } from "./timeline-detail-participants";

afterEach(cleanup);

describe("TimelineDetailParticipants", () => {
  it("대표를 먼저 표시하고 초과 인원을 펼치고 다시 접음", async () => {
    const user = userEvent.setup();
    const participants = Array.from({ length: 7 }, (_, index) =>
      createParticipant(index),
    );
    participants[5] = { ...participants[5], isPrimary: true };

    render(<TimelineDetailParticipants participants={participants} />);

    expect(screen.getByText("[대표]").parentElement?.textContent).toContain("인물 6");
    expect(screen.queryByText("인물 5")).toBeNull();

    await user.click(screen.getByRole("button", { name: /\+3/ }));
    expect(screen.getByText("인물 5")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "접기" }));
    expect(screen.queryByText("인물 5")).toBeNull();
  });

  it("한 명일 때 펼치기 control 없이 표시함", () => {
    render(<TimelineDetailParticipants participants={[createParticipant(0)]} />);

    expect(screen.getByText("인물 1")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

function createParticipant(index: number): TimelineParticipant {
  return {
    isPrimary: false,
    profileImageUrl: null,
    rpName: `인물 ${index + 1}`,
    seasonParticipantId: `participant-${index}`,
    streamerName: `스트리머 ${index + 1}`,
  };
}
