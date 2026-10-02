# Smart Marriage Certificate System - Backend API

Production-ready REST API service for the Smart Marriage Certificate System, powering citizen application workflows, government registry officer review, document OCR validation, cryptographic certificate generation, and immutable audit trails.

## Tech Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Middleware**: CORS, Morgan logger, dotenv
- **Architecture**: Modular REST architecture (Routes, Controllers/Data Store, Middleware)

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file (copied from `.env.example`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3. Run development server
```bash
npm run dev
```
The server will start at `http://localhost:5000`.

## API Endpoints

### Health Check
- `GET /api/health` - API health and uptime status

### Authentication
- `POST /api/auth/login` - Authenticate citizen or registry officer
- `GET /api/auth/me` - Get profile for authenticated user
- `POST /api/auth/logout` - Logout session

### Marriage Applications
- `GET /api/applications` - List all applications (supports `filter`, `search`, `priority` query params)
- `GET /api/applications/:id` - Get specific application details
- `POST /api/applications` - Submit a new marriage certificate application
- `PATCH /api/applications/:id/status` - Update status (`approved`, `rejected`, `review`, `documents`)
- `PATCH /api/applications/:id/priority` - Update priority (`normal`, `high`, `urgent`)

### Certificates
- `GET /api/certificates` - List issued certificates
- `GET /api/certificates/:certificateNo` - Get certificate by number (e.g. `CERT-2024-003421`)
- `GET /api/certificates/verify/:verificationId` - Public QR/verification endpoint with blockchain hash check

### Documents
- `GET /api/documents/:applicationId` - List uploaded documents and verification state
- `POST /api/documents/:applicationId/upload` - Upload and simulate OCR authenticity verification
- `DELETE /api/documents/:applicationId/:documentType` - Delete/remove an uploaded document

### Audit Logs & Compliance
- `GET /api/audit` - Immutable record of all registry operations and officer actions
- `POST /api/audit` - Record custom audit action

### Analytics & Reports
- `GET /api/stats/summary` - KPI summary (issued, approval rate, avg time, pending)
- `GET /api/stats/monthly` - Monthly application volume trends
- `GET /api/stats/distribution` - Application status breakdown

### AI Assistant
- `POST /api/ai/chat` - AI assistant query for document analysis and civil registry guidance

### Users & Notifications
- `GET /api/users` - Registry officers and citizens directory
- `GET /api/notifications` - Notifications feed for citizens and officers
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `GET /api/settings` & `PUT /api/settings` - System settings and policies
