import { NextResponse } from "next/server";
import { checkOpenDotaStatus } from "@/lib/api/opendota";

export async function GET() {
  const online = await checkOpenDotaStatus();

  return NextResponse.json({
    service: "OpenDota",
    online,
    timestamp: new Date().toISOString(),
  });
}
