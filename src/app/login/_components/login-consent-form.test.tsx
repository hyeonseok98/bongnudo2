import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { LoginConsentForm } from "./login-consent-form";

describe("LoginConsentForm", () => {
  afterEach(cleanup);

  it("세 필수 항목에 모두 동의하기 전에는 로그인을 비활성화함", async () => {
    const user = userEvent.setup();
    render(<LoginConsentForm returnTo="/live" />);
    const loginButton = screen.getByRole("button", {
      name: "치지직으로 로그인",
    });

    expect((loginButton as HTMLButtonElement).disabled).toBe(true);

    await user.click(screen.getByLabelText(/이용약관에 동의합니다/));
    await user.click(screen.getByLabelText(/개인정보 처리방침에 동의합니다/));
    expect((loginButton as HTMLButtonElement).disabled).toBe(true);

    await user.click(screen.getByLabelText(/만 14세 이상입니다/));
    expect((loginButton as HTMLButtonElement).disabled).toBe(false);
  });

  it("모두 동의로 세 필수 항목을 한 번에 선택하고 해제함", async () => {
    const user = userEvent.setup();
    render(<LoginConsentForm returnTo="/" />);
    const allAgreement = screen.getByLabelText(/모두 동의합니다/);
    const requiredAgreements = [
      screen.getByLabelText(/이용약관에 동의합니다/),
      screen.getByLabelText(/개인정보 처리방침에 동의합니다/),
      screen.getByLabelText(/만 14세 이상입니다/),
    ];

    await user.click(allAgreement);
    for (const agreement of requiredAgreements) {
      expect((agreement as HTMLInputElement).checked).toBe(true);
    }
    expect(
      (screen.getByRole("button", {
        name: "치지직으로 로그인",
      }) as HTMLButtonElement).disabled,
    ).toBe(false);

    await user.click(allAgreement);
    for (const agreement of requiredAgreements) {
      expect((agreement as HTMLInputElement).checked).toBe(false);
    }
  });
});
