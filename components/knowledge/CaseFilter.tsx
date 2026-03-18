"use client";

import { Search } from "lucide-react";
import type { KnowledgeCase } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索案例..."
          className="w-full rounded-lg border border-border bg-card text-foreground pl-9 pr-4 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {/* Industry */}
      <Select
        value={selectedIndustry || "__all__"}
        onValueChange={(v) => onIndustryChange((v ?? "__all__") === "__all__" ? "" : (v ?? ""))}
        itemToStringLabel={(v) => (!v || v === "__all__" ? "全部行业" : String(v))}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="全部行业" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">全部行业</SelectItem>
          {industries.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Media */}
      <Select
        value={selectedMedia || "__all__"}
        onValueChange={(v) => onMediaChange((v ?? "__all__") === "__all__" ? "" : (v ?? ""))}
        itemToStringLabel={(v) => (!v || v === "__all__" ? "全部平台" : String(v))}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="全部平台" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">全部平台</SelectItem>
          {medias.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Region */}
      <Select
        value={selectedRegion || "__all__"}
        onValueChange={(v) => onRegionChange((v ?? "__all__") === "__all__" ? "" : (v ?? ""))}
        itemToStringLabel={(v) => (!v || v === "__all__" ? "全部地区" : String(v))}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="全部地区" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">全部地区</SelectItem>
          {regions.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
