import { NextRequest, NextResponse } from "next/server";

const OPENDOTA_API = "https://api.opendota.com/api";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      {
        error: "Search query is required",
      },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${OPENDOTA_API}/search?q=${encodeURIComponent(query)}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "OpenDota search failed",
        },
        { status: response.status },
      );
    }

    const players = await response.json();

    return NextResponse.json({
      query,
      players,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Failed to connect to OpenDota",
      },
      { status: 500 },
    );
  }
}
