// Runtime fallback used only when PostgreSQL is unavailable.
// Application, certificate, notification, and audit content should come from the database.
export const store = {
  stats: {
    certificatesIssued: 0,
    avgProcessingTimeDays: 0,
    approvalRatePercent: 0,
    activeOfficers: 0,
    pendingApplications: 0,
    monthly: [],
    statusDistribution: [],
  },
  users: [],
  applications: [],
  certificates: [],
  auditLogs: [],
  notifications: [],
  settings: {
    systemName: "Smart Marriage Certificate System",
    autoOcrVerification: true,
    blockchainAnchorEnabled: true,
    minImageDpi: 300,
    notificationChannels: {
      email: true,
      sms: true,
      push: true,
    },
    security: {
      encryptionAlgorithm: "AES-256-GCM",
      sessionTimeoutMinutes: 30,
      mfaRequiredForOfficers: true,
    },
  },
};
