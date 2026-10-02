import React, { useState } from "react";
import { Toaster, toast } from "sonner";
import { AppHeader } from "./components/common/AppHeader";
import { AppSidebar } from "./components/common/AppSidebar";
import { LoginPage } from "./components/auth/LoginPage";

// Citizen Views
import { CitizenDashboard } from "./components/citizen/CitizenDashboard";
import { DocumentUploadCenter } from "./components/citizen/DocumentUploadCenter";
import { ApplicationTracker } from "./components/citizen/ApplicationTracker";
import { CertificateViewer } from "./components/citizen/CertificateViewer";
import { CitizenNotifications } from "./components/citizen/CitizenNotifications";
import { CitizenProfile } from "./components/citizen/CitizenProfile";

// Admin Views
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { ApplicationsManager } from "./components/admin/ApplicationsManager";
import { AIAssistantDrawer } from "./components/admin/AIAssistantDrawer";
import { AuditLogViewer } from "./components/admin/AuditLogViewer";
import { SettingsManager } from "./components/admin/SettingsManager";
import { ReportsCenter } from "./components/admin/ReportsCenter";

type Portal = "login" | "citizen" | "admin";
type CitizenPage =
  | "dashboard"
  | "upload"
  | "track"
  | "certificate"
  | "notifications"
  | "profile";
type AdminPage =
  | "dashboard"
  | "applications"
  | "reports"
  | "ai"
  | "audit"
  | "settings";

export default function App() {
  const [portal, setPortal] = useState<Portal>(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    return "login";
  });
  const [citizenPage, setCitizenPage] = useState<CitizenPage>("dashboard");
  const [adminPage, setAdminPage] = useState<AdminPage>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  const handleLogin = (role: "citizen" | "admin", userData?: any) => {
    setPortal(role);
    setCurrentUser(userData || null);
    if (role === "citizen") setCitizenPage("dashboard");
    if (role === "admin") setAdminPage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    setPortal("login");
    setCurrentUser(null);
    toast.info("You have securely signed out of SmartCert.");
  };

  if (portal === "login") {
    return (
      <>
        <Toaster position="top-right" richColors />
        <LoginPage onLogin={handleLogin} portal={window.location.pathname.replace(/\/$/, "") === "/admin" ? "admin" : "citizen"} />
      </>
    );
  }

  const activePage = portal === "citizen" ? citizenPage : adminPage;
  const setActivePage = (page: string) => {
    if (portal === "citizen") {
      setCitizenPage(page as CitizenPage);
    } else {
      setAdminPage(page as AdminPage);
    }
  };

  return (
    <div
      className={`min-h-screen text-slate-900 flex flex-col font-sans antialiased selection:bg-slate-950 selection:text-white ${
        portal === "admin" ? "bg-slate-100" : "bg-[#f5f6f3]"
      }`}
    >
      <Toaster position="top-right" richColors />

      {/* Top Application Header */}
      <AppHeader
        portal={portal}
        onLogout={handleLogout}
        currentPage={activePage}
        onNavigate={setActivePage}
        user={currentUser}
      />

      {/* Body with Sidebar and Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <AppSidebar
          portal={portal}
          currentPage={activePage}
          onNavigate={setActivePage}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
          {portal === "citizen" && (
            <>
              {citizenPage === "dashboard" && (
                <CitizenDashboard onNavigate={(p) => setCitizenPage(p as CitizenPage)} currentUser={currentUser} />
              )}
              {citizenPage === "upload" && <DocumentUploadCenter currentUser={currentUser} onNavigate={(page) => setCitizenPage(page as CitizenPage)} />}
              {citizenPage === "track" && (
                <ApplicationTracker
                  currentUser={currentUser}
                  onNavigateToUpload={() => setCitizenPage("upload")}
                  onNavigateToCertificate={() => setCitizenPage("certificate")}
                />
              )}
              {citizenPage === "certificate" && <CertificateViewer currentUser={currentUser} />}
              {citizenPage === "notifications" && <CitizenNotifications currentUser={currentUser} />}
              {citizenPage === "profile" && <CitizenProfile user={currentUser} />}
            </>
          )}

          {portal === "admin" && (
            <>
              {adminPage === "dashboard" && (
                <AdminDashboard onNavigate={(p) => setAdminPage(p as AdminPage)} />
              )}
              {adminPage === "applications" && <ApplicationsManager />}
              {adminPage === "reports" && <ReportsCenter />}
              {adminPage === "ai" && <AIAssistantDrawer />}
              {adminPage === "audit" && <AuditLogViewer />}
              {adminPage === "settings" && <SettingsManager />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
