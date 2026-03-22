import type { KnowledgeCase, Requirement, Client } from "@/types";

/**
 * 按行业/地区/媒体与知识库案例做简单规则匹配（无向量库，适合 Demo）。
 */
export function pickSimilarKnowledgeCases(
  requirement: Requirement,
  clients: Client[],
  cases: KnowledgeCase[],
  limit = 3
): KnowledgeCase[] {
  if (cases.length === 0) return [];
  const sd = requirement.structuredData;
  const client = clients.find((c) => c.id === requirement.clientId);
  const industry = client?.industry ?? "";
  const region = sd?.region?.trim() ?? "";
  const media = sd?.media_platform?.trim() ?? "";

  const scored = cases.map((c) => {
    let s = 0;
    if (industry && c.industry === industry) s += 4;
    else if (industry && (c.industry.includes(industry) || industry.includes(c.industry))) s += 2;
    if (region && c.region === region) s += 3;
    else if (region && (c.region.includes(region) || region.includes(c.region))) s += 1;
    if (media && c.mediaPlatform) {
      const m = media.toLowerCase();
      const cm = c.mediaPlatform.toLowerCase();
      if (m === cm || m.includes(cm) || cm.includes(m)) s += 3;
    }
    if (industry && c.tags.some((t) => t.includes(industry) || industry.includes(t))) s += 1;
    return { c, s };
  });

  const positive = scored.filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  if (positive.length > 0) {
    return positive.slice(0, limit).map((x) => x.c);
  }
  return cases.slice(0, limit);
}
