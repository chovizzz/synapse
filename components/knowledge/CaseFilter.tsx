"use client";

import { Search } from "lucide-react";
import type { KnowledgeCase } from "@/types";

interface CaseFilterProps {
  cases: KnowledgeCase[];
  selectedIndustry: string;
  onIndustryChange: (v: string) => void;
  selectedMedia: string;
  onMediaChange: (v: string) => void;
  selectedRegion: string;
  onRegionChange: (v: string) => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr)).sort();
}

const selectStyle: React.CSSProperties = {
  backgroundColor: "hsl(var(--card))",
  borderColor: "hsl(var(--border))",
  color: "hsl(var(--foreground))",
};

export function CaseFilter({
  cases,
  selectedIndustry,
  onIndustryChange,
  selectedMedia,
  onMediaChange,
  selectedRegion,
  onRegionChange,
  searchQuery,
  onSearchChange,
}: CaseFilterProps) {
  const industries = unique(cases.map((c) => c.industry));
  const medias = unique(cases.map((c) => c.mediaPlatform));
  const regions = unique(cases.map((c) => c.region));

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "hsl(var(--muted-foreground))" }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索案例..."
          className="w-full rounded-lg border pl-9 pr-4 py-2 text-sm outline-none transition-all focus:ring-1"
          style={{
            ...selectStyle,
            // @ts-expect-error custom property
            "--tw-ring-color": "hsl(var(--primary) / 0.5)",
          }}
        />
      </div>

      {/* Industry */}
      <select
        value={selectedIndustry}
        onChange={(e) => onIndustryChange(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm outline-none cursor-pointer transition-all"
        style={selectStyle}
      >
        <option value="">全部行业</option>
        {industries.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>

      {/* Media */}
      <select
        value={selectedMedia}
        onChange={(e) => onMediaChange(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm outline-none cursor-pointer transition-all"
        style={selectStyle}
      >
        <option value="">全部平台</option>
        {medias.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>

      {/* Region */}
      <select
        value={selectedRegion}
        onChange={(e) => onRegionChange(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm outline-none cursor-pointer transition-all"
        style={selectStyle}
      >
        <option value="">全部地区</option>
        {regions.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}
