import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock,
  Download,
  AlertCircle,
  FileCheck2,
  Calendar,
  Building2,
  MapPin,
  UserRound,
  Phone,
  Mail,
  Shield,
  MessageSquare,
} from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";
import { toast } from "sonner";
import { api } from "@/app/services/api";

interface ApplicationTrackerProps {
  onNavigateToUpload?: () => void;
  onNavigateToCertificate?: () => void;
  currentUser?: any;
}

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  onNavigateToUpload,
  onNavigateToCertificate,
  currentUser,
}) => {
  const [application, setApplication] = useState<any | null>(null);

  useEffect(() => {
    api.getApplications(currentUser?.nationalId ? { nationalId: currentUser.nationalId } : undefined).then((response) => {
      const nationalId = currentUser?.nationalId;
      const apps = response.applications || [];
      setApplication(
        apps.find(
          (app) =>
            nationalId &&
            (app.husband?.nationalId === nationalId || app.wife?.nationalId === nationalId)
        ) || null
      );
    });
  }, [currentUser?.nationalId]);

  const steps = useMemo(
    () =>
      (application?.timeline || []).map((item: any) => ({
        title: item.label,
        desc: item.detail,
        date: item.date || "Not set",
        status: item.current ? "current" : item.done ? "completed" : "upcoming",
        comment: item.comment,
      })),
    [application]
  );
  const approved = application?.status === "approved";

  const handleDownloadReceipt = () => {
    toast.success("Downloading official application submission receipt (PDF)...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Application Tracker</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Registry milestones and case activity for your marriage certificate application
          </p>
        </div>

        <button
          onClick={handleDownloadReceipt}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Download Filing Receipt
        </button>
      </div>

      {/* Meta Highlights Card */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Application ID
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm">{application?.id || "No application"}</span>
          </div>

          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Reference Number
            </span>
            <span className="font-mono font-semibold text-slate-700 text-sm">{application?.referenceNo || "Not assigned"}</span>
          </div>

          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Filing Date
            </span>
            <span className="font-medium text-slate-800 text-sm">{application?.date || application?.submittedAt || "Not submitted"}</span>
          </div>

          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Current Status
            </span>
            <StatusBadge status={application?.status || "inactive"} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step Progression Timeline */}
        <div className="lg:col-span-8 bg-white rounded-lg border border-slate-200/90 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">
            Registry Processing Stages
          </h2>

          <div className="space-y-8">
            {steps.length > 0 ? steps.map((step, idx) => {
              const isDone = step.status === "completed";
              const isCurrent = step.status === "current";

              return (
                <div key={idx} className="relative flex items-start gap-4">
                  {/* Vertical connecting line */}
                  {idx < steps.length - 1 && (
                    <div
                      className={`absolute left-4 top-8 -bottom-8 w-0.5 ${
                        isDone ? "bg-emerald-400" : "bg-slate-200"
                      }`}
                    />
                  )}

                  {/* Step node icon */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all ${
                      isDone
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                        : isCurrent
                        ? "bg-slate-900 border-slate-900 text-white ring-4 ring-slate-100"
                        : "bg-white border-slate-200 text-slate-300"
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : isCurrent ? (
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    ) : (
                      <span className="text-xs font-semibold">{idx + 1}</span>
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-sm font-bold ${
                            isDone || isCurrent ? "text-slate-900" : "text-slate-400"
                          }`}
                        >
                          {step.title}
                        </h3>
                        {isCurrent && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-white">
                            Current Stage
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{step.date}</span>
                    </div>

                    <p
                      className={`text-xs leading-relaxed ${
                        isDone || isCurrent ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      {step.desc}
                    </p>

                    {step.comment && (
                      <div className="mt-2 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-emerald-800 text-xs flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{step.comment}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-slate-500">No timeline events have been recorded for this application.</p>
            )}
          </div>
        </div>

        {/* Right Info Column */}
        <div className="lg:col-span-4 space-y-4">
          {/* Estimated Completion */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <Clock className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Processing estimate</h3>
                <p className="text-xs text-slate-500">Registry review timeline</p>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Estimated processing time</p>
                <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                  {application?.estimatedCompletion ? "Estimate available" : "Pending registry estimate"}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">
                <span className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" /> Target issuance date
                </span>
                <strong className="text-sm font-semibold text-slate-900">{application?.estimatedCompletion || "Not yet provided"}</strong>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {application?.estimatedCompletion ? "Estimate provided" : "Awaiting registry estimate"}
              </span>
            </div>
          </div>

          {/* Assigned Registry Officer */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <Building2 className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Registry assignment</h3>
                <p className="text-xs text-slate-500">Officer handling your application</p>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200">
                  {application?.officer ? <span className="font-bold text-slate-800">{application.officer.slice(0, 2).toUpperCase()}</span> : <UserRound className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">{application?.officer || "Awaiting assignment"}</p>
                  <p className="text-sm text-slate-500">Registry officer</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <span className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" /> Civil Registration Office
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {application?.officer ? "Assigned" : "Pending"}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {approved && (
        <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-emerald-900">Approved. Your certificate is ready to check.</p>
          <button
            onClick={onNavigateToCertificate}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Check certificate <FileCheck2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
