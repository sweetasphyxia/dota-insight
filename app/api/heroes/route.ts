import { NextResponse } from "next/server";

const OPENDOTA_API = "https://api.opendota.com/api";

export async function GET() {
  try {
    const response = await fetch(`${OPENDOTA_API}/heroes`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to load heroes",
        },
        { status: response.status },
      );
    }

    const heroes = await response.json();

    return NextResponse.json(heroes);
  } catch {
    return NextResponse.json(
      {
        error: "Failed to connect to OpenDota",
      },
      { status: 500 },
    );
  }
}
