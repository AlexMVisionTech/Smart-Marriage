import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  isPositiveDelta?: boolean;
  subtext?: string;
  icon: LucideIcon;
  colorScheme?: "navy" | "emerald" | "amber" | "indigo" | "rose";
}

const colorSchemes = {
  navy: {
    iconBg: "bg-slate-950 text-white",
    accent: "bg-slate-950",
  },
  emerald: {
    iconBg: "bg-[#006b3f] text-white",
    accent: "bg-[#006b3f]",
  },
  amber: {
    iconBg: "bg-amber-600 text-white",
    accent: "bg-amber-500",
  },
  indigo: {
    iconBg: "bg-slate-700 text-white",
    accent: "bg-slate-700",
  },
  rose: {
    iconBg: "bg-[#b11226] text-white",
    accent: "bg-[#b11226]",
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  delta,
  isPositiveDelta = true,
  subtext,
  icon: Icon,
  colorScheme = "navy",
}) => {
  const scheme = colorSchemes[colorScheme] || colorSchemes.navy;

  return (
    <div className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className={`h-1 ${scheme.accent}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase text-slate-500">
              {label}
            </p>
            <div className="truncate text-2xl font-bold text-slate-950 lg:text-3xl">
              {value}
            </div>
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ${scheme.iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        {(delta || subtext) && (
          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs">
            {delta && (
              <span
                className={`inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${
                  isPositiveDelta
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-[#b11226]"
                }`}
              >
                {delta}
              </span>
            )}
            {subtext && <span className="truncate text-slate-500">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
