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
      }),
      queryKey: ["reports", "options"],
    }),
    participantSearch: (query: string) => ({
      enabled: Boolean(query),
      queryFn: async () => [
        {
          organizationName: "EMS",
          profileImageUrl: null,
          role: "원장",
          rpName: "도현정",
          seasonParticipantId: "00000000-0000-4000-8000-000000000002",
          streamerName: "강지",
        },
      ],
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
    expect((contentInput as HTMLTextAreaElement).maxLength).toBe(400);
    expect((contentInput as HTMLTextAreaElement).className).toContain("resize-none");
  });

  it("이미 추가한 인물을 검색 결과에 추가됨 상태로 유지함", async () => {
    const user = userEvent.setup();
    renderReportDialog();

    await user.type(screen.getByLabelText("관련 인물 검색"), "강지");
    const participant = await screen.findByRole("button", { name: /도현정/ });
    expect(document.activeElement).toBe(screen.getByLabelText("관련 인물 검색"));
    await user.click(participant);

    const selectedResult = await screen.findByRole("button", {
      name: /도현정.*추가됨/,
    });
    expect((selectedResult as HTMLButtonElement).disabled).toBe(true);
    expect(
      screen
        .getByLabelText("관련 인물 검색")
        .compareDocumentPosition(screen.getByRole("list", { name: "선택한 관련 인물" })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("제목, 인물 검색어, 태그 입력과 클립 URL을 한 번에 지움", async () => {
    const user = userEvent.setup();
    renderReportDialog();

    const titleInput = screen.getByPlaceholderText(/어떤 일이 있었나요/);
    await user.type(titleInput, "제목");
    await user.click(screen.getByRole("button", { name: "제목 지우기" }));
    expect((titleInput as HTMLInputElement).value).toBe("");

    const participantInput = screen.getByLabelText("관련 인물 검색");
    await user.type(participantInput, "강지");
    await user.click(screen.getByRole("button", { name: "인물 검색어 지우기" }));
    expect((participantInput as HTMLInputElement).value).toBe("");

    const tagInput = screen.getByPlaceholderText(/태그를 입력하고 Enter/);
    await user.type(tagInput, "작성중");
    await user.click(screen.getByRole("button", { name: "태그 입력 지우기" }));
    expect((tagInput as HTMLInputElement).value).toBe("");

    const clipInput = screen.getByLabelText("클립 URL 1");
    await user.type(clipInput, "https://chzzk.naver.com/clips/abcdef");
    await user.click(screen.getByRole("button", { name: "클립 URL 1 지우기" }));
    expect((clipInput as HTMLInputElement).value).toBe("");
  });

  it("태그는 입력칸 아래에 표시되고 빈 입력에서 Backspace로 삭제되지 않음", async () => {
    const user = userEvent.setup();
    renderReportDialog();
    const tagInput = screen.getByPlaceholderText(/태그를 입력하고 Enter/);

    await user.type(tagInput, "봉누도2{Enter}");
    const selectedTags = screen.getByRole("list", { name: "선택한 태그" });
    expect(
      tagInput.compareDocumentPosition(selectedTags) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await user.click(tagInput);
    await user.keyboard("{Backspace}");
    expect(screen.getByText("#봉누도2")).toBeTruthy();
  });

  it("여러 클립 중 지우기 버튼을 누르면 해당 입력 행을 제거함", async () => {
    const user = userEvent.setup();
    renderReportDialog();

    await user.click(screen.getByRole("button", { name: "클립 추가" }));
    await user.type(
      screen.getByLabelText("클립 URL 2"),
      "https://chzzk.naver.com/clips/abcdef",
    );
    await user.click(screen.getByRole("button", { name: "클립 URL 2 지우기" }));
    expect(screen.queryByLabelText("클립 URL 2")).toBeNull();
  });

  it("개별 동의 항목을 필수 입력으로 제공함", () => {
    renderReportDialog();

    expect(
      (screen.getByRole("checkbox", { name: /사실에 기반해/ }) as HTMLInputElement)
        .required,
    ).toBe(true);
    expect(
      (screen.getByRole("checkbox", { name: /기록으로 활용/ }) as HTMLInputElement)
        .required,
    ).toBe(true);
  });
});
