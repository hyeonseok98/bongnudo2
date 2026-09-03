import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { mockServer } from "@/test/mocks/server";

describe("MSW test server", () => {
  it("intercepts API requests", async () => {
    mockServer.use(
      http.get("http://localhost/api/health", () =>
        HttpResponse.json({ status: "ok" }),
      ),
    );

    const response = await fetch("http://localhost/api/health");

    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});
