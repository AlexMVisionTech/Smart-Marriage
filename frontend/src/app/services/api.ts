// API Service for Smart Marriage Certificate System Frontend
const BASE_URL = import.meta.env.VITE_API_URL || "";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const responseBody = await response.text().catch(() => "");
    let message = `Request failed with status ${response.status}`;
    if (responseBody) {
      try {
        const errorData = JSON.parse(responseBody);
        message = errorData.message || message;
      } catch {
        if (response.status === 413) message = "The file is too large to upload. Choose a smaller PDF.";
      }
    }
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  // Health
  checkHealth: () => request<{ status: string; service: string }>("/api/health"),

  // Auth
  login: (credentials: { email?: string; password?: string; role?: "citizen" | "admin"; ssoProvider?: string }) =>
    request<{ success: boolean; token: string; user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
  registerCitizen: (data: {
    name: string;
    email: string;
    password: string;
    nationalId: string;
    phone?: string;
    nationality?: string;
  }) =>
    request<{ success: boolean; token: string; user: any }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMe: (role?: string) =>
    request<{ success: boolean; user: any }>(`/api/auth/me${role ? `?role=${role}` : ""}`),
  logout: () => request<{ success: boolean }>("/api/auth/logout", { method: "POST" }),

  // Applications
  getApplications: (params?: { filter?: string; search?: string; priority?: string; nationalId?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ success: boolean; count: number; total: number; applications: any[] }>(
      `/api/applications${query ? `?${query}` : ""}`
    );
  },
  getApplicationById: (id: string) =>
    request<{ success: boolean; application: any }>(`/api/applications/${id}`),
  createApplication: (data: any) =>
    request<{ success: boolean; application: any }>("/api/applications", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateApplicationStatus: (id: string, status: string, reason?: string) =>
    request<{ success: boolean; application: any }>(`/api/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    }),
  updateApplicationPriority: (id: string, priority: string) =>
    request<{ success: boolean; application: any }>(`/api/applications/${id}/priority`, {
      method: "PATCH",
      body: JSON.stringify({ priority }),
    }),
  submitApplication: (id: string, paymentReceipt: string) =>
    request<{ success: boolean; application: any }>(`/api/applications/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ paymentReceipt }),
    }),

  // M-Pesa payments
  getPaymentConfig: () => request<{ success: boolean; amount: number; currency: string; demoMode?: boolean }>("/api/payments/config"),
  initiateMpesaPayment: (applicationId: string, phone: string) =>
    request<{ success: boolean; message: string; checkoutRequestId: string; demoMode?: boolean }>("/api/payments/mpesa/stk-push", {
      method: "POST",
      body: JSON.stringify({ applicationId, phone }),
    }),
  getPaymentStatus: (applicationId: string) =>
    request<{ success: boolean; status: string; amount: number; receipt: string | null; demoMode?: boolean }>(`/api/payments/${applicationId}/status`),

  // Certificates
  getCertificates: (params?: { nationalId?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ success: boolean; certificates: any[] }>(
      `/api/certificates${query ? `?${query}` : ""}`
    );
  },
  getCertificateByNo: (certificateNo: string) =>
    request<{ success: boolean; certificate: any }>(`/api/certificates/${certificateNo}`),
  verifyCertificate: (verificationId: string) =>
    request<{ success: boolean; verified: boolean; certificate: any }>(
      `/api/certificates/verify/${verificationId}`
    ),

  // Documents
  getDocuments: (applicationId: string) =>
    request<{ success: boolean; documents: any }>(`/api/documents/${applicationId}`),
  uploadDocument: (applicationId: string, documentType: string, fileName: string, mimeType: string, fileData: string) =>
    request<{ success: boolean; message: string; documents: any }>(
      `/api/documents/${applicationId}/upload`,
      {
        method: "POST",
        body: JSON.stringify({ documentType, fileName, mimeType, fileData }),
      }
    ),
  getDocumentFileUrl: (applicationId: string, documentType: string) =>
    `${BASE_URL}/api/documents/${encodeURIComponent(applicationId)}/${encodeURIComponent(documentType)}/file`,
  removeDocument: (applicationId: string, documentType: string) =>
    request<{ success: boolean; documents: any }>(
      `/api/documents/${applicationId}/${documentType}`,
      { method: "DELETE" }
    ),

  // Audit Logs
  getAuditLogs: (search?: string) =>
    request<{ success: boolean; count: number; logs: any[] }>(
      `/api/audit${search ? `?search=${encodeURIComponent(search)}` : ""}`
    ),

  // Stats & Reports
  getStatsSummary: () =>
    request<{ success: boolean; stats: any }>("/api/stats/summary"),
  getMonthlyStats: () =>
    request<{ success: boolean; monthly: any[] }>("/api/stats/monthly"),
  getStatusDistribution: () =>
    request<{ success: boolean; distribution: any[] }>("/api/stats/distribution"),

  // AI Assistant
  askAI: (message: string) =>
    request<{ success: boolean; reply: string }>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  // Users & Notifications
  getUsers: (role?: string) =>
    request<{ success: boolean; users: any[] }>(`/api/users${role ? `?role=${role}` : ""}`),
  getNotifications: (filter?: string, userId?: string) => {
    const query = new URLSearchParams();
    if (filter) query.set("filter", filter);
    if (userId) query.set("userId", userId);
    return request<{ success: boolean; unreadCount: number; notifications: any[] }>(
      `/api/notifications${query.toString() ? `?${query.toString()}` : ""}`
    );
  },
  markNotificationRead: (id: number) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: (userId?: string) =>
    request<{ success: boolean }>(
      `/api/notifications/read-all${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`,
      { method: "POST" }
    ),

  // Settings
  getSettings: () => request<{ success: boolean; settings: any }>("/api/settings"),
  updateSettings: (settings: any) =>
    request<{ success: boolean; settings: any }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),
};
