/**
 * Overseas ad account mock data generator.
 * Extracted here so it can be unit-tested independently of the page component.
 */

interface AdAccountRow {
  platform: string;
  account: string;
  spend: number;
  roi: number;
  ctr: number;
  conversions: number;
}

const PLATFORMS = [
  { name: "Meta", prefix: "META" },
  { name: "Google Ads", prefix: "GAD" },
  { name: "TikTok", prefix: "TTK" },
  { name: "YouTube", prefix: "YTB" },
] as const;

export function generateAccountData(projectId: string): AdAccountRow[] {
  const seed = projectId.charCodeAt(projectId.length - 1);
  return PLATFORMS.map((p, i) => ({
    platform: p.name,
    account: `${p.prefix}-${(seed + i * 17) % 900 + 100}`,
    spend: Math.round(20000 + (seed * (i + 1) * 7) % 50000),
    roi: parseFloat((1.0 + ((seed + i) % 20) / 10).toFixed(2)),
    ctr: parseFloat((2.0 + ((seed + i) % 15) / 10).toFixed(1)),
    conversions: Math.round(200 + (seed * i * 3) % 800),
  }));
}
