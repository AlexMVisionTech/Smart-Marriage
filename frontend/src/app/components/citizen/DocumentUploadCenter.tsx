import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Check,
  ClipboardList,
  FileCheck2,
  FileText,
  Info,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Trash2,
  UploadCloud,
  UserRound,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/app/services/api";

interface DocumentUploadCenterProps {
  applicationId?: string;
  onAllUploaded?: () => void;
  onNavigate?: (page: string) => void;
  currentUser?: any;
}

interface DocItem {
  id: string;
  personKey: "applicantOne" | "applicantTwo";
  label: string;
  hint: string;
  formats: string;
  maxSize: string;
  required: boolean;
  uploaded: boolean;
  status: "verified" | "processing" | "missing" | "flagged";
  fileName?: string;
  qualityScore?: string;
  dpi?: number;
}

const documentTypes = [
  { id: "national_id", label: "National ID", formats: "PDF", maxSize: "5 MB", required: true },
  { id: "passport", label: "Passport copy", formats: "PDF", maxSize: "5 MB", required: true },
  { id: "birth_cert", label: "Birth certificate", formats: "PDF", maxSize: "10 MB", required: true },
  { id: "medical_screening", label: "Medical clearance", formats: "PDF", maxSize: "5 MB", required: true },
  { id: "photos", label: "Passport photograph", formats: "PDF", maxSize: "5 MB", required: true },
  { id: "consent", label: "Additional supporting record", formats: "PDF", maxSize: "10 MB", required: false },
];

const emptyApplication = {
  applicantOneName: "",
  applicantOneId: "",
  applicantOneDob: "",
  applicantOneBirthPlace: "",
  applicantOneNationality: "",
  applicantOnePhone: "",
  applicantOneEmail: "",
  applicantTwoName: "",
  applicantTwoId: "",
  applicantTwoDob: "",
  applicantTwoBirthPlace: "",
  applicantTwoNationality: "",
  applicantTwoPhone: "",
  applicantTwoEmail: "",
  marriageDate: "",
  county: "",
  registrationOffice: "",
  ceremonyType: "Civil marriage",
  residenceAddress: "",
};

const requiredFields: Array<keyof typeof emptyApplication> = [
  "applicantOneName",
  "applicantOneId",
  "applicantOneDob",
  "applicantOneBirthPlace",
  "applicantOneNationality",
  "applicantOnePhone",
  "applicantOneEmail",
  "applicantTwoName",
  "applicantTwoId",
  "applicantTwoDob",
  "applicantTwoBirthPlace",
  "applicantTwoNationality",
  "applicantTwoPhone",
  "applicantTwoEmail",
  "marriageDate",
  "county",
  "registrationOffice",
  "residenceAddress",
];

export const DocumentUploadCenter: React.FC<DocumentUploadCenterProps> = ({
  applicationId,
  currentUser,
  onNavigate,
}) => {
  const initialApplication = {
    ...emptyApplication,
    applicantOneName: currentUser?.name || "",
    applicantOneId: currentUser?.nationalId || "",
    applicantOneNationality: currentUser?.nationality || "",
    applicantOnePhone: currentUser?.phone || "",
    applicantOneEmail: currentUser?.email || "",
  };
  const draftStorageKey = `marriage-application-draft:${currentUser?.id || currentUser?.nationalId || currentUser?.email || "guest"}`;
  const savedDraft = (() => {
    try {
      const raw = localStorage.getItem(draftStorageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const [stage, setStage] = useState<"application" | "documents">("application");
  const [application, setApplication] = useState({ ...initialApplication, ...(savedDraft?.application || {}) });
  const [activeApplicationId, setActiveApplicationId] = useState(applicationId || savedDraft?.activeApplicationId || "");
  const [applicationSubmitted, setApplicationSubmitted] = useState(Boolean(savedDraft?.applicationSubmitted || applicationId));
  const [savingApplication, setSavingApplication] = useState(false);
  const [submittedForReview, setSubmittedForReview] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [paymentAmount, setPaymentAmount] = useState(1000);
  const [paymentDemoMode, setPaymentDemoMode] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState(currentUser?.phone || "");
  const [startingPayment, setStartingPayment] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocItem[]>(() =>
    (["applicantOne", "applicantTwo"] as const).flatMap((personKey) =>
      documentTypes.map((document) => ({
        ...document,
        id: `${document.id}_${personKey}`,
        personKey,
        hint: "",
        uploaded: false,
        status: "missing" as const,
      }))
    )
  );

  const requiredCount = docs.filter((d) => d.required).length;
  const uploadedRequired = docs.filter((d) => d.required && d.uploaded).length;
  const progressPercent = Math.round((uploadedRequired / requiredCount) * 100);
  const completedFields = useMemo(
    () => requiredFields.filter((field) => String(application[field]).trim()).length,
    [application]
  );
  const formProgress = Math.round((completedFields / requiredFields.length) * 100);

  React.useEffect(() => {
    localStorage.setItem(draftStorageKey, JSON.stringify({
      application,
      activeApplicationId,
      applicationSubmitted,
    }));
  }, [draftStorageKey, application, activeApplicationId, applicationSubmitted]);

  React.useEffect(() => {
    api.getPaymentConfig().then((config) => {
      setPaymentAmount(config.amount);
      setPaymentDemoMode(Boolean(config.demoMode));
    }).catch(() => undefined);
  }, []);

  React.useEffect(() => {
    if (!activeApplicationId) return;
    let cancelled = false;
    const refresh = () => api.getPaymentStatus(activeApplicationId).then((result) => {
      if (!cancelled) setPaymentStatus(result.status);
    }).catch(() => undefined);
    refresh();
    const timer = window.setInterval(refresh, 4000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [activeApplicationId]);

  const applyDocumentState = (documents: Record<string, any>) => {
    setDocs((prev) =>
      prev.map((doc) => {
        const remoteDoc = documents?.[doc.id];
        if (!remoteDoc) return doc;
        return {
          ...doc,
          uploaded: Boolean(remoteDoc.uploaded),
          status: remoteDoc.status || (remoteDoc.uploaded ? "verified" : "missing"),
          fileName: remoteDoc.name || undefined,
          qualityScore: remoteDoc.qualityScore || remoteDoc.ocrScore || undefined,
          dpi: remoteDoc.dpi || undefined,
        };
      })
    );
  };

  const updateField = (field: keyof typeof emptyApplication, value: string) => {
    setApplication((prev) => ({ ...prev, [field]: value }));
  };

  const handleContinueToUploads = async () => {
    const missing = requiredFields.filter((field) => !String(application[field]).trim());
    if (missing.length > 0) {
      toast.error("Please complete all required application details before uploading documents.");
      return;
    }

    setSavingApplication(true);
    try {
      const existingResponse = await api.getApplications({ nationalId: application.applicantOneId });
      const existingApplication = existingResponse.applications?.find((item) =>
        item.husband?.nationalId === application.applicantOneId ||
        item.wife?.nationalId === application.applicantOneId
      );
      if (existingApplication) {
        setActiveApplicationId(existingApplication.id);
        applyDocumentState(existingApplication.documents || {});
        setApplicationSubmitted(true);
        setStage("documents");
        toast.info("You already have an application. We opened it so you can continue where you left off.");
        return;
      }

      const response = await api.createApplication({
        husband: {
          name: application.applicantOneName,
          nationalId: application.applicantOneId,
          dob: application.applicantOneDob,
          birthPlace: application.applicantOneBirthPlace,
          nationality: application.applicantOneNationality,
          phone: application.applicantOnePhone,
          email: application.applicantOneEmail,
        },
        wife: {
          name: application.applicantTwoName,
          nationalId: application.applicantTwoId,
          dob: application.applicantTwoDob,
          birthPlace: application.applicantTwoBirthPlace,
          nationality: application.applicantTwoNationality,
          phone: application.applicantTwoPhone,
          email: application.applicantTwoEmail,
        },
        marriageDate: application.marriageDate,
        ceremonyType: application.ceremonyType,
        county: application.county,
        registrationOffice: application.registrationOffice,
        venue: application.registrationOffice,
        residenceAddress: application.residenceAddress,
      });
      const created = response.application;
      setActiveApplicationId(created.id);
      setPaymentStatus(created.paymentStatus || "unpaid");
      applyDocumentState(created.documents || {});
      setApplicationSubmitted(true);
      setStage("documents");
      toast.success("Your application has been submitted. Track your progress in the Application Tracker.");
    } catch (error: any) {
      toast.error(error.message || "Unable to save application details.");
    } finally {
      setSavingApplication(false);
    }
  };

  const handlePay = async () => {
    if (!activeApplicationId) return toast.error("Save your application details before paying.");
    const normalizedPhone = paymentPhone.trim().replace(/^0/, "254").replace(/^\+/, "");
    if (!/^254\d{9}$/.test(normalizedPhone)) return toast.error("Enter a valid Kenyan phone number, for example 0712345678.");
    setStartingPayment(true);
    try {
      const result = await api.initiateMpesaPayment(activeApplicationId, normalizedPhone);
      setPaymentStatus("pending");
      toast.success(result.demoMode ? "Demo payment started. Simulated confirmation will arrive in 30 seconds." : result.customerMessage || result.message || "M-Pesa prompt sent. Enter your PIN to continue.");
    } catch (error: any) {
      toast.error(error.message || "Unable to start M-Pesa payment.");
    } finally {
      setStartingPayment(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (uploadedRequired < requiredCount) return toast.error("Please upload all required documents before submitting.");
    if (paymentStatus !== "paid") return toast.error("Complete the M-Pesa payment before submitting for review.");
    try {
      const payment = await api.getPaymentStatus(activeApplicationId);
      if (payment.status !== "paid" || !payment.receipt) {
        setPaymentStatus(payment.status);
        return toast.error("We have not received payment confirmation yet. Please wait and try again.");
      }
      await api.submitApplication(activeApplicationId, payment.receipt);
      setSubmittedForReview(true);
      toast.success("Payment confirmed. Your application is queued for registrar review.");
    } catch (error: any) {
      toast.error(error.message || "Unable to submit application.");
    }
  };

  const handleUpload = async (id: string, file?: File) => {
    if (!file) return;
    if (!applicationSubmitted) {
      toast.error("Complete the online application form before uploading documents.");
      setStage("application");
      return;
    }
    if (!activeApplicationId) {
      toast.error("Application reference is missing. Save the form before uploading documents.");
      setStage("application");
      return;
    }

    const doc = docs.find((item) => item.id === id);
    const allowedExtensions = doc?.formats.split(",").map((format) => `.${format.trim().toLowerCase().replace(/^\./, "")}`) || [];
    const extension = `.${file.name.split(".").pop()?.trim().toLowerCase() || ""}`;
    if (!allowedExtensions.includes(extension)) {
      toast.error("Choose a PDF file to upload.");
      return;
    }
    const maxBytes = (doc?.maxSize.includes("10") ? 10 : doc?.maxSize.includes("2") ? 2 : 5) * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`This file is too large. Maximum size: ${doc?.maxSize}.`);
      return;
    }

    setUploadingId(id);
    try {
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read the selected file."));
        reader.onerror = () => reject(new Error("Could not read the selected file."));
        reader.readAsDataURL(file);
      });
      const response = await api.uploadDocument(activeApplicationId, id, file.name, "application/pdf", fileData);
      applyDocumentState(response.documents || {});
      setUploadingId(null);
      toast.success("Document uploaded and saved to your application.");
    } catch (error: any) {
      toast.error(error.message || "Unable to upload document.");
      setUploadingId(null);
    }
  };

  const handleRemove = async (id: string) => {
    if (!activeApplicationId) return;
    try {
      const response = await api.removeDocument(activeApplicationId, id);
      applyDocumentState(response.documents || {});
      toast.info("Document removed");
    } catch (error: any) {
      toast.error(error.message || "Unable to remove document.");
    }
  };

  const renderDocumentControl = (doc: DocItem) => {
    const isBusy = uploadingId === doc.id;
    if (doc.uploaded) {
      return (
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-xs text-slate-700" title={doc.fileName}>
            <span className="block truncate">{doc.fileName}</span>
            <span className={`font-medium ${doc.status === "verified" ? "text-[#006b3f]" : "text-slate-500"}`}>
              {doc.status === "processing" ? "Processing" : doc.status}
            </span>
          </span>
            <a
              href={api.getDocumentFileUrl(activeApplicationId, doc.id)}
              download={doc.fileName || doc.label}
              className="shrink-0 text-xs font-semibold text-slate-800 underline decoration-slate-300 underline-offset-2 hover:text-[#006b3f]"
          >Download</a>
          <button onClick={() => handleRemove(doc.id)} className="shrink-0 text-xs font-semibold text-[#b11226]" title="Remove document">Remove</button>
        </div>
      );
    }

    return (
      <label className={`inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[#006b3f] hover:text-[#005632] ${isBusy ? "pointer-events-none opacity-60" : ""}`}>
        <input
          type="file"
          className="sr-only"
          accept=".pdf,application/pdf"
          disabled={isBusy}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            void handleUpload(doc.id, file);
            event.currentTarget.value = "";
          }}
        />
        {isBusy ? "Uploading…" : "Choose file"}
      </label>
    );
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Marriage certificate application</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Apply Online</h1>
            <p className="mt-1 max-w-3xl text-[13px] leading-5 text-slate-600">
              Complete the application form first. Once the registry details are saved, upload the required supporting documents for registrar review.
            </p>
          </div>

          <div className="border-l-2 border-[#006b3f] pl-3 sm:min-w-52">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Application reference</p>
            <p className="mt-0.5 truncate font-mono text-xs font-semibold text-slate-900">
              {activeApplicationId || "Created after saving"}
            </p>
          </div>
        </div>

        <div className="grid border-t border-slate-200 bg-slate-50/80 md:grid-cols-3">
          {[
            { label: "Application form", value: `${formProgress}%`, active: stage === "application" },
            { label: "Documents uploaded", value: `${uploadedRequired}/${requiredCount}`, active: stage === "documents" },
            { label: "Review status", value: applicationSubmitted ? "Ready for uploads" : "Draft", active: false },
          ].map((item, index) => (
            <div
              key={item.label}
              className={`px-4 py-2.5 ${index > 0 ? "border-t border-slate-200 md:border-l md:border-t-0" : ""}`}
            >
              <p className="text-[11px] font-semibold uppercase text-slate-500">{item.label}</p>
              <p className={`mt-1 text-sm font-bold ${item.active ? "text-[#006b3f]" : "text-slate-950"}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="border-b border-slate-200 bg-white px-2">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setStage("application")}
            className={`flex items-center justify-center gap-2 border-b-2 px-3 py-2.5 text-[13px] font-semibold ${
              stage === "application" ? "border-[#006b3f] text-[#006b3f]" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Application Details
          </button>
          <button
            onClick={() => {
              if (!applicationSubmitted) {
                toast.error("Save the application details before opening document uploads.");
                return;
              }
              setStage("documents");
            }}
            className={`flex items-center justify-center gap-2 border-b-2 px-3 py-2.5 text-[13px] font-semibold ${
              stage === "documents" ? "border-[#006b3f] text-[#006b3f]" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            Document Uploads
          </button>
        </div>
      </div>

      {stage === "application" ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-8">
            <div className="mb-5 border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-950">Applicant Information</h2>
              <p className="text-sm text-slate-500">Enter the details exactly as they appear in official identity records.</p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <ApplicantSection
                title="Applicant One"
                icon={<UserRound className="h-4 w-4" />}
                fields={[
                  ["Full name", "applicantOneName", "text"],
                  ["National ID number", "applicantOneId", "text"],
                  ["Date of birth", "applicantOneDob", "date"],
                  ["Place of birth", "applicantOneBirthPlace", "text"],
                  ["Nationality", "applicantOneNationality", "text"],
                  ["Mobile number", "applicantOnePhone", "tel"],
                  ["Email address", "applicantOneEmail", "email"],
                ]}
                values={application}
                onChange={updateField}
              />

              <ApplicantSection
                title="Applicant Two"
                icon={<UsersRound className="h-4 w-4" />}
                fields={[
                  ["Full name", "applicantTwoName", "text"],
                  ["National ID number", "applicantTwoId", "text"],
                  ["Date of birth", "applicantTwoDob", "date"],
                  ["Place of birth", "applicantTwoBirthPlace", "text"],
                  ["Nationality", "applicantTwoNationality", "text"],
                  ["Mobile number", "applicantTwoPhone", "tel"],
                  ["Email address", "applicantTwoEmail", "email"],
                ]}
                values={application}
                onChange={updateField}
              />
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#006b3f]" />
                <h3 className="text-sm font-bold text-slate-950">Marriage and Registration Details</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Preferred marriage date" required type="date" value={application.marriageDate} onChange={(v) => updateField("marriageDate", v)} />
                <Field label="County" required value={application.county} onChange={(v) => updateField("county", v)} />
                <Field label="Registration office" required value={application.registrationOffice} onChange={(v) => updateField("registrationOffice", v)} />
                <Field label="Ceremony type" value={application.ceremonyType} onChange={(v) => updateField("ceremonyType", v)} />
                <div className="md:col-span-2">
                  <Field label="Residential address" required value={application.residenceAddress} onChange={(v) => updateField("residenceAddress", v)} />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-800">{completedFields}</span> of {requiredFields.length} required fields completed
              </div>
              <button
                onClick={handleContinueToUploads}
                disabled={savingApplication}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#006b3f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#005632] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingApplication ? "Saving application..." : "Save and continue to uploads"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          <aside className="space-y-5 xl:col-span-4">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-[#006b3f]" />
                <h3 className="text-base font-bold text-slate-950">Application Summary</h3>
              </div>
              <div className="space-y-3 text-xs">
                <SummaryRow label="Applicant one" value={application.applicantOneName} />
                <SummaryRow label="Applicant two" value={application.applicantTwoName} />
                <SummaryRow label="Marriage date" value={application.marriageDate} />
                <SummaryRow label="Office" value={application.registrationOffice} />
                <SummaryRow label="County" value={application.county} />
              </div>
            </section>

            <section className="rounded-lg border border-emerald-200/70 bg-gradient-to-br from-emerald-600/90 via-green-700/85 to-emerald-900/90 p-5 text-white shadow-lg shadow-emerald-900/10 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-4 w-4 text-emerald-100" />
                <div>
                  <h3 className="text-sm font-bold">What happens next</h3>
                  <p className="mt-2 text-xs leading-6 text-white/90">
                    After the form is saved, upload the required records. The registrar will review the application, request corrections if needed, and issue the certificate after approval.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-l-2 border-[#b11226] py-1 pl-3">
            <p className="text-sm leading-6 text-slate-700">Upload each required record for both people. Files are kept separate by applicant.</p>
            <p className="text-sm font-semibold text-slate-800">{uploadedRequired} of {requiredCount} required files uploaded</p>
          </div>

          <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <div className="px-3 py-2.5">Required record</div>
                <div className="border-l border-slate-200 px-3 py-2.5">{application.applicantOneName || "Applicant"}</div>
                <div className="border-l border-slate-200 px-3 py-2.5">{application.applicantTwoName || "Spouse"}</div>
              </div>
              {documentTypes.map((definition) => (
                <div key={definition.id} className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-slate-100 last:border-b-0">
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-semibold text-slate-900">{definition.label}</p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {definition.formats} · Max {definition.maxSize}
                      {!definition.required && <span className="ml-1 text-slate-400">Optional</span>}
                    </p>
                  </div>
                  {(["applicantOne", "applicantTwo"] as const).map((personKey) => {
                    const doc = docs.find((item) => item.id === `${definition.id}_${personKey}`)!;
                    return <div key={doc.id} className="flex min-w-0 items-center border-l border-slate-100 px-3 py-2.5">{renderDocumentControl(doc)}</div>;
                  })}
                </div>
              ))}
            </div>
          </div>

          <section className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Application fee · KES {paymentAmount.toLocaleString()}</p>
                <p className="mt-1 text-sm text-slate-600">{paymentDemoMode ? "Demo mode: no M-Pesa prompt is sent; payment is simulated after 30 seconds." : "Pay securely with M-Pesa. A payment prompt will appear on your phone."}</p>
                <p className="mt-2 text-xs font-semibold capitalize text-emerald-800">Payment status: {paymentStatus}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input aria-label="M-Pesa phone number" type="tel" value={paymentPhone} onChange={(event) => setPaymentPhone(event.target.value)} placeholder="07XX XXX XXX" className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700" />
                <button onClick={handlePay} disabled={startingPayment || paymentStatus === "paid"} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
                  {startingPayment ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  {paymentStatus === "paid" ? "Paid" : startingPayment ? "Sending prompt..." : "Pay with M-Pesa"}
                </button>
              </div>
            </div>
            {paymentStatus === "pending" && <p className="mt-3 text-xs text-amber-800">Approve the M-Pesa prompt on your phone. This page checks for confirmation automatically.</p>}
          </section>

          <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-200 py-3 sm:flex-row sm:items-center">
            <div>
                <p className="text-base font-bold text-slate-900">
                  {uploadedRequired === requiredCount
                    ? "All required documents uploaded"
                    : `${requiredCount - uploadedRequired} required document pending`}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  Required formats and file size limits are shown for each document.
                </p>
            </div>

            {submittedForReview ? (
              <div className="flex flex-col items-stretch gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 animate-[scale-in_350ms_ease-out] items-center justify-center rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-900/15">
                    <Check className="h-6 w-6 animate-[check-in_450ms_ease-out]" strokeWidth={3} />
                  </span>
                  <div>
                    <p className="font-semibold text-emerald-900">Submitted for registrar review</p>
                    <p className="text-sm text-emerald-800">Your application is now in the review queue.</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate?.("track")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
                >
                  Track application
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSubmitForReview}
                disabled={paymentStatus !== "paid"}
                className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold shadow-sm transition-colors ${
                  uploadedRequired === requiredCount && paymentStatus === "paid"
                    ? "bg-[#006b3f] text-white hover:bg-[#005632]"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {paymentStatus === "paid" ? "Submit for Registrar Review" : "Pay before submitting"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  icon?: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, value, onChange, required = false, type = "text", icon }) => {
  const isComplete = value.trim().length > 0;
  const requiredTone = required
    ? isComplete
      ? "text-emerald-700"
      : "text-rose-700"
    : "text-slate-700";
  const inputTone = required
    ? isComplete
      ? "border-emerald-300 bg-emerald-50/60 focus:ring-emerald-700"
      : "border-rose-200 bg-rose-50/40 focus:ring-rose-500"
    : "border-slate-200 bg-slate-50 focus:ring-emerald-700";

  return (
  <label className="block">
    <span className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${requiredTone}`}>
      {icon}
      {label}
      {required && <span className={isComplete ? "text-emerald-600" : "text-rose-600"} aria-hidden="true">*</span>}
    </span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      aria-required={required}
      className={`h-11 w-full rounded-lg border px-3.5 text-sm font-medium text-slate-950 transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 ${inputTone}`}
    />
  </label>
  );
};

interface ApplicantSectionProps {
  title: string;
  icon: React.ReactNode;
  fields: Array<[string, keyof typeof emptyApplication, string]>;
  values: typeof emptyApplication;
  onChange: (field: keyof typeof emptyApplication, value: string) => void;
}

const ApplicantSection: React.FC<ApplicantSectionProps> = ({ title, icon, fields, values, onChange }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
    <div className="mb-4 flex items-center gap-2 border-b border-slate-200/70 pb-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-[#006b3f] ring-1 ring-slate-200">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-slate-950">{title}</h3>
    </div>
    <div className="space-y-4">
      {fields.map(([label, field, type]) => {
        const icon =
          field.toLowerCase().includes("phone") ? (
            <Phone className="h-3.5 w-3.5 text-slate-400" />
          ) : field.toLowerCase().includes("email") ? (
            <Mail className="h-3.5 w-3.5 text-slate-400" />
          ) : field.toLowerCase().includes("dob") ? (
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <BadgeCheck className="h-3.5 w-3.5 text-slate-400" />
          );

        return (
          <Field
            key={field}
            label={label}
            type={type}
            required={requiredFields.includes(field)}
            value={values[field]}
            onChange={(value) => onChange(field, value)}
            icon={icon}
          />
        );
      })}
    </div>
  </div>
);

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
    <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
      <p className="truncate text-xs font-semibold text-slate-800">{value || "Not provided"}</p>
    </div>
  </div>
);
