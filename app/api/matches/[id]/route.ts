import { NextRequest, NextResponse } from "next/server";

const OPENDOTA_API = "https://api.opendota.com/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { error: "Invalid match ID" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${OPENDOTA_API}/matches/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: response.status },
      );
    }

    const match = await response.json();

    return NextResponse.json(match);
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to OpenDota" },
      { status: 500 },
    );
  }
}
