import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  useSidebar: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("@/providers/sidebar-provider", () => ({
  useSidebar: mocks.useSidebar,
}));

import { Header } from "./header";

describe("Header auth UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useSidebar.mockReturnValue({
      isOpen: true,
      isMobileOpen: false,
      isMobile: false,
      toggleSidebar: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("비로그인 상태에서 로그인 페이지 링크를 표시함", () => {
    render(<Header currentUser={null} />);

    expect(
      screen.getByRole("link", { name: "로그인" }).getAttribute("href"),
    ).toBe("/login");
  });

  it("로그인 페이지로 이동할 때 현재 경로를 복귀 경로로 전달함", () => {
    window.history.pushState(null, "", "/live?job=police#current");
    render(<Header currentUser={null} />);

    fireEvent.click(screen.getByRole("link", { name: "로그인" }));

    expect(mocks.push).toHaveBeenCalledWith(
      "/login?returnTo=%2Flive%3Fjob%3Dpolice%23current",
    );
  });

  it("로그인 사용자의 channelName과 로그아웃을 표시함", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <Header
        currentUser={{
          id: "user-id",
          channelId: "channel-id",
          channelName: "채널 이름",
          role: "user",
          status: "active",
        }}
      />,
    );

    expect(screen.getByText("채널 이름")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
      });
      expect(mocks.refresh).toHaveBeenCalled();
    });
  });

  it("로그아웃 API가 실패해도 cookie 반영을 위해 화면을 갱신함", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <Header
        currentUser={{
          id: "user-id",
          channelId: "channel-id",
          channelName: "채널 이름",
          role: "user",
          status: "active",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));

    await waitFor(() => {
      expect(mocks.refresh).toHaveBeenCalled();
      expect(screen.getByText("서버 세션 정리가 지연되고 있습니다.")).toBeTruthy();
    });
  });

  it("로그아웃 응답을 받지 못해도 cookie 반영 여부를 다시 확인함", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <Header
        currentUser={{
          id: "user-id",
          channelId: "channel-id",
          channelName: "채널 이름",
          role: "user",
          status: "active",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));

    await waitFor(() => {
      expect(mocks.refresh).toHaveBeenCalled();
      expect(screen.getByText("로그아웃하지 못함.")).toBeTruthy();
    });
  });
});
