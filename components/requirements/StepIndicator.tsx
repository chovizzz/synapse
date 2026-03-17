"use client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { label: "输入原话" },
  { label: "AI 解析" },
  { label: "确认提交" },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const num = idx + 1;
        const done = num < currentStep;
        const active = num === currentStep;

        return (
          <div key={num} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                  done && "bg-[hsl(var(--primary))] text-white",
                  active &&
                    "bg-[hsl(var(--primary))] text-white ring-4 ring-[hsl(var(--primary))]/30 animate-pulse",
                  !done && !active &&
                    "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                )}
              >
                {done ? <Check className="w-4 h-4" /> : num}
              </div>
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  active
                    ? "text-[hsl(var(--primary))] font-medium"
                    : done
                    ? "text-[hsl(var(--foreground))]"
                    : "text-[hsl(var(--muted-foreground))]"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-16 mx-2 mb-5 transition-colors duration-300",
                  num < currentStep
                    ? "bg-[hsl(var(--primary))]"
                    : "bg-[hsl(var(--border))]"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
