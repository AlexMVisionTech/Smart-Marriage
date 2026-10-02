import React, { useState } from "react";
import {
  Shield,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Flag,
  Key,
  Mail,
  Phone,
  UserPlus,
  IdCard,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/app/services/api";
import { KenyanShield } from "../common/KenyanShield";

interface LoginPageProps {
  onLogin: (role: "citizen" | "admin", userData?: any) => void;
  portal: "citizen" | "admin";
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, portal }) => {
  const role = portal;
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    nationalId: "",
    phone: "",
    nationality: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const callLoginAPI = async (credentials: { email: string; password: string; role: "citizen" | "admin"; ssoProvider?: string }) => {
    setIsLoading(true);
    try {
      const response = await api.login(credentials);
      if (response.success && response.token) {
        if (response.user?.role !== role) {
          toast.error("This account is not authorised for the selected portal.");
          return;
        }
        localStorage.setItem("auth_token", response.token);
        localStorage.setItem("user_data", JSON.stringify(response.user));
        onLogin(role, response.user);
      } else {
        toast.error(response.message || "Login failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    callLoginAPI({ email, password, role });
  };

  const handleCitizenSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupData.password !== signupData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.registerCitizen({
        name: signupData.name,
        email: signupData.email,
        nationalId: signupData.nationalId,
        phone: signupData.phone,
        nationality: signupData.nationality,
        password: signupData.password,
      });

      setEmail("");
      setPassword("");
      setAuthMode("signin");
      toast.success("Your account has been created. Sign in to continue.");
    } catch (error: any) {
      toast.error(error.message || "Citizen signup failed. Please check your details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen w-full overflow-hidden font-sans text-slate-950 ${role === "citizen" ? "bg-[#e8eee9]" : "bg-[#edf2ed]"}`}>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {role === "citizen" ? (
          <>
            <div className="absolute inset-0 bg-[url('/image.png')] bg-cover bg-[center_58%] opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#f5f7f3]/55 via-[#f5f7f3]/25 to-[#f5f7f3]/45" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_16%,rgba(0,107,63,0.14),transparent_34%),radial-gradient(ellipse_at_88%_82%,rgba(177,18,38,0.09),transparent_30%),linear-gradient(135deg,rgba(230,238,231,0.16)_0%,rgba(246,247,242,0.08)_48%,rgba(228,235,231,0.16)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_43%_18%,rgba(177,18,38,0.13),transparent_30%),radial-gradient(ellipse_at_12%_72%,rgba(8,10,9,0.15),transparent_30%),radial-gradient(ellipse_at_88%_82%,rgba(0,107,63,0.11),transparent_32%),linear-gradient(115deg,rgba(8,10,9,0.035),transparent_42%)]" />
            <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(#456856 0.7px, transparent 0.7px)", backgroundSize: "24px 24px" }} />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_18%,rgba(0,107,63,0.16),transparent_38%),radial-gradient(ellipse_at_85%_78%,rgba(177,18,38,0.08),transparent_34%),linear-gradient(135deg,#edf2ed_0%,#f7f8f5_52%,#e8eee9_100%)]" />
            <div className="absolute inset-0 opacity-[0.22]" style={{ backgroundImage: "radial-gradient(#557263 0.7px, transparent 0.7px)", backgroundSize: "22px 22px" }} />
          </>
        )}
      </div>
      <div className="fixed top-0 left-0 right-0 h-1 z-50 grid grid-cols-4 pointer-events-none" aria-hidden="true">
        <div className="bg-slate-950" />
        <div className="bg-[#b11226]" />
        <div className="bg-white" />
        <div className="bg-[#006b3f]" />
      </div>

      <main className={`relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:px-8 ${role === "citizen" ? "lg:flex-row lg:items-center lg:justify-center lg:gap-16 xl:gap-20 lg:px-12" : ""}`}>
          {role === "citizen" && (
            <div className="pointer-events-none hidden max-w-md lg:block xl:max-w-lg">
              <div className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-950">
                <span className="h-px w-10 bg-emerald-700/60" />
                <span>Marriage Registry</span>
              </div>
              <h2 className="text-5xl font-semibold leading-[1.14] tracking-[-0.035em] text-slate-950 xl:text-6xl">
                Your story,
                <span className="block text-emerald-800">officially celebrated.</span>
              </h2>
              <p className="mt-5 max-w-md text-lg font-medium leading-7 text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                A simpler way to begin your next chapter. Apply, follow each step, and keep your important records close.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                <span className="inline-flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-800" />
                  Secure digital registration
                </span>
                <span className="inline-flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-[#b11226]" />
                  Clear application updates
                </span>
              </div>
            </div>
          )}
          <div className={`w-full max-w-[440px] ${role === "citizen" ? "mt-8 rounded-2xl border border-white/80 bg-white/90 p-6 shadow-[0_32px_90px_rgba(24,55,38,0.16)] backdrop-blur-xl sm:p-8 lg:mt-0 lg:shrink-0" : ""}`}>
            <div className="mb-8">
              <div className="mb-5 flex h-1.5 w-44 overflow-hidden rounded-sm border border-slate-200">
                <div className="flex-1 bg-slate-950" />
                <div className="flex-1 bg-[#b11226]" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-[#006b3f]" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black text-white">
                  <KenyanShield className="h-10 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Marriage Registry</h2>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Civil Records &amp; Services</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] ring-1 ring-white sm:p-8">
              <div className="mb-7">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-900">
                  <span className="h-px w-7 bg-emerald-600" aria-hidden="true" />
                  <span>{role === "citizen" ? "Citizen portal" : "Registrar portal"}</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  {role === "citizen" ? "Citizen sign in" : "Registrar sign in"}
                </h1>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {role === "citizen" ? "Sign in or create an account to manage your marriage registration." : "Sign in with your official registrar credentials."}
                </p>
              </div>

            {role === "citizen" && (
              <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition-all ${
                    authMode === "signin"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
                  }`}
                >
                  <Lock className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition-all ${
                    authMode === "signup"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}

            {role === "admin" && (
              <div className="mt-6 border-y border-slate-200 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
                    <Key className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-800">
                      Official registrar access
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-slate-600">
                      Sign in using your ministry-issued credentials. Multi-factor verification is required for authorised registry officers.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(role === "admin" || authMode === "signin") && (
              <form onSubmit={handleSignIn} autoComplete="off" className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {role === "citizen" ? "Email Address or Huduma Namba" : "Official Ministry Email / Registrar ID"}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="registry-login-id"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 pr-10 text-sm font-medium text-slate-950 transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      placeholder={role === "citizen" ? "Enter email or national ID" : "Enter official email or registrar ID"}
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                    <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Shield className="h-4 w-4 text-emerald-700" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                      <Lock className="h-3.5 w-3.5 text-slate-400" />
                      Security Password
                    </label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-900"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 pr-11 text-sm font-medium text-slate-950 transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-slate-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2.5 rounded-lg bg-[#006b3f] text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition-colors hover:bg-[#005632] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Verifying Identity...
                    </span>
                  ) : (
                    <>
                      <span>
                        {role === "citizen" ? "Access Citizen Portal" : "Sign in to Admin Portal"}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {role === "citizen" && authMode === "signup" && (
              <form onSubmit={handleCitizenSignup} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={signupData.name}
                      onChange={(e) => setSignupData((prev) => ({ ...prev, name: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-950 transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      placeholder="Enter your full name"
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={signupData.email}
                      onChange={(e) => setSignupData((prev) => ({ ...prev, email: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-950 transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      placeholder="Enter your email address"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                      <IdCard className="h-3.5 w-3.5 text-slate-400" />
                      National ID
                    </label>
                    <input
                      type="text"
                      required
                      value={signupData.nationalId}
                      onChange={(e) => setSignupData((prev) => ({ ...prev, nationalId: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-950 transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      placeholder="ID number"
                      autoComplete="off"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={signupData.phone}
                      onChange={(e) => setSignupData((prev) => ({ ...prev, phone: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-950 transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      placeholder="Phone number"
                      autoComplete="tel"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                      <Flag className="h-3.5 w-3.5 text-slate-400" />
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={signupData.nationality}
                      onChange={(e) => setSignupData((prev) => ({ ...prev, nationality: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-950 transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      placeholder="Enter nationality"
                      autoComplete="country-name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                      <Lock className="h-3.5 w-3.5 text-slate-400" />
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={signupData.password}
                      onChange={(e) => setSignupData((prev) => ({ ...prev, password: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-950 transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Shield className="h-3.5 w-3.5 text-slate-400" />
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-950 transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2.5 rounded-lg bg-[#006b3f] text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition-colors hover:bg-[#005632] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating Account...
                    </span>
                  ) : (
                    <>
                      <span>Create Citizen Account</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 border-t border-slate-100 pt-5 text-center">
              <div className="text-xs font-semibold tracking-wide text-slate-500">
                <span>Marriage Registry</span>
                <span className="mx-2 text-emerald-700" aria-hidden="true">/</span>
                <span className="font-normal">Records that bring families together</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                One registry. Every milestone.
              </p>
            </div>
          </div>
        </div>
        </main>
    </div>
  );
};
