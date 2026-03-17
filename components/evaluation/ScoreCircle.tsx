"use client";

import { useEffect, useRef, useState } from "react";

interface ScoreCircleProps {
  score: number;
  size?: number;
}

export function ScoreCircle({ score, size = 120 }: ScoreCircleProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const rafRef = useRef<number | null>(null);

  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeColor =
    score >= 80 ? "#10B981" : score >= 60 ? "#3B82F6" : "#EF4444";

  useEffect(() => {
    const start = performance.now();
    const duration = 900;

    function step(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [score]);

  const dashOffset =
    circumference - (animatedScore / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={8}
        />
        {/* progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.05s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold leading-none"
          style={{ fontSize: size * 0.25, color: strokeColor }}
        >
          {animatedScore}
        </span>
        <span
          className="text-center leading-tight mt-1"
          style={{
            fontSize: size * 0.09,
            color: "hsl(var(--muted-foreground))",
            maxWidth: size * 0.6,
          }}
        >
          接单成功率
        </span>
      </div>
    </div>
  );
}
