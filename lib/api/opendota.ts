const OPENDOTA_API = "https://api.opendota.com/api";

export async function checkOpenDotaStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${OPENDOTA_API}/players/86745912`, {
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}
