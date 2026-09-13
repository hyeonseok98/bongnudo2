import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  push: vi.fn(),
  reset: vi.fn(),
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  mutationOptions: (options: unknown) => options,
  queryOptions: (options: unknown) => options,
  useMutation: mocks.useMutation,
  useQuery: mocks.useQuery,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

import { ReportEntryButton } from "./report-entry-button";

describe("ReportEntryButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useMutation.mockReturnValue({
      isPending: false,
      isSuccess: false,
      mutate: mocks.mutate,
      reset: mocks.reset,
    });
    mocks.useQuery.mockReturnValue({
      data: [{ id: "9b544faa-9a71-4568-b04f-394dbaa738b0", name: "일상", slug: "daily" }],
      isError: false,
      isPending: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("비로그인 사용자는 로그인 이동 확인 모달을 표시함", () => {
    window.history.replaceState(null, "", "/timeline?date=2026-09-13");
    render(<ReportEntryButton isAuthenticated={false} today="2026-09-13" />);

    fireEvent.click(screen.getByRole("button", { name: "제보하기" }));

    expect(screen.getByText("로그인이 필요합니다")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "로그인으로 이동" }));

    expect(mocks.push).toHaveBeenCalledWith(
      "/login?returnTo=%2Ftimeline%3Fdate%3D2026-09-13",
    );
  });

  it("로그인 사용자는 타임라인 제보 모달을 표시하고 제출할 수 있음", () => {
    render(<ReportEntryButton isAuthenticated today="2026-09-13" />);

    fireEvent.click(screen.getByRole("button", { name: "제보하기" }));

    expect(screen.getByText("타임라인 제보하기")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "제보 분류" }));
    fireEvent.click(screen.getByRole("option", { name: "일상" }));
    fireEvent.change(screen.getByPlaceholderText("제보 내용을 요약해주세요."), {
      target: { value: "새로운 일상 기록" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("언제, 어디서, 어떤 일이 있었는지 작성해주세요."),
      { target: { value: "타임라인에 추가할 내용을 작성했습니다." } },
    );
    fireEvent.click(
      screen.getByLabelText("동일하거나 매우 유사한 제보가 없는지 확인했습니다."),
    );
    fireEvent.click(
      screen.getByLabelText(
        "사실에 기반해 타인을 존중하는 표현으로 작성했습니다.",
      ),
    );
    fireEvent.click(
      screen.getByLabelText(
        "검토 후 타임라인 기록으로 활용될 수 있음에 동의합니다.",
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "제보 제출" }));

    expect(mocks.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: "9b544faa-9a71-4568-b04f-394dbaa738b0",
        content: "타임라인에 추가할 내용을 작성했습니다.",
        reportType: "timeline",
        title: "새로운 일상 기록",
      }),
      expect.objectContaining({ onError: expect.any(Function) }),
    );
  });
});
