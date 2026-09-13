import { act, renderHook, waitFor } from "@testing-library/react";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

import { useTimelineDirectory } from "./use-timeline-directory";

describe("useTimelineDirectory modal params", () => {
  it("기존 필터를 유지하며 모달 파라미터를 열고 닫는다", async () => {
    const onUrlUpdate = vi.fn();
    const { result } = renderHook(
      () => useTimelineDirectory("2026-09-13"),
      {
        wrapper: withNuqsTestingAdapter({
          hasMemory: true,
          onUrlUpdate,
          searchParams: "?date=2026-09-13&category=daily",
        }),
      },
    );

    act(() => result.current.openMedia("event-id", "media-id"));

    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(1));
    const openedParams = onUrlUpdate.mock.calls[0][0].searchParams;

    expect(openedParams.get("category")).toBe("daily");
    expect(openedParams.get("event")).toBe("event-id");
    expect(openedParams.get("media")).toBe("media-id");
    expect(onUrlUpdate.mock.calls[0][0].options.history).toBe("push");

    act(() => result.current.closeMedia());

    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(2));
    const closedParams = onUrlUpdate.mock.calls[1][0].searchParams;

    expect(closedParams.get("category")).toBe("daily");
    expect(closedParams.has("event")).toBe(false);
    expect(closedParams.has("media")).toBe(false);
  });

  it("새로고침된 URL에서 선택 이벤트·미디어·유형을 복원한다", () => {
    const { result } = renderHook(
      () => useTimelineDirectory("2026-09-13"),
      {
        wrapper: withNuqsTestingAdapter({
          searchParams: "?event=event-id&media=media-id&mediaType=clip",
        }),
      },
    );

    expect(result.current.eventId).toBe("event-id");
    expect(result.current.mediaId).toBe("media-id");
    expect(result.current.mediaType).toBe("clip");
  });
});
