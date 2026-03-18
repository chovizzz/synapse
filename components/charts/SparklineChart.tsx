"use client";

interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export function SparklineChart({
  data,
  color = "#6366f1",
  height = 36,
  width = 80,
}: SparklineChartProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  const firstY = parseFloat(points[0].split(",")[1]);
  const lastY = parseFloat(points[points.length - 1].split(",")[1]);
  const fillD = `M 0,${firstY} L ${points.join(" L ")} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`sparkline-gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={fillD}
        fill={`url(#sparkline-gradient-${color.replace("#", "")})`}
      />
      <path
        d={pathD}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={parseFloat(points[points.length - 1].split(",")[0])}
        cy={lastY}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}
