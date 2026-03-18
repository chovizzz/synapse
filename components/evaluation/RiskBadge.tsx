interface RiskBadgeProps {
  level: "high" | "medium" | "low";
  description: string;
}

const LEVEL_CONFIG = {
  high: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "#EF4444",
    dot: "bg-red-400",
    label: "高风险",
  },
  medium: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "#EAB308",
    dot: "bg-yellow-400",
    label: "中风险",
  },
  low: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "#3B82F6",
    dot: "bg-blue-400",
    label: "低风险",
  },
};

export function RiskBadge({ level, description }: RiskBadgeProps) {
  const cfg = LEVEL_CONFIG[level];

  return (
    <div
      className={`relative rounded-lg p-3 pl-4 ${cfg.bg} overflow-hidden`}
    >
      {/* left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg"
        style={{ backgroundColor: cfg.border }}
      />
      <div className="flex items-start gap-2">
        <span
          className={`mt-[5px] h-1.5 w-1.5 rounded-full flex-shrink-0 ${cfg.dot}`}
        />
        <div className="space-y-0.5 min-w-0">
          <span className={`text-xs font-semibold ${cfg.text}`}>
            {cfg.label}
          </span>
          <p className="text-xs text-[hsl(var(--foreground))]/80 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
