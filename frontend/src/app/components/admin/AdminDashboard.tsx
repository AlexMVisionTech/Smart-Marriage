import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Download } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatusBadge } from "../common/StatusBadge";
import { PriorityBadge } from "../common/PriorityBadge";
import { ApplicationDossierModal } from "./ApplicationDossierModal";
import { toast } from "sonner";
import { api } from "@/app/services/api";

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    Promise.all([
      api.getApplications(),
      api.getStatsSummary(),
      api.getMonthlyStats(),
      api.getStatusDistribution(),
    ])
      .then(([applicationsRes, statsRes, monthlyRes, distributionRes]) => {
        setRecentApps(applicationsRes.applications.slice(0, 5));
        setStats(statsRes.stats || {});
        setMonthlyData(
          (monthlyRes.monthly || []).map((item: any) => ({
            month: item.month,
            filed: item.apps ?? item.filed ?? 0,
            issued: item.approved ?? item.issued ?? 0,
          }))
        );
        setStatusData(
          (distributionRes.distribution || []).map((item: any) => ({
            ...item,
            name: item.name === "Pending" ? "In Review" : item.name,
            color:
              item.name === "Approved"
                ? "#047857"
                : item.name === "Rejected"
                ? "#be123c"
                : "#b45309",
          }))
        );
      })
      .catch((error) => toast.error(error.message || "Unable to load registrar dashboard data."));
  }, []);

  const workload = useMemo(() => {
    const urgentCount = recentApps.filter((app) => app.priority === "urgent").length;
    const reviewCount = recentApps.filter((app) => app.status === "review").length;
    const readyCount = recentApps.filter((app) => app.status === "approved").length;
    return [
      { label: "Open applications", value: String(stats.totalApplications ?? recentApps.length), detail: `${reviewCount} need registrar action` },
      { label: "Pending intake", value: String(stats.pendingApplications ?? 0), detail: "awaiting initial review" },
      { label: "Ready to issue", value: String(stats.approvedCount ?? readyCount), detail: "approved applications" },
      { label: "Urgent priority", value: String(urgentCount), detail: "requires same-day attention" },
    ];
  }, [recentApps, stats]);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Registrar desk</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">Marriage Registry Operations</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review active applications, monitor service performance, and complete certificate decisions from a single operational workspace.
            </p>
          </div>

          <div className="w-full rounded-lg border border-amber-200 bg-amber-50 p-4 lg:max-w-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-amber-700 ring-1 ring-amber-200">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-950">{workload[3].value} urgent cases require review</p>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Priority filings are waiting for registrar decision before the end-of-day queue close.
                </p>
                <button
                  onClick={() => onNavigate("applications")}
                  className="mt-3 inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  Open queue
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid border-t border-slate-200 bg-slate-50/80 sm:grid-cols-2 xl:grid-cols-4">
          {workload.map((item, index) => (
            <div
              key={item.label}
              className={`px-5 py-4 ${index > 0 ? "border-t border-slate-200 sm:border-t-0 sm:border-l" : ""}`}
            >
              <p className="text-[11px] font-semibold uppercase text-slate-500">{item.label}</p>
              <p className="mt-1 text-xl font-bold text-slate-950">{item.value}</p>
              <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-8">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold text-slate-950">Filing and Issuance Trend</h2>
              <p className="text-sm text-slate-500">Monthly filings compared with finalized certificates</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-900" />
                Filed
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-700" />
                Issued
              </span>
            </div>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#0f172a", fontSize: "12px" }} />
                <Area type="monotone" dataKey="filed" stroke="#0f172a" strokeWidth={2} fill="#e2e8f0" fillOpacity={0.35} />
                <Area type="monotone" dataKey="issued" stroke="#047857" strokeWidth={2} fill="#d1fae5" fillOpacity={0.45} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-4">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-950">Current Disposition</h2>
            <p className="text-sm text-slate-500">Active filings by decision state</p>
          </div>

          <div className="relative mt-4 flex h-44 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute text-center">
              <span className="text-xl font-bold text-slate-950">{stats.approvalRatePercent ?? 0}%</span>
              <span className="block text-[10px] font-semibold uppercase text-slate-400">On Time</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-bold text-slate-950">Priority Queue</h3>
            <p className="text-sm text-slate-500">Recent filings requiring registrar attention</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
            <button
              onClick={() => onNavigate("applications")}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/90 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Case ID</th>
                <th className="px-4 py-3 text-left">Applicants</th>
                <th className="px-4 py-3 text-left">National IDs</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Officer</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentApps.map((app) => (
                <tr key={app.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{app.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{app.husband?.name || app.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{app.wife?.name || "Second applicant"}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                    <p>{app.husband?.nationalId || app.national}</p>
                    <p className="mt-0.5">{app.wife?.nationalId || "Not provided"}</p>
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={app.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                  <td className="px-4 py-3 font-medium text-slate-600">{app.officer}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      Open dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedApp && (
        <ApplicationDossierModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusChange={(id, newStatus) => {
            toast.success(`Application ${id} updated to ${newStatus}`);
          }}
        />
      )}
    </div>
  );
};
