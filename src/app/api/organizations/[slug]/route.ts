import { NextResponse } from "next/server";

import { getPublicOrganization } from "@/apis/organizations/get-public-organizations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const organization = await getPublicOrganization(slug);

    if (!organization) {
      return NextResponse.json(
        { message: "조직을 찾을 수 없음." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { data: organization },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to load public organization", error);

    return NextResponse.json(
      { message: "조직 정보를 불러오지 못함." },
      { status: 500 },
    );
  }
}
