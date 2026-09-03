import { useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QueryProvider } from "@/providers/query-provider";

function QueryResult() {
  const { data = "loading" } = useQuery({
    queryKey: ["provider-test"],
    queryFn: async () => "ready",
  });

  return <p>{data}</p>;
}

describe("QueryProvider", () => {
  it("provides a query client to descendants", async () => {
    render(
      <QueryProvider>
        <QueryResult />
      </QueryProvider>,
    );

    expect(await screen.findByText("ready")).toBeInTheDocument();
  });
});
