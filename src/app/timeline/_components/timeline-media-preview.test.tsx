import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TimelineMediaPreview } from "./timeline-media-preview";

function TestQueryProvider({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TimelineMediaPreview", () => {
  it("클립 썸네일 위에 재생 표시를 렌더링하고 iframe은 사용하지 않음", () => {
    const { container } = render(
      <TimelineMediaPreview
        eventTitle="클립 기록"
        media={[
          {
            clipUrl: "https://chzzk.naver.com/clips/clip-id",
            id: "clip-media",
            mediaType: "chzzk_clip",
            thumbnailUrl: "https://ssl.pstatic.net/clip.webp",
          },
        ]}
        onOpen={vi.fn()}
      />,
      { wrapper: TestQueryProvider },
    );

    expect(screen.getByAltText("클립 기록 치지직 클립 썸네일")).toBeTruthy();
    expect(screen.getByText("클립")).toBeTruthy();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("썸네일이 없으면 기존 클립 fallback을 표시함", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    render(
      <TimelineMediaPreview
        eventTitle="클립 기록"
        media={[
          {
            clipUrl: "https://chzzk.naver.com/clips/clip-id",
            id: "clip-media",
            mediaType: "chzzk_clip",
            thumbnailUrl: null,
          },
        ]}
        onOpen={vi.fn()}
      />,
      { wrapper: TestQueryProvider },
    );

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("클립")).toBeTruthy();
  });
});
