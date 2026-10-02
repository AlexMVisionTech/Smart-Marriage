import React from "react";

export type StatusType =
  | "approved"
  | "pending"
  | "rejected"
  | "review"
  | "documents"
  | "verified"
  | "processing"
  | "active"
  | "inactive"
  | "missing"
  | "valid";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  showDot?: boolean;
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  approved: {
    label: "Approved",
    bg: "bg-emerald-50/80",
    text: "text-emerald-700",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  valid: {
    label: "Valid & Verified",
    bg: "bg-emerald-50/80",
    text: "text-emerald-700",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  verified: {
    label: "Verified",
    bg: "bg-emerald-50/80",
    text: "text-emerald-700",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "Pending Review",
    bg: "bg-amber-50/80",
    text: "text-amber-700",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
  },
  review: {
    label: "Under Legal Review",
    bg: "bg-sky-50/80",
    text: "text-sky-700",
    border: "border-sky-200/80",
    dot: "bg-sky-500",
  },
  documents: {
    label: "Submitted",
    bg: "bg-sky-50/80",
    text: "text-sky-700",
    border: "border-sky-200/80",
    dot: "bg-sky-500",
  },
  missing: {
    label: "Missing Document",
    bg: "bg-amber-50/80",
    text: "text-amber-700",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-50/80",
    text: "text-rose-700",
    border: "border-rose-200/80",
    dot: "bg-rose-500",
  },
  processing: {
    label: "Processing",
    bg: "bg-indigo-50/80",
    text: "text-indigo-700",
    border: "border-indigo-200/80",
    dot: "bg-indigo-500",
  },
  active: {
    label: "Active",
    bg: "bg-emerald-50/80",
    text: "text-emerald-700",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  inactive: {
    label: "Inactive",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "sm",
  showDot = true,
}) => {
  const norm = (status || "").toLowerCase();
  const conf = statusConfig[norm] || {
    label: status || "Unknown",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  };

  const sizeCls =
    size === "sm"
      ? "text-xs px-2.5 py-0.5 gap-1.5 font-medium"
      : "text-xs px-3 py-1 gap-2 font-semibold";

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide transition-colors ${conf.bg} ${conf.text} ${conf.border} ${sizeCls}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${conf.dot} ${
            norm === "pending" || norm === "review" ? "animate-pulse" : ""
          }`}
        />
      )}
      {conf.label}
    </span>
  );
};
