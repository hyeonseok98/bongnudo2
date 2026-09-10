import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SearchField } from "./search-field";

describe("SearchField", () => {
  it("검색어가 있을 때 custom clear button 하나만 표시함", () => {
    const { rerender } = render(
      <SearchField label="소속 검색" onClear={() => {}} value="" />,
    );

    expect(
      screen.queryByRole("button", { name: "소속 검색 지우기" }),
    ).toBeNull();

    rerender(
      <SearchField label="소속 검색" onClear={() => {}} value="스텔" />,
    );

    expect(
      screen.getAllByRole("button", { name: "소속 검색 지우기" }),
    ).toHaveLength(1);
    expect(screen.getByRole("searchbox").getAttribute("type")).toBe("text");
  });
});
