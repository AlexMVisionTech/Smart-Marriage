import React, { useEffect, useMemo, useState } from "react";
import { Download, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/app/services/api";

const reportStatuses = ["documents", "pending", "review", "approved", "rejected"];

const formatStatus = (status?: string) => {
  const normalized = (status || "unknown").toLowerCase();
  if (normalized === "documents") return "Submitted";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const cleanPdfText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/[\\()]/g, "\\$&");

const makePdf = (applications: any[], counts: Record<string, number>) => {
  const pageRows = 21;
  const chunks: any[][] = [];
  for (let index = 0; index < applications.length; index += pageRows) {
    chunks.push(applications.slice(index, index + pageRows));
  }
  if (!chunks.length) chunks.push([]);

  const pageContents = chunks.map((rows, pageIndex) => {
    const commands: string[] = [];
    const drawText = (text: unknown, x: number, y: number, size = 9, bold = false) => {
      commands.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${cleanPdfText(text)}) Tj ET`);
    };
    const drawRule = (y: number) => commands.push(`0.75 w 40 ${y} m 802 ${y} l S`);

    if (pageIndex === 0) {
      drawText("SMART MARRIAGE CERTIFICATE SYSTEM", 40, 555, 10, true);
      drawText("REGISTRY APPLICATIONS REPORT", 40, 530, 19, true);
      drawText(`Generated: ${new Date().toLocaleString()}`, 40, 510, 9);
      drawRule(496);
      drawText(`Total applications: ${applications.length}`, 40, 474, 11, true);
      drawText(`Submitted: ${counts.documents || 0}    Pending: ${counts.pending || 0}    Under review: ${counts.review || 0}`, 40, 453, 10);
      drawText(`Approved: ${counts.approved || 0}    Rejected: ${counts.rejected || 0}`, 40, 435, 10);
      drawRule(420);
    } else {
      drawText("REGISTRY APPLICATIONS REPORT (CONTINUED)", 40, 555, 14, true);
      drawText(`Generated: ${new Date().toLocaleString()}`, 40, 535, 9);
    }

    const tableTop = pageIndex === 0 ? 397 : 510;
    drawText("APPLICATION ID", 40, tableTop, 8, true);
    drawText("REFERENCE", 145, tableTop, 8, true);
    drawText("APPLICANTS", 255, tableTop, 8, true);
    drawText("STATUS", 470, tableTop, 8, true);
    drawText("COUNTY", 565, tableTop, 8, true);
    drawText("FILED", 690, tableTop, 8, true);
    drawRule(tableTop - 8);

    rows.forEach((app, rowIndex) => {
      const y = tableTop - 25 - rowIndex * 16;
      drawText((app.id || "-").slice(0, 18), 40, y, 8);
      drawText((app.referenceNo || "-").slice(0, 18), 145, y, 8);
      drawText(`${app.husband?.name || app.name || "Applicant"} / ${app.wife?.name || "Spouse"}`.slice(0, 39), 255, y, 8);
      drawText(formatStatus(app.status).slice(0, 14), 470, y, 8);
      drawText((app.county || "-").slice(0, 20), 565, y, 8);
      drawText((app.date || app.submittedAt || "-").slice(0, 16), 690, y, 8);
    });

    drawText(`Page ${pageIndex + 1} of ${chunks.length}`, 740, 24, 8);
    return commands.join("\n");
  });

  const objects: string[] = [];
  const pageObjectIds = chunks.map((_, index) => 3 + index);
  const contentObjectIds = chunks.map((_, index) => 3 + chunks.length + index);
  const fontRegularId = 3 + chunks.length * 2;
  const fontBoldId = fontRegularId + 1;
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${chunks.length} >>`;

  chunks.forEach((_, index) => {
    objects[pageObjectIds[index]] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentObjectIds[index]} 0 R >>`;
    const stream = pageContents[index];
    objects[contentObjectIds[index]] = `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`;
  });
  objects[fontRegularId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[fontBoldId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = new TextEncoder().encode(pdf).length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
};

export const ReportsCenter: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadApplications = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await api.getApplications();
      setApplications(response.applications || []);
    } catch (error: any) {
      setLoadError(error.message || "Unable to load applications for the report.");
      toast.error(error.message || "Unable to load report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadApplications();
  }, []);

  const statusCounts = useMemo(() => {
    return applications.reduce<Record<string, number>>((counts, app) => {
      const status = (app.status || "unknown").toLowerCase();
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {});
  }, [applications]);

  const downloadReport = () => {
    const blob = makePdf(applications, statusCounts);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `registry-applications-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const cards = [
    { label: "Total applications", value: applications.length },
    { label: "Submitted", value: statusCounts.documents || 0 },
    { label: "Under review", value: statusCounts.review || statusCounts.pending || 0 },
    { label: "Approved", value: statusCounts.approved || 0 },
    { label: "Rejected", value: statusCounts.rejected || 0 },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Registrar workspace</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Reports</h1>
          <p className="mt-1 text-base text-slate-600">Review registry application totals and download a detailed PDF report.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void loadApplications()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={downloadReport} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            <Download className="h-4 w-4" /> Download PDF report
          </button>
        </div>
      </header>

      {loadError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">{loadError}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{loading ? "—" : card.value}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"><FileText className="h-5 w-5" /></span>
          <div>
            <h2 className="font-bold text-slate-900">Applications report</h2>
            <p className="text-sm text-slate-500">Includes all current applications and their latest recorded status.</p>
          </div>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading report data…</p>
        ) : applications.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No applications are currently available for reporting.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3">Application</th><th className="px-5 py-3">Applicants</th><th className="px-5 py-3">County</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Filed</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td className="px-5 py-3"><span className="block font-semibold text-slate-900">{app.id}</span><span className="text-xs text-slate-500">{app.referenceNo || "No reference"}</span></td>
                    <td className="px-5 py-3 text-slate-700">{app.husband?.name || app.name || "Applicant"} &amp; {app.wife?.name || "Spouse"}</td>
                    <td className="px-5 py-3 text-slate-700">{app.county || "—"}</td>
                    <td className="px-5 py-3"><span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">{formatStatus(app.status)}</span></td>
                    <td className="px-5 py-3 text-slate-600">{app.date || app.submittedAt || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
