import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(),
  useCharacters: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("../_hooks/use-characters", () => ({
  useCharacters: mocks.useCharacters,
}));

import { CharacterDetail } from "./character-detail";

describe("CharacterDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.notFound.mockImplementation(() => {
      throw new Error("not-found");
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("성공 응답에서 stable identifier에 해당하는 RP가 없으면 notFound를 호출함", () => {
    mocks.useCharacters.mockReturnValue({
      data: { characters: [], streamerAffiliations: [] },
      isError: false,
      isPending: false,
    });

    expect(() => {
      render(<CharacterDetail identifier="missing-rp-id" kind="rp" />);
    }).toThrow("not-found");
    expect(mocks.notFound).toHaveBeenCalled();
  });

  it("query 오류는 notFound로 바꾸지 않고 그대로 전파함", () => {
    const queryError = new Error("query failed");
    mocks.useCharacters.mockReturnValue({
      data: undefined,
      error: queryError,
      isError: true,
      isPending: false,
    });

    expect(() => {
      render(<CharacterDetail identifier="streamer-slug" kind="streamer" />);
    }).toThrow(queryError);
    expect(mocks.notFound).not.toHaveBeenCalled();
  });
});
