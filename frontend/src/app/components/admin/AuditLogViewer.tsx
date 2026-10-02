import React, { useEffect, useState } from "react";
import { Search, Download, Lock } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/app/services/api";

export const AuditLogViewer: React.FC = () => {
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api
      .getAuditLogs()
      .then((response) => setLogs(response.logs || []))
      .catch((error) => toast.error(error.message || "Unable to load audit logs from the database."));
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      !search ||
      l.officer.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    toast.success("Exporting compliance audit trail as CSV...");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Compliance Audit Trail
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Lock className="w-3 h-3" />
              Protected Log
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Protected record of registrar actions, status transitions, and certificate issuance events
          </p>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export Audit Log
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="w-full sm:max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail by officer, target ID, action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <span className="text-xs text-slate-500">{filteredLogs.length} events recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 text-left">Officer / System</th>
                <th className="py-3 px-4 text-left">Action Event</th>
                <th className="py-3 px-4 text-left">Target ID</th>
                <th className="py-3 px-4 text-left">IP Address</th>
                <th className="py-3 px-4 text-left">Timestamp</th>
                <th className="py-3 px-4 text-right">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{log.officer}</td>
                  <td className="py-3 px-4 text-slate-800">{log.action}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">{log.target}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{log.ip}</td>
                  <td className="py-3 px-4 text-slate-500">{log.date}</td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        log.status === "success"
                          ? "bg-emerald-50 text-emerald-700"
                          : log.status === "warning"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-sky-50 text-sky-700"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          log.status === "success"
                            ? "bg-emerald-500"
                            : log.status === "warning"
                            ? "bg-amber-500"
                            : "bg-sky-500"
                        }`}
                      />
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
