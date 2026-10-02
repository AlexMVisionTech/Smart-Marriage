import React from "react";
import {
  BadgeCheck,
  Fingerprint,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export const CitizenProfile: React.FC<{ user?: any }> = ({ user }) => {
  const displayName = user?.name || "Citizen";
  const avatar =
    user?.avatar ||
    displayName
      .split(" ")
      .filter(Boolean)
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const credentials = [
    { label: "Full legal name", value: displayName, icon: UserRound },
    { label: "National identity number", value: user?.nationalId, icon: Fingerprint, mono: true },
    { label: "Nationality", value: user?.nationality, icon: MapPin },
  ];
  const contact = [
    { label: "Email address", value: user?.email, icon: Mail },
    { label: "Mobile phone", value: user?.phone, icon: Phone, mono: true },
    { label: "County of residence", value: user?.county, icon: MapPin },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-1 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Citizen portal</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">My profile</h1>
          <p className="mt-1 text-base text-slate-600">Review your identity and contact details held by the registry.</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 sm:self-auto">
          <ShieldCheck className="h-4 w-4" />
          Secure registry record
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-slate-950 via-rose-700 to-emerald-700" />
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-2xl font-bold tracking-wide text-white shadow-lg shadow-slate-900/15 ring-4 ring-slate-100">
            {avatar}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">{displayName}</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                <BadgeCheck className="h-4 w-4" />
                Identity verified
              </span>
            </div>
            <p className="mt-2 text-base text-slate-600">Citizen ID <span className="font-mono font-semibold text-slate-800">{user?.nationalId || "Not provided"}</span></p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:min-w-44">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account type</p>
            <p className="mt-1 text-base font-semibold text-slate-900">Citizen account</p>
          </div>
        </div>

        <div className="grid gap-5 border-t border-slate-100 bg-slate-50/60 p-5 sm:grid-cols-2 sm:p-7">
          <ProfileGroup title="Personal credentials" items={credentials} />
          <ProfileGroup title="Contact and residency" items={contact} />
        </div>

        <div className="flex items-start gap-3 border-t border-emerald-100 bg-emerald-50/70 px-6 py-4 sm:px-8">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <p className="text-sm font-semibold text-emerald-950">Protected identity information</p>
            <p className="mt-0.5 text-sm leading-6 text-emerald-900/80">Your profile details are used to support secure marriage registration and registry services.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

interface ProfileItem {
  label: string;
  value?: string;
  icon: React.ComponentType<{ className?: string }>;
  mono?: boolean;
}

const ProfileGroup: React.FC<{ title: string; items: ProfileItem[] }> = ({ title, items }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-slate-500">{title}</h3>
    <div className="space-y-2.5">
      {items.map(({ label, value, icon: Icon, mono }) => (
        <div key={label} className="flex min-w-0 items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 px-3.5 py-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-800 ring-1 ring-slate-200">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className={`mt-0.5 break-words text-base font-semibold text-slate-900 ${mono ? "font-mono" : ""}`}>{value || "Not provided"}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);
