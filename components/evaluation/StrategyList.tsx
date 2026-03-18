interface StrategyListProps {
  suggestions: string[];
}

export function StrategyList({ suggestions }: StrategyListProps) {
  return (
    <div className="space-y-3">
      {suggestions.map((text, idx) => (
        <div
          key={idx}
          className="relative rounded-lg p-3 pl-4 bg-blue-500/5 overflow-hidden"
        >
          {/* left accent bar */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg bg-blue-500" />
          <div className="flex items-start gap-3">
            <span className="text-xs font-bold text-blue-400 flex-shrink-0 tabular-nums w-5">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <p className="text-xs text-[hsl(var(--foreground))]/80 leading-relaxed">{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
