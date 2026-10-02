import React from "react";
import {
  LayoutDashboard,
  FileUp,
  ListChecks,
  BadgeCheck,
  Bell,
  CircleUserRound,
  BarChart3,
  ClipboardList,
  FileText,
  Bot,
  Settings,
  Lock,
  ChevronRight,
} from "lucide-react";
import { KenyanShield } from "./KenyanShield";

interface AppSidebarProps {
  portal: "citizen" | "admin";
  currentPage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  portal,
  currentPage,
  onNavigate,
  collapsed,
  setCollapsed,
}) => {
  const citizenItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "upload", label: "Document Center", icon: FileUp },
    { id: "track", label: "Application Tracker", icon: ListChecks },
    { id: "certificate", label: "Certificate Vault", icon: BadgeCheck },
    { id: "notifications", label: "Registry Alerts", icon: Bell },
    { id: "profile", label: "Civil Profile", icon: CircleUserRound },
  ];

  const adminItems = [
    { id: "dashboard", label: "Control Center", icon: BarChart3 },
    { id: "applications", label: "Applications Queue", icon: ClipboardList },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "ai", label: "Review Assistant", icon: Bot },
    { id: "audit", label: "Audit Trail", icon: Lock },
    { id: "settings", label: "System Settings", icon: Settings },
  ];

  const items = portal === "citizen" ? citizenItems : adminItems;
  const shellAccent = "text-slate-900";
  const activeItem =
    portal === "citizen"
      ? "bg-emerald-50/70 text-[#006b3f]"
      : "bg-slate-950 text-white shadow-sm";

  return (
    <aside
      className={`z-20 hidden shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm transition-all duration-200 md:flex ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="border-b border-slate-100 p-3">
        <div className={`flex items-center gap-3 px-2 py-2.5 ${shellAccent} ${collapsed ? "justify-center" : ""}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-950">
            <KenyanShield className="h-7 w-4 text-white" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">Marriage Registry</p>
              <p className="text-[10px] text-slate-500">{portal === "citizen" ? "Citizen services" : "Registrar workspace"}</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-full before:bg-transparent ${
                isActive
                  ? `${activeItem} ${portal === "citizen" ? "before:bg-[#006b3f]" : ""}`
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.75} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate text-left">{item.label}</span>
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-3">
        {!collapsed && (
          <div className="mb-3 border-t border-slate-100 px-2 pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {portal === "citizen" ? "Marriage Registry" : "Registrar Workspace"}
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-950"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight
            className={`h-4 w-4 transition-transform duration-200 ${
              collapsed ? "" : "rotate-180"
            }`}
          />
        </button>
      </div>
    </aside>
  );
};
