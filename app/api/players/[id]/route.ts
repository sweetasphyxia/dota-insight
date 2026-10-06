import { NextRequest, NextResponse } from "next/server";

const OPENDOTA_API = "https://api.opendota.com/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      {
        error: "Invalid player ID",
      },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${OPENDOTA_API}/players/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Player not found",
        },
        { status: response.status },
      );
    }

    const player = await response.json();

    return NextResponse.json(player);
  } catch {
    return NextResponse.json(
      {
        error: "Failed to connect to OpenDota",
      },
      { status: 500 },
    );
  }
}
