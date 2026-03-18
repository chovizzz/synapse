"use client";

import { useState, useMemo } from "react";
import { BookOpen, Share2 } from "lucide-react";
import { getKnowledgeCases } from "@/lib/store";
import { CaseCard } from "@/components/knowledge/CaseCard";
import { CaseFilter } from "@/components/knowledge/CaseFilter";
import { CaseDetail } from "@/components/knowledge/CaseDetail";
import type { KnowledgeCase } from "@/types";

function toast(msg: string) {
  const el = document.createElement("div");
  el.textContent = msg;
  Object.assign(el.style, {
    position: "fixed",
    bottom: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "hsl(220 14% 18%)",
    color: "white",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    zIndex: "9999",
    border: "1px solid hsl(var(--border))",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

export default function KnowledgePage() {
  const allCases = useMemo(() => getKnowledgeCases(), []);

  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedMedia, setSelectedMedia] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCase, setActiveCase] = useState<KnowledgeCase | null>(null);

  const filtered = useMemo(() => {
    return allCases.filter((c) => {
      if (selectedIndustry && c.industry !== selectedIndustry) return false;
      if (selectedMedia && c.mediaPlatform !== selectedMedia) return false;
      if (selectedRegion && c.region !== selectedRegion) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchable = [c.title, c.industry, c.mediaPlatform, c.region, c.strategySummary, ...c.tags].join(" ").toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [allCases, selectedIndustry, selectedMedia, selectedRegion, searchQuery]);

  const highlightCount = allCases.filter((c) => c.isHighlight).length;
  const industryCount = new Set(allCases.map((c) => c.industry)).size;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={20} style={{ color: "hsl(var(--primary))" }} />
            <h1 className="text-xl font-bold text-white">经验知识库</h1>
          </div>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            基于真实投放数据的策略沉淀
          </p>
        </div>
        <button
          onClick={() => toast("功能开发中")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 active:scale-95"
          style={{
            backgroundColor: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
          }}
        >
          <Share2 size={15} />
          分享新案例
        </button>
      </div>

      {/* Filters */}
      <CaseFilter
        cases={allCases}
        selectedIndustry={selectedIndustry}
        onIndustryChange={setSelectedIndustry}
        selectedMedia={selectedMedia}
        onMediaChange={setSelectedMedia}
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Stats summary */}
      <div
        className="flex items-center gap-4 text-sm px-4 py-3 rounded-lg border"
        style={{
          borderColor: "hsl(var(--border))",
          backgroundColor: "hsl(var(--card))",
          color: "hsl(var(--muted-foreground))",
        }}
      >
        <span>
          共{" "}
          <strong className="text-white">{allCases.length}</strong>{" "}
          个案例
        </span>
        <span className="opacity-30">|</span>
        <span>
          优秀案例{" "}
          <strong style={{ color: "rgb(250,204,21)" }}>{highlightCount}</strong>{" "}
          个
        </span>
        <span className="opacity-30">|</span>
        <span>
          覆盖{" "}
          <strong className="text-white">{industryCount}</strong>{" "}
          个行业
        </span>
        {(selectedIndustry || selectedMedia || selectedRegion || searchQuery) && (
          <>
            <span className="opacity-30">|</span>
            <span>
              筛选结果{" "}
              <strong style={{ color: "rgb(96,165,250)" }}>{filtered.length}</strong>{" "}
              条
            </span>
          </>
        )}
      </div>

      {/* Case grid */}
      {filtered.length === 0 ? (
        <div
          className="rounded-xl border p-16 text-center"
          style={{
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">未找到匹配案例</p>
          <p className="text-xs mt-1">尝试修改筛选条件或清空搜索词</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <CaseCard
              key={c.id}
              case={c}
              onClick={() => setActiveCase(c)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      <CaseDetail case={activeCase} onClose={() => setActiveCase(null)} />
    </div>
  );
}
