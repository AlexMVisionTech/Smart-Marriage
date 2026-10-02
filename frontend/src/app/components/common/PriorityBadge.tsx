import React from "react";
import { Zap, Clock, AlertTriangle } from "lucide-react";

interface PriorityBadgeProps {
  priority: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const norm = (priority || "").toLowerCase();

  switch (norm) {
    case "urgent":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
          <Zap className="w-3 h-3 text-rose-500 fill-rose-500/20" />
          Urgent
        </span>
      );
    case "high":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          High
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
          <Clock className="w-3 h-3 text-slate-400" />
          Normal
        </span>
      );
  }
};
