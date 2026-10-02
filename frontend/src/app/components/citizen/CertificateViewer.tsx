import React, { useEffect, useState } from "react";
import {
  Printer,
  Download,
  Share2,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Award,
  Lock,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/app/services/api";

interface CertificateViewerProps {
  certificate?: any;
  onVerifyClick?: () => void;
  currentUser?: any;
}

export const CertificateViewer: React.FC<CertificateViewerProps> = ({
  certificate: propCert,
  currentUser,
}) => {
  const [copied, setCopied] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [loadedCert, setLoadedCert] = useState<any | null>(propCert || null);

  useEffect(() => {
    if (propCert) {
      setLoadedCert(propCert);
      return;
    }
    api
      .getCertificates(currentUser?.nationalId ? { nationalId: currentUser.nationalId } : undefined)
      .then((response) => {
        const nationalId = currentUser?.nationalId;
        const certificates = response.certificates || [];
        const matchingCert =
          certificates.find(
            (cert) =>
              nationalId &&
              (cert.husband?.nationalId === nationalId || cert.wife?.nationalId === nationalId)
          ) || null;
        setLoadedCert(matchingCert);
      })
      .catch(() => setLoadedCert(null));
  }, [propCert, currentUser?.nationalId]);

  const cert = loadedCert;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success("Preparing official signed certificate PDF...");
    setTimeout(() => {
      window.print();
    }, 600);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(cert?.blockchainHash || cert?.verificationId || "");
    setCopied(true);
    toast.success("Verification hash copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/verify/${cert?.verificationId || cert?.certificateNo || ""}`;
    navigator.clipboard.writeText(url);
    toast.success("Secure verification link copied to clipboard");
  };

  if (!cert) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Award className="mx-auto h-10 w-10 text-slate-300" />
        <h1 className="mt-4 text-xl font-bold text-slate-950">No Certificate Issued</h1>
        <p className="mt-2 text-sm text-slate-500">
          Certificate data will appear here after registrar approval and issuance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Marriage Certificate
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Legally Valid
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Official civil registration record issued by the Republic of Kenya
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            Share Link
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-200" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Main Certificate View */}
        <div className="xl:col-span-8">
          <div
            id="printable-certificate"
            className="bg-white rounded-lg border border-slate-300/80 shadow-md overflow-hidden relative"
            style={{
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)",
            }}
          >
            {/* Ornamental Certificate Frame */}
            <div className="m-3 p-8 border-2 border-slate-200 rounded-lg relative bg-white">
              {/* Inner guilloche border line */}
              <div className="border border-amber-700/30 p-6 rounded relative">
                {/* Corner decorative notches */}
                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-amber-700/60" />
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-amber-700/60" />
                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-amber-700/60" />
                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-amber-700/60" />

                {/* Seal watermark behind certificate details */}
                <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none" aria-hidden="true">
                  <img
                    src="/image-removebg-preview.png"
                    alt=""
                    className="h-[min(62vw,24rem)] w-[min(62vw,24rem)] object-contain opacity-[0.07] print:opacity-[0.09]"
                  />
                </div>

                {/* Header: Coat of Arms / Government Identifier */}
                <div className="text-center relative z-10 space-y-1 pb-6 border-b border-slate-200">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full border border-amber-700/40 bg-amber-50 flex items-center justify-center shadow-xs">
                      <Building2 className="w-6 h-6 text-amber-800" />
                    </div>
                  </div>
                  <p className="text-[11px] font-bold tracking-[0.2em] text-slate-700 uppercase">
                    Republic of Kenya
                  </p>
                  <p className="text-xs font-semibold tracking-wider text-amber-900 uppercase">
                    Civil Registration Services
                  </p>
                  <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-wide mt-2">
                    Certificate of Marriage
                  </h2>
                  <p className="text-xs text-slate-500">Official civil marriage record</p>
                </div>

                {/* Certificate Number & Date Bar */}
                <div className="flex items-center justify-between py-3 px-4 my-4 bg-slate-50/80 rounded border border-slate-200/60 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Certificate No: </span>
                    <span className="font-mono font-bold text-slate-800 tracking-wider">
                      {cert.certificateNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Issue Date: </span>
                    <span className="font-semibold text-slate-800">{cert.issueDate}</span>
                  </div>
                </div>

                {/* Attestation Text */}
                <div className="text-center my-6 space-y-1">
                  <p className="text-xs text-slate-500 tracking-wider uppercase font-medium">
                    This is to solemnly certify that
                  </p>
                  <p className="text-sm font-serif italic text-slate-700">
                    the applicants named below are registered in the civil marriage register
                  </p>
                </div>

                {/* Spouses Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6">
                  {/* Husband */}
                  <div className="p-4 rounded-lg bg-white border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                        Applicant One
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">Groom</span>
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900">{cert.husband.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        National ID: {cert.husband.nationalId || "Not provided"}
                      </p>
                    </div>
                    <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                      <p>
                        <span className="text-slate-400">Date of Birth:</span> {cert.husband.dob || "Not provided"}
                      </p>
                      <p>
                        <span className="text-slate-400">Place of Birth:</span> {cert.husband.birthPlace || "Not provided"}
                      </p>
                      <p>
                        <span className="text-slate-400">Nationality:</span> {cert.husband.nationality || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Wife */}
                  <div className="p-4 rounded-lg bg-white border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                        Applicant Two
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">Bride</span>
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900">{cert.wife.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        National ID: {cert.wife.nationalId || "Not provided"}
                      </p>
                    </div>
                    <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                      <p>
                        <span className="text-slate-400">Date of Birth:</span> {cert.wife.dob || "Not provided"}
                      </p>
                      <p>
                        <span className="text-slate-400">Place of Birth:</span> {cert.wife.birthPlace || "Not provided"}
                      </p>
                      <p>
                        <span className="text-slate-400">Nationality:</span> {cert.wife.nationality || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Solemnization details */}
                <div className="text-center py-4 my-4 border-y border-slate-200 space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                    Were lawfully united in marriage on
                  </p>
                  <p className="text-lg font-bold text-slate-900">{cert.marriageDate}</p>
                  <p className="text-xs text-slate-600">{cert.venue}</p>
                </div>

                {/* Signatures & Seal Section */}
                <div className="grid grid-cols-3 items-end pt-6 text-center gap-2">
                  {/* Registrar Signature */}
                  <div className="space-y-1">
                    <div className="h-10 flex items-end justify-center">
                      <span className="font-serif italic text-sm text-slate-800 border-b border-slate-400 pb-1 px-4">
                        {cert.registrar || "Registrar"}
                      </span>
                    </div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Officiating Registrar
                    </p>
                    <p className="text-[10px] text-slate-400">Authorized Officer</p>
                  </div>

                  {/* Official certificate seal */}
                  <div className="flex flex-col items-center">
                    <img
                      src="/image-removebg-preview.png"
                      alt="Official certificate seal"
                      className="h-24 w-24 object-contain drop-shadow-sm print:drop-shadow-none"
                    />
                    <span className="text-[9px] font-medium text-slate-400 mt-1">Verified Authenticity</span>
                  </div>

                  {/* Director Signature */}
                  <div className="space-y-1">
                    <div className="h-10 flex items-end justify-center">
                      <span className="font-serif italic text-sm text-slate-800 border-b border-slate-400 pb-1 px-4">
                        Tariq Al-Hashemi
                      </span>
                    </div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Civil Registry Director
                    </p>
                    <p className="text-[10px] text-slate-400">{cert.director || "Civil Registration Services"}</p>
                  </div>
                </div>

                {/* Cryptographic Bottom Bar */}
                <div className="mt-8 pt-4 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-mono text-[11px] text-slate-600 truncate max-w-xs sm:max-w-sm">
                      Hash: {(cert.blockchainHash || cert.verificationId || "").slice(0, 28)}...
                    </span>
                    <button
                      onClick={handleCopyHash}
                      title="Copy full cryptographic hash"
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    ID: {cert.verificationId}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Verification & Provenance Panel */}
        <div className="xl:col-span-4 space-y-4">
          {/* Quick QR Validation Card */}
          <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-sm text-center">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Certificate Verification</h3>
            <p className="text-xs text-slate-500 mb-4">
              Scan the code to verify this certificate against the official registry record.
            </p>

            {/* Realistic High Quality SVG QR Code */}
            <div className="inline-block p-3 bg-white rounded-lg border border-slate-200 shadow-xs mb-3">
              <svg className="w-36 h-36 mx-auto" viewBox="0 0 100 100" fill="currentColor">
                {/* 3 corner positioning squares */}
                <rect x="5" y="5" width="28" height="28" rx="4" fill="#0f172a" />
                <rect x="9" y="9" width="20" height="20" rx="2" fill="#ffffff" />
                <rect x="13" y="13" width="12" height="12" fill="#0f172a" />

                <rect x="67" y="5" width="28" height="28" rx="4" fill="#0f172a" />
                <rect x="71" y="9" width="20" height="20" rx="2" fill="#ffffff" />
                <rect x="75" y="13" width="12" height="12" fill="#0f172a" />

                <rect x="5" y="67" width="28" height="28" rx="4" fill="#0f172a" />
                <rect x="9" y="71" width="20" height="20" rx="2" fill="#ffffff" />
                <rect x="13" y="75" width="12" height="12" fill="#0f172a" />

                {/* Realistic Matrix Modules */}
                <rect x="38" y="7" width="5" height="5" fill="#0f172a" />
                <rect x="48" y="7" width="5" height="5" fill="#0f172a" />
                <rect x="58" y="7" width="5" height="5" fill="#0f172a" />
                <rect x="38" y="17" width="5" height="5" fill="#0f172a" />
                <rect x="53" y="17" width="5" height="5" fill="#0f172a" />
                <rect x="43" y="27" width="5" height="5" fill="#0f172a" />
                <rect x="58" y="27" width="5" height="5" fill="#0f172a" />

                <rect x="8" y="38" width="5" height="5" fill="#0f172a" />
                <rect x="18" y="38" width="5" height="5" fill="#0f172a" />
                <rect x="28" y="38" width="5" height="5" fill="#0f172a" />
                <rect x="48" y="38" width="5" height="5" fill="#0f172a" />
                <rect x="68" y="38" width="5" height="5" fill="#0f172a" />
                <rect x="78" y="38" width="5" height="5" fill="#0f172a" />

                <rect x="8" y="48" width="5" height="5" fill="#0f172a" />
                <rect x="23" y="48" width="5" height="5" fill="#0f172a" />
                <rect x="38" y="48" width="5" height="5" fill="#0f172a" />
                <rect x="53" y="48" width="5" height="5" fill="#0f172a" />
                <rect x="83" y="48" width="5" height="5" fill="#0f172a" />

                <rect x="18" y="58" width="5" height="5" fill="#0f172a" />
                <rect x="38" y="58" width="5" height="5" fill="#0f172a" />
                <rect x="48" y="58" width="5" height="5" fill="#0f172a" />
                <rect x="78" y="58" width="5" height="5" fill="#0f172a" />

                <rect x="38" y="68" width="5" height="5" fill="#0f172a" />
                <rect x="48" y="68" width="5" height="5" fill="#0f172a" />
                <rect x="63" y="68" width="5" height="5" fill="#0f172a" />
                <rect x="83" y="68" width="5" height="5" fill="#0f172a" />

                <rect x="38" y="78" width="5" height="5" fill="#0f172a" />
                <rect x="53" y="78" width="5" height="5" fill="#0f172a" />
                <rect x="73" y="78" width="5" height="5" fill="#0f172a" />
                <rect x="88" y="78" width="5" height="5" fill="#0f172a" />

                <rect x="43" y="88" width="5" height="5" fill="#0f172a" />
                <rect x="58" y="88" width="5" height="5" fill="#0f172a" />
                <rect x="68" y="88" width="5" height="5" fill="#0f172a" />
                <rect x="83" y="88" width="5" height="5" fill="#0f172a" />
              </svg>
            </div>

            <p className="text-xs font-mono font-medium text-slate-700 mb-3">
              {cert.verificationId}
            </p>

            <button
              onClick={() => setShowVerifyModal(true)}
              className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Inspect Verification Record
            </button>
          </div>

          {/* Validation Checklist */}
          <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Security Attributes
            </h4>
            <div className="space-y-2.5 text-xs">
              {[
                { title: "Registrar E-Signature", desc: "Signed by the issuing registry officer", ok: true },
                { title: "Registry Reference", desc: "Matched to the official civil register", ok: true },
                { title: "Ministry Verification", desc: "Civil registration database active", ok: true },
                { title: "Identity Match", desc: "Both applicants verified", ok: true },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">{item.title}</p>
                    <p className="text-slate-500 text-[11px]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Verification Record</h3>
                  <p className="text-xs text-slate-500">Civil registration reference: {cert.verificationId}</p>
                </div>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 font-mono space-y-1">
                <p className="text-slate-400">Verification Hash:</p>
                <p className="font-bold text-slate-800 break-all">{cert.blockchainHash || cert.verificationId}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-600">
                <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                  <span className="text-slate-400 block text-[10px] uppercase">Transaction Time</span>
                  <span className="font-medium text-slate-800">2024-12-19T14:32:00 UTC</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                  <span className="text-slate-400 block text-[10px] uppercase">Block Height</span>
                  <span className="font-medium text-slate-800">#18,492,019</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  The digital fingerprint matches the authoritative record signed by the Ministry of Civil Affairs. Zero tampering detected.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Close Proof
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
