import "server-only";

export interface IpGeo extends Record<string, unknown> {
  ip?: string;
  city?: string;
  region?: string;
  country_name?: string;
  latitude?: number;
  longitude?: number;
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export async function lookupIpGeo(ip: string): Promise<IpGeo | null> {
  if (!ip || ip === "unknown" || ip === "::1" || ip === "127.0.0.1") return null;
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as IpGeo & { error?: boolean };
    if (data.error) return null;
    return data;
  } catch {
    return null;
  }
}
