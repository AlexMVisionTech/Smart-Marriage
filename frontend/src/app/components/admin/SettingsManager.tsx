import React, { useState } from "react";
import { Save, Lock, Sliders } from "lucide-react";
import { toast } from "sonner";

export const SettingsManager: React.FC = () => {
  const [documentChecks, setDocumentChecks] = useState(true);
  const [verificationArchive, setVerificationArchive] = useState(true);
  const [minDpi, setMinDpi] = useState(300);
  const [mfaOfficers, setMfaOfficers] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  const handleSave = () => {
    toast.success("Registry policies and security settings updated.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Registry Policies & Security Settings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure document review rules, certificate verification, and officer authentication
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Save className="w-3.5 h-3.5" />
          Save Settings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification Engine Config */}
        <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">Document Review Rules</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Automatic Document Readability Checks</p>
                <p className="text-slate-500 text-[11px]">Check uploaded IDs, certificates, and passports before registrar review</p>
              </div>
              <input
                type="checkbox"
                checked={documentChecks}
                onChange={(e) => setDocumentChecks(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Minimum Document Resolution (DPI)</p>
                <p className="text-slate-500 text-[11px]">Reject uploads under threshold to prevent fraud</p>
              </div>
              <select
                value={minDpi}
                onChange={(e) => setMinDpi(Number(e.target.value))}
                className="px-2.5 py-1 rounded border border-slate-200 bg-slate-50 font-medium"
              >
                <option value={200}>200 DPI</option>
                <option value={300}>300 DPI (Standard)</option>
                <option value={400}>400 DPI (Strict)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Certificate Verification Archive</p>
                <p className="text-slate-500 text-[11px]">Generate verification references for issued certificates</p>
              </div>
              <input
                type="checkbox"
                checked={verificationArchive}
                onChange={(e) => setVerificationArchive(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Security & Access */}
        <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Lock className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">Security & Access Controls</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Enforce 2FA on Registrar Accounts</p>
                <p className="text-slate-500 text-[11px]">Require biometric token or SMS OTP on approval actions</p>
              </div>
              <input
                type="checkbox"
                checked={mfaOfficers}
                onChange={(e) => setMfaOfficers(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">SMS / Email Notification Broadcasts</p>
                <p className="text-slate-500 text-[11px]">Send real-time status updates to citizen mobile numbers</p>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[11px]">
              <span>Encryption: AES-256-GCM</span>
              <span className="text-emerald-700 font-semibold">Active & Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
