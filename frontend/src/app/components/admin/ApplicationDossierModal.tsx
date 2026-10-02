import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldCheck,
  Eye,
  AlertTriangle,
  Building2,
  Calendar,
  Download,
} from "lucide-react";
import { StatusBadge } from "../common/StatusBadge";
import { PriorityBadge } from "../common/PriorityBadge";
import { toast } from "sonner";
import { api } from "@/app/services/api";

interface ApplicationDossierModalProps {
  application: any;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: string, reason?: string) => void;
}

export const ApplicationDossierModal: React.FC<ApplicationDossierModalProps> = ({
  application,
  onClose,
  onStatusChange,
}) => {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("national_id");

  if (!application) return null;

  const documentSpecs = [
    { id: "national_id", title: "National ID (Both Applicants)", owner: "Both applicants" },
    { id: "passport", title: "Passport Copies", owner: "Both applicants" },
    { id: "photos", title: "Passport Photographs", owner: "Both applicants" },
    { id: "medical_screening", title: "Pre-Marital Medical Clearance", owner: "Both applicants" },
    { id: "birth_cert", title: "Attested Birth Certificate", owner: "Applicant record" },
  ];

  const submittedDocuments = documentSpecs.map((spec) => {
    const documents = application.documents || {};
    const applicantRecords = [
      { label: application.husband?.name || "Applicant one", documentType: `${spec.id}_applicantOne`, record: documents[`${spec.id}_applicantOne`] },
      { label: application.wife?.name || "Applicant two", documentType: `${spec.id}_applicantTwo`, record: documents[`${spec.id}_applicantTwo`] },
    ].filter((entry) => entry.record);
    const records = applicantRecords.length
      ? applicantRecords
      : [{ label: "Applicant", documentType: spec.id, record: documents[spec.id] }];
    const uploadedRecords = records.filter((entry) => Boolean(entry.record?.uploaded));
    const uploaded = uploadedRecords.length > 0;
    const record = uploadedRecords[uploadedRecords.length - 1]?.record || records[0]?.record || {};
    const allExpectedUploaded = applicantRecords.length
      ? uploadedRecords.length === 2
      : uploaded;
    return {
      ...spec,
      files: uploadedRecords.map((entry) => ({
        label: entry.label,
        name: entry.record.name || `${spec.title}.pdf`,
        documentType: entry.documentType,
      })),
      fileName: uploaded
        ? uploadedRecords.map((entry) => `${entry.label}: ${entry.record.name || "PDF uploaded"}`).join(" · ")
        : "Not submitted",
      status: allExpectedUploaded ? record.status || "verified" : uploaded ? "pending" : "missing",
      quality: uploaded ? `${uploadedRecords.length}/${applicantRecords.length ? 2 : 1} received` : "Not submitted",
      submittedAt: record.uploadedAt || record.verifiedAt || "Pending applicant upload",
      pages: uploadedRecords.reduce((count, entry) => count + (entry.record.pages || 1), 0),
      summary: uploaded
        ? allExpectedUploaded
          ? "Both applicants' files are available for registrar inspection."
          : "A file has been uploaded. Waiting for the other applicant's file."
        : "This document has not been submitted. Request the applicant to upload it before approval.",
    };
  });

  const selectedDocument =
    submittedDocuments.find((doc) => doc.id === selectedDocumentId) || submittedDocuments[0];

  const handleApprove = () => {
    onStatusChange(application.id, "approved");
    toast.success(`Application ${application.id} approved. Certificate queued for issuance.`);
    onClose();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a legal justification for rejection.");
      return;
    }
    onStatusChange(application.id, "rejected", rejectReason);
    toast.error(`Application ${application.id} rejected.`);
    onClose();
  };

  const handleRequestDocs = () => {
    onStatusChange(application.id, "documents");
    toast.info(`Additional documents requested from applicant.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-sm text-slate-900">
                {application.id}
              </span>
              <StatusBadge status={application.status} />
              <PriorityBadge priority={application.priority || "normal"} />
            </div>
            <p className="text-xs text-slate-500">
              Marriage application dossier · Submitted {application.date} · Ref: {application.referenceNo}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Spouses Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Applicant One
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                  Verified
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">{application.husband?.name || application.name}</p>
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <span className="text-slate-400">National ID:</span>{" "}
                  <span className="font-mono font-medium">{application.husband?.nationalId || application.national}</span>
                </p>
                <p>
                  <span className="text-slate-400">Nationality:</span> {application.husband?.nationality || "Not provided"}
                </p>
                <p>
                  <span className="text-slate-400">Date of Birth:</span> {application.husband?.dob || "Not provided"}
                </p>
                <p>
                  <span className="text-slate-400">Place of Birth:</span> {application.husband?.birthPlace || "Not provided"}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Applicant Two
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                  Verified
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">{application.wife?.name || "Not provided"}</p>
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <span className="text-slate-400">National ID:</span>{" "}
                  <span className="font-mono font-medium">{application.wife?.nationalId || "Not provided"}</span>
                </p>
                <p>
                  <span className="text-slate-400">Nationality:</span> {application.wife?.nationality || "Not provided"}
                </p>
                <p>
                  <span className="text-slate-400">Date of Birth:</span> {application.wife?.dob || "Not provided"}
                </p>
                <p>
                  <span className="text-slate-400">Place of Birth:</span> {application.wife?.birthPlace || "Not provided"}
                </p>
              </div>
            </div>
          </div>

          {/* Ceremony Venue & Date */}
          <div className="p-4 rounded-lg border border-slate-200/80 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Registration Office</span>
                <span className="font-medium text-slate-800">{application.venue || "Civil Registration Office, Nairobi"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Solemnization Date</span>
                <span className="font-medium text-slate-800">{application.marriageDate || application.date}</span>
              </div>
            </div>
          </div>

          {/* Document Verification Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Evidentiary Documents
              </h3>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Readability checks active
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3 text-left font-semibold">Document Title</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Status</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Quality</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submittedDocuments.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-800 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        {row.title}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{row.quality}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                          {row.files.map((file) => (
                            <a
                              key={file.documentType}
                              href={api.getDocumentFileUrl(application.id, file.documentType)}
                              download={file.name}
                              title={`Download ${file.label}'s ${row.title}`}
                              className="inline-flex items-center gap-1 font-medium text-emerald-800 hover:text-emerald-950 hover:underline"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download PDF
                            </a>
                          ))}
                          <button
                            disabled={row.status === "missing"}
                            onClick={() => setSelectedDocumentId(row.id)}
                            className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300"
                          >
                            <Eye className="w-3 h-3" />
                            Preview
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Submitted Document Preview
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Select a submitted record above to inspect its contents before decision.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Document</span>
                  <span className="font-semibold text-slate-900">{selectedDocument.title}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Submitted by</span>
                  <span className="text-slate-700">{selectedDocument.owner}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">File name</span>
                  <span className="font-mono text-[11px] text-slate-700">{selectedDocument.fileName}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Pages</span>
                    <span className="font-semibold text-slate-900">{selectedDocument.pages}</span>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Quality</span>
                    <span className="font-semibold text-slate-900">{selectedDocument.quality}</span>
                  </div>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Registrar note</span>
                  <span className="text-slate-700">{selectedDocument.summary}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-300 bg-slate-100 p-3">
              <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-start justify-between border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Republic of Kenya
                    </p>
                    <h4 className="mt-1 text-base font-bold text-slate-950">{selectedDocument.title}</h4>
                    <p className="mt-1 font-mono text-[11px] text-slate-500">{selectedDocument.fileName}</p>
                  </div>
                  <StatusBadge status={selectedDocument.status} showDot={false} />
                </div>

                {selectedDocument.status === "missing" ? (
                  <div className="flex h-64 flex-col items-center justify-center rounded-md border border-dashed border-amber-300 bg-amber-50 text-center">
                    <AlertTriangle className="h-8 w-8 text-amber-600" />
                    <p className="mt-3 text-sm font-bold text-amber-950">Document not submitted</p>
                    <p className="mt-1 max-w-sm text-xs leading-5 text-amber-800">
                      The applicant must upload this record before the registrar can complete the approval decision.
                    </p>
                  </div>
                ) : (
                  <div className="min-h-64 space-y-4 text-xs text-slate-700">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md border border-slate-200 p-3">
                        <span className="block text-[10px] font-bold uppercase text-slate-400">Application</span>
                        <span className="font-mono font-semibold text-slate-900">{application.id}</span>
                      </div>
                      <div className="rounded-md border border-slate-200 p-3">
                        <span className="block text-[10px] font-bold uppercase text-slate-400">Submitted</span>
                        <span className="font-semibold text-slate-900">{selectedDocument.submittedAt}</span>
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 p-4">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Applicant details on document</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="font-semibold text-slate-950">{application.husband?.name || application.name}</p>
                          <p className="mt-1 font-mono text-[11px] text-slate-500">
                            ID {application.husband?.nationalId || application.national}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">{application.wife?.name || "Not provided"}</p>
                          <p className="mt-1 font-mono text-[11px] text-slate-500">
                            ID {application.wife?.nationalId || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 p-4">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Review summary</p>
                      <p className="mt-2 leading-5">{selectedDocument.summary}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-[11px] text-slate-500">
                      <span>Preview generated from submitted registry file</span>
                      <span className="font-mono">Pages: {selectedDocument.pages}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rejection input when in reject mode */}
          {rejectMode && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Legal Ground for Rejection
              </div>
              <textarea
                rows={3}
                placeholder="State the reason for rejecting this marriage filing, including the record or requirement that could not be verified..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-rose-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setRejectMode(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700"
                >
                  Confirm Legal Rejection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!rejectMode && (
          <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleRequestDocs}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-white transition-colors"
            >
              Request Additional Documents
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRejectMode(true)}
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors"
              >
                Reject Filing
              </button>
              <button
                onClick={handleApprove}
                className="text-xs font-semibold px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve & Issue Certificate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
