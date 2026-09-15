import { NextResponse } from "next/server";

import { getPublicOrganizations } from "@/apis/organizations/get-public-organizations";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get("query") ?? undefined;
    const organizations = await getPublicOrganizations(query);

    return NextResponse.json(
      { data: organizations },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to load public organizations", error);

    return NextResponse.json(
      { message: "조직 정보를 불러오지 못함." },
      { status: 500 },
    );
  }
}
