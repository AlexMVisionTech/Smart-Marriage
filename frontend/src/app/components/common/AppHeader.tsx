import React from "react";
import { Bell, LogOut } from "lucide-react";
import { KenyanShield } from "./KenyanShield";

interface AppHeaderProps {
  portal: "citizen" | "admin";
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  unreadCount?: number;
  user?: any;
}

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard",
  upload: "Documents",
  track: "Application Tracker",
  certificate: "Certificate",
  notifications: "Notifications",
  profile: "Profile",
  applications: "Applications",
  ai: "Review Assistant",
  audit: "Audit Trail",
  settings: "Settings",
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  portal,
  onLogout,
  currentPage,
  onNavigate,
  unreadCount = 0,
  user,
}) => {
  const displayName = user?.name || (portal === "citizen" ? "Citizen User" : "Registrar User");
  const avatar =
    user?.avatar ||
    displayName
      .split(" ")
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  const roleLabel = portal === "citizen" ? "Applicant" : user?.title || "Registrar";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur-md sm:px-6">
      <div className="flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black text-white shadow-sm">
            <KenyanShield className="h-8 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold tracking-tight text-slate-950">
                Marriage Registry
              </h1>
              <span className="hidden text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:inline-flex">
                {portal === "citizen" ? "Citizen" : "Registrar"}
              </span>
            </div>
            <p className="hidden text-[11px] text-slate-500 sm:block">
              {pageTitles[currentPage] || "Workspace"} <span className="mx-1 text-slate-300">/</span> Civil Records &amp; Services
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {portal === "citizen" && (
            <button
              onClick={() => onNavigate("notifications")}
              className="relative flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:text-slate-950"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#b11226] ring-2 ring-white" />
              )}
            </button>
          )}

          <div className="hidden items-center gap-2.5 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
              {avatar}
            </div>
            <div className="text-left">
              <div className="text-sm font-medium leading-tight text-slate-900">
                {displayName}
              </div>
              <div className="text-[10px] text-slate-500">
                {roleLabel}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:text-[#b11226]"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid h-[3px] grid-cols-[1fr_1fr_0.16fr_1fr]" aria-hidden="true">
        <span className="bg-slate-950" />
        <span className="bg-[#b11226]" />
        <span className="bg-white" />
        <span className="bg-[#006b3f]" />
      </div>
    </header>
  );
};
