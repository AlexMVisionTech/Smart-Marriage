import React, { useEffect, useState } from "react";
import {
  Search,
  Download,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";
import { PriorityBadge } from "../common/PriorityBadge";
import { ApplicationDossierModal } from "./ApplicationDossierModal";
import { toast } from "sonner";
import { api } from "@/app/services/api";

export const ApplicationsManager: React.FC = () => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const countDocuments = (documents: Record<string, any> = {}) => {
    const required = ["national_id", "passport", "birth_cert", "medical_screening", "photos"];
    return {
      submittedDocuments: required.filter((key) => {
        const applicantOne = documents?.[`${key}_applicantOne`];
        const applicantTwo = documents?.[`${key}_applicantTwo`];
        return applicantOne || applicantTwo
          ? Boolean(applicantOne?.uploaded && applicantTwo?.uploaded)
          : Boolean(documents?.[key]?.uploaded);
      }).length,
      requiredDocuments: required.length,
    };
  };

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await api.getApplications();
      setApps(
        response.applications.map((app) => ({
          ...app,
          ...countDocuments(app.documents),
        }))
      );
    } catch (error: any) {
      toast.error(error.message || "Unable to load applications from the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const filterTabs = [
    { id: "all", label: "All Cases", count: apps.length },
    { id: "review", label: "Registrar Review", count: apps.filter((a) => a.status === "review").length },
    { id: "pending", label: "Pending Intake", count: apps.filter((a) => a.status === "pending").length },
    { id: "documents", label: "Docs Required", count: apps.filter((a) => a.status === "documents").length },
    { id: "approved", label: "Approved & Issued", count: apps.filter((a) => a.status === "approved").length },
    { id: "rejected", label: "Rejected", count: apps.filter((a) => a.status === "rejected").length },
  ];

  const filteredApps = apps.filter((a) => {
    const matchFilter = filter === "all" || a.status === filter;
    const matchSearch =
      !search ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.husband?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.wife?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.national.includes(search) ||
      a.husband?.nationalId?.includes(search) ||
      a.wife?.nationalId?.includes(search);
    return matchFilter && matchSearch;
  });

  const handleStatusChange = (id: string, newStatus: string, reason?: string) => {
    api
      .updateApplicationStatus(id, newStatus, reason)
      .then((response) => {
        setApps((prev) =>
          prev.map((app) =>
            app.id === id
              ? {
                  ...response.application,
                  ...countDocuments(response.application.documents),
                }
              : app
          )
        );
      })
      .catch((error) => toast.error(error.message || "Unable to update application status."));
  };

  const handleQuickApprove = (app: any) => {
    handleStatusChange(app.id, "approved");
    toast.success(`Application ${app.id} approved and certificate queued for issuance.`);
  };

  const handleQuickReject = (app: any) => {
    setSelectedApp(app);
  };

  const handleExport = () => {
    toast.success("Exporting applications registry as CSV...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Marriage Applications Registry
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage, verify, and finalize marriage certificate filings across civil registration offices
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Registry
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Search & Tabs */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by case ID, applicant name, national ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors"
            />
          </div>

          <div className="text-xs text-slate-500 self-end sm:self-center font-medium">
            {loading ? "Loading applications..." : <>Showing <strong className="text-slate-800">{filteredApps.length}</strong> filings</>}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filter === tab.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filter === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/80 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 text-left">Case ID</th>
                <th className="py-3 px-4 text-left">Applicants</th>
                <th className="py-3 px-4 text-left">National IDs</th>
                <th className="py-3 px-4 text-left">Documents</th>
                <th className="py-3 px-4 text-left">Filing Date</th>
                <th className="py-3 px-4 text-left">Priority</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Officer</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredApps.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => setSelectedApp(app)}
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {app.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900">{app.husband?.name || app.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{app.wife?.name || "Second applicant"}</p>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                    <p>{app.husband?.nationalId || app.national}</p>
                    <p className="mt-0.5">{app.wife?.nationalId || "Not provided"}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="w-28">
                      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                        <span>Submitted</span>
                        <span>{app.submittedDocuments}/{app.requiredDocuments}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${
                            app.submittedDocuments === app.requiredDocuments ? "bg-emerald-700" : "bg-amber-500"
                          }`}
                          style={{ width: `${(app.submittedDocuments / app.requiredDocuments) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{app.date}</td>
                  <td className="py-3.5 px-4">
                    <PriorityBadge priority={app.priority} />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {app.officer}
                  </td>
                  <td
                    className="py-3.5 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-[11px] shadow-2xs"
                      >
                        Dossier
                      </button>
                      {app.status !== "approved" && (
                        <button
                          onClick={() => handleQuickApprove(app)}
                          className="p-1 rounded-md text-emerald-700 hover:bg-emerald-50"
                          title="Quick Approve"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {app.status !== "rejected" && (
                        <button
                          onClick={() => handleQuickReject(app)}
                          className="p-1 rounded-md text-rose-600 hover:bg-rose-50"
                          title="Review / Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filteredApps.length === 0 && (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto stroke-[1.5] text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No applications match your query</p>
              <p className="text-xs text-slate-500">Try clearing filters or changing search keywords.</p>
            </div>
          )}
        </div>
      </div>

      {/* Dossier Modal */}
      {selectedApp && (
        <ApplicationDossierModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};
