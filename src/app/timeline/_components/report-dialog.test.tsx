import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReportDialog } from "./report-dialog";

const TIMELINE_CATEGORY_ID = "9b544faa-9a71-4568-b04f-394dbaa738b0";

vi.mock("@/queries/report-queries", () => ({
  reportQueries: {
    options: () => ({
      queryFn: async () => ({
        categories: [
          {
            id: TIMELINE_CATEGORY_ID,
            name: "일상",
            reportType: "timeline",
            slug: "daily",
          },
        ],
        tags: [],
      }),
      queryKey: ["reports", "options"],
    }),
    participantSearch: (query: string) => ({
      enabled: Boolean(query),
      queryFn: async () => [],
      queryKey: ["reports", "participants", "search", query],
    }),
  },
}));

vi.mock("@/queries/report-mutations", () => ({
  reportMutations: {
    create: () => ({ mutationFn: vi.fn() }),
  },
}));

function TestQueryProvider({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function renderReportDialog(onClose = vi.fn()) {
  render(
    <ReportDialog
      onClose={onClose}
      onSuccess={vi.fn()}
      today="2026-09-13"
    />,
    { wrapper: TestQueryProvider },
  );
  return onClose;
}

afterEach(() => {
  cleanup();
});

describe("ReportDialog", () => {
  it("유형을 전환해도 입력한 클립을 유지함", async () => {
    const user = userEvent.setup();
    renderReportDialog();
    const clipInput = screen.getByLabelText("클립 URL 1");

    await user.type(clipInput, "https://chzzk.naver.com/clips/abcdef");
    await user.click(screen.getByRole("button", { name: /오류 제보/ }));
    await user.click(screen.getByRole("button", { name: /타임라인 제보/ }));

    expect((screen.getByLabelText("클립 URL 1") as HTMLInputElement).value).toBe(
      "https://chzzk.naver.com/clips/abcdef",
    );
  });

  it("작성 후 닫으면 폐기 확인을 표시하고 계속 작성할 수 있음", async () => {
    const user = userEvent.setup();
    const onClose = renderReportDialog();

    await user.type(screen.getByPlaceholderText(/어떤 일이 있었나요/), "제목");
    await user.click(screen.getByRole("button", { name: "제보 모달 닫기" }));

    expect(screen.getByText("작성 중인 내용을 버릴까요?")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "계속 작성" }));
    expect(
      (screen.getByPlaceholderText(/어떤 일이 있었나요/) as HTMLInputElement)
        .value,
    ).toBe("제목");
  });

  it("제목과 내용의 입력 길이를 브라우저 단계에서 제한함", () => {
    renderReportDialog();
    const titleInput = screen.getByPlaceholderText(/어떤 일이 있었나요/);
    const contentInput = screen.getByPlaceholderText(/등장 인물/);

    expect((titleInput as HTMLInputElement).maxLength).toBe(100);
    expect((contentInput as HTMLTextAreaElement).maxLength).toBe(200);
  });
});
