import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import GlobalError from "./global-error";

describe("GlobalError", () => {
  afterEach(() => vi.restoreAllMocks());

  it("오류 원문을 노출하지 않고 재시도를 실행함", () => {
    const reset = vi.fn();
    const error = new Error("전역 오류 원문");
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<GlobalError error={error} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: "서비스를 불러오지 못했습니다." }),
    ).toBeTruthy();
    expect(screen.queryByText("전역 오류 원문")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
