# Smart Marriage Certificate System

A comprehensive digital government platform for marriage certificate registration, biometric & document verification, application processing, blockchain certificate issuance, and public QR verification.

---

## Project Structure

The project is classified into dedicated **frontend** and **backend** applications:

```text
Smart Marriage Certificate System/
├── backend/                  # Node.js & Express REST API server
│   ├── src/
│   │   ├── server.js         # Server entry point & middleware
│   │   ├── data/
│   │   │   └── store.js      # Data models & initial seed state
│   │   └── routes/
│   │       ├── auth.routes.js          # Authentication & user sessions
│   │       ├── applications.routes.js  # Marriage applications & status workflow
│   │       ├── certificates.routes.js  # Certificate issuance & QR verification
│   │       ├── documents.routes.js     # Document uploads & OCR verification
│   │       ├── audit.routes.js         # Immutable audit logging
│   │       ├── stats.routes.js         # Dashboard KPIs & monthly trends
│   │       ├── ai.routes.js            # AI Assistant endpoint
│   │       ├── users.routes.js         # Officer & citizen user directory
│   │       ├── notifications.routes.js # Notification alerts
│   │       └── settings.routes.js      # System configuration & policies
│   ├── .env                  # Backend environment variables
│   ├── package.json          # Backend dependencies (Express, CORS, Morgan, etc.)
│   └── README.md             # Backend documentation & API reference
│
├── frontend/                 # React 18 + Vite + Tailwind CSS client
│   ├── src/
│   │   ├── main.tsx          # Application entry point
│   │   ├── app/
│   │   │   ├── App.tsx       # Main portal UI (Citizen & Admin workflows)
│   │   │   ├── components/   # UI components, cards, tables, charts
│   │   │   └── services/
│   │   │       └── api.ts    # Frontend API client connected to backend
│   │   └── styles/           # Tailwind CSS, fonts, and theme definitions
│   ├── vite.config.ts        # Vite configuration with API proxy to port 5000
│   ├── package.json          # Frontend dependencies (React, Recharts, Radix, Lucide)
│   └── dist/                 # Production build artifacts
│
├── package.json              # Root workspace package.json with unified scripts
└── README.md                 # System overview and getting started guide
```

---

## Portals & Features

### 1. Citizen Portal
- **Dashboard**: Track live application status, milestone progress, estimated completion, and assigned officer.
- **Upload Documents**: Upload National ID, Passport, Birth Certificate, and Marriage Consent with automated AI OCR status checks.
- **Track Application**: Interactive step-by-step progress timeline from submission to final digital seal.
- **Smart Certificate**: View official digital marriage certificate with blockchain hash, QR code, digital signatures, and PDF export.
- **Profile & Notifications**: Manage personal civil details and view real-time registry alerts.

### 2. Government Officer / Admin Portal
- **Dashboard**: High-level KPI indicators, monthly application charts, and status distributions.
- **Applications Management**: Full application registry with status filtering (`pending`, `review`, `approved`, `rejected`, `documents`), officer reassignment, and priority queues.
- **AI Assistant**: Conversational assistant for document anomaly detection, civil policy checks, and expedited case review.
- **Audit Logs**: Immutable compliance record tracking every officer action, timestamp, target, and IP address.
- **Reports & Analytics**: Volume trends, processing speed metrics, and approval breakdown.
- **System Settings**: Configurable security, document DPI requirements, and notification rules.

---

## Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended, tested on Node v22)
- [npm](https://www.npmjs.com/) (v10 or newer)

---

### Running Frontend and Backend Concurrently

From the root directory:

```bash
# 1. Install all dependencies for both backend and frontend
npm run install:all

# 2. Start both backend and frontend simultaneously
npm run dev
```

- **Frontend**: Accessible at [http://localhost:5173](http://localhost:5173)
- **Backend API**: Running at [http://localhost:5000](http://localhost:5000) (Health check: [http://localhost:5000/api/health](http://localhost:5000/api/health))

---

### Running Individually

#### Start Backend Only
```bash
# From root
npm run dev:backend

# Or directly in backend folder:
cd backend
npm run dev
```

#### Start Frontend Only
```bash
# From root
npm run dev:frontend

# Or directly in frontend folder:
cd frontend
npm run dev
```

#### Build Frontend for Production
```bash
npm run build
```
The optimized production bundle will be created in `frontend/dist/`.