import React, { useEffect, useMemo, useState } from "react";
import {
  UploadCloud,
  Search,
  Award,
  Clock,
  ArrowRight,
  CheckCircle2,
  Landmark,
} from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";
import { api } from "@/app/services/api";

interface CitizenDashboardProps {
  onNavigate: (page: string) => void;
  currentUser?: any;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ onNavigate, currentUser }) => {
  const [application, setApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getApplications(currentUser?.nationalId ? { nationalId: currentUser.nationalId } : undefined)
      .then((response) => {
        const nationalId = currentUser?.nationalId;
        const apps = response.applications || [];
        const matchingApp =
          apps.find(
            (app) =>
              nationalId &&
              (app.husband?.nationalId === nationalId || app.wife?.nationalId === nationalId)
          ) || null;
        setApplication(matchingApp);
      })
      .catch(() => setApplication(null))
      .finally(() => setLoading(false));
  }, [currentUser?.nationalId]);

  const documentRows = useMemo(() => {
    const documents = application?.documents || {};
    return [
      { key: "national_id", label: "National ID" },
      { key: "passport", label: "Passport Copies" },
      { key: "photos", label: "Passport Photos" },
      { key: "medical_screening", label: "Medical Clearance" },
      { key: "birth_cert", label: "Birth Certificate" },
    ].map((doc) => {
      const uploaded = Boolean(documents[doc.key]?.uploaded);
      return {
        label: doc.label,
        status: uploaded ? documents[doc.key]?.status || "Verified" : "Required",
        tone: uploaded ? "success" : "warning",
      };
    });
  }, [application]);

  const requiredKeys = ["national_id", "passport", "photos", "medical_screening", "birth_cert"];
  const uploadedRequired = requiredKeys.filter((key) => application?.documents?.[key]?.uploaded).length;
  const timeline = application?.timeline?.length
    ? application.timeline.map((item: any) => ({
        label: item.label,
        detail: item.detail,
        complete: item.done || item.current,
      }))
    : [];
  const applicants = [
    application?.husband,
    application?.wife,
  ].filter(Boolean);
  const caseDetails = [
    { label: "Application ID", value: application?.id || "No application" },
    { label: "Stage", value: application?.status || "Not started" },
    { label: "Documents", value: `${uploadedRequired} of ${requiredKeys.length} cleared` },
    { label: "Target date", value: application?.marriageDate || "Not set" },
  ];
  const approved = application?.status === "approved";
  const actionTone = approved
    ? "border-emerald-200 bg-emerald-50/80"
    : application
    ? "border-slate-200 bg-slate-50"
    : "border-slate-200 bg-white";
  const actionTextTone = approved ? "text-emerald-950" : "text-slate-900";
  const actionDescriptionTone = approved ? "text-emerald-800" : "text-slate-600";

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase text-slate-500">Citizen portal</p>
              <StatusBadge status={application?.status || "inactive"} />
            </div>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-slate-950">
              {currentUser?.name || application?.husband?.name || "Citizen"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {loading
                ? "Loading your registry record..."
                : application
                ? "Your marriage certificate application is loaded from the registry database."
                : "You have not started a marriage certificate application yet."}
            </p>
          </div>

          <div className={`w-full rounded-lg border p-4 lg:max-w-sm ${actionTone}`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-700 ring-1 ring-slate-200">
                {approved ? <Award className="h-4 w-4 text-emerald-700" /> : <UploadCloud className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${actionTextTone}`}>
                  {approved ? "Application approved" : application ? "Application in progress" : "Start application"}
                </p>
                <p className={`mt-1 text-xs leading-5 ${actionDescriptionTone}`}>
                  {approved
                    ? "Your certificate is ready to check in the Certificate Vault."
                    : application
                    ? "Track your progress and complete any outstanding document requests."
                    : "Fill the online form and submit your supporting records."}
                </p>
                <button
                  onClick={() => onNavigate(approved ? "certificate" : application ? "track" : "upload")}
                  className="mt-3 inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  {approved ? "Check certificate" : application ? "Track progress" : "Start application"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid border-t border-slate-200 bg-slate-50/80 sm:grid-cols-2 xl:grid-cols-4">
          {caseDetails.map((item, index) => (
            <div
              key={item.label}
              className={`px-5 py-4 ${index > 0 ? "border-t border-slate-200 sm:border-t-0 sm:border-l" : ""}`}
            >
              <p className="text-[11px] font-semibold uppercase text-slate-500">{item.label}</p>
              <p className="mt-1 text-sm font-bold text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="xl:col-span-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold text-slate-950">Case File</h2>
              <p className="text-sm text-slate-500">Applicant details and registrar progress</p>
            </div>
            <button
              onClick={() => onNavigate("track")}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              Open tracker
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="grid bg-slate-50/80 text-[11px] font-semibold uppercase text-slate-500 sm:grid-cols-[1.4fr_1fr_1.2fr]">
              <div className="px-4 py-2.5">Applicant</div>
              <div className="border-t border-slate-200 px-4 py-2.5 sm:border-l sm:border-t-0">ID number</div>
              <div className="border-t border-slate-200 px-4 py-2.5 sm:border-l sm:border-t-0">Registry status</div>
            </div>
            {applicants.length > 0 ? applicants.map((person: any) => (
              <div key={person.nationalId || person.name} className="grid border-t border-slate-200 text-sm sm:grid-cols-[1.4fr_1fr_1.2fr]">
                <div className="px-4 py-3 font-semibold text-slate-950">{person.name || "Not provided"}</div>
                <div className="border-t border-slate-100 px-4 py-3 font-mono text-xs text-slate-600 sm:border-l sm:border-t-0">
                  {person.nationalId || "Not provided"}
                </div>
                <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-600 sm:border-l sm:border-t-0">
                  {person.nationality || "Not provided"}
                </div>
              </div>
            )) : (
              <div className="border-t border-slate-200 px-4 py-6 text-sm text-slate-500">
                No application record found. Open the Document Center to apply online.
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {timeline.map((item, index) => (
              <div key={item.label} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-start">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                      item.complete
                        ? "border-emerald-200 bg-emerald-50 text-[#006b3f]"
                        : "border-slate-200 bg-white text-slate-400"
                    }`}
                  >
                    {item.complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Stage {index + 1}</p>
                  <p className="text-sm font-bold text-slate-950">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="xl:col-span-4 space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-950">Document Readiness</h3>
                <p className="text-sm text-slate-500">Required evidence checklist</p>
              </div>
              <Landmark className="h-5 w-5 text-slate-400" />
            </div>
            <div className="space-y-2">
              {documentRows.map((doc) => (
                <div key={doc.label} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <span className="text-sm font-semibold text-slate-700">{doc.label}</span>
                  <span
                    className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                      doc.tone === "success"
                        ? "bg-emerald-50 text-[#006b3f]"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-950">Actions</h3>
            <div className="mt-4 space-y-2">
              {[
                { id: "upload", title: "Upload Documents", icon: UploadCloud },
                { id: "track", title: "View Detailed Tracker", icon: Search },
                { id: "certificate", title: "Open Certificate Vault", icon: Award },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className="group flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-[#006b3f] group-hover:text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      {item.title}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
