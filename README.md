# ColdConnect CRM 🚀
> **Smart Outbound Cold Calling, Lead Routing, and Sales Performance CRM.**

ColdConnect CRM is a premium, enterprise-grade SaaS application designed to help outbound calling teams manage leads, automate distributions, log interactions, analyze performance, and streamline agent workflows. Built with dark-mode glassmorphic aesthetics inspired by Linear, Stripe, and Vercel.

---

## 🎨 Premium Visual Experience
* **Soft Aurora Login:** GPU-accelerated backdrop gradient waves and shifting glow spotlights.
* **Notion-Style Calendar:** Interactive schedule planner with Month, Week, Day, and Agenda views to log future callbacks.
* **Reports Dashboard:** Real-time KPI summary cards, interactive charts (Call Volume, Status Distribution, Lead Sources, and Conversion Funnels), and agent performance reports.

---

## ⚡ Core Features & Modules

### 1. Lead Profiles & Description Cards
* Create, search, filter, edit, and delete leads.
* Bulk import leads via CSV with active duplicate checks.
* Render a full-width **Description Card** under the Overview tab to view background context.

### 2. Interactive Notes Timeline Feed
* Live notes timeline for every lead profile.
* Add detailed notes, edit note contents inline (adds an `(edited)` tag), and delete notes with safety checks.
* Role-based permissions limits modification controls to the note's author or workspace administrators.

### 3. Outbound Calling Dialer & Call Recording Selection
* Automated calling deck overlay with built-in timers.
* Select post-call recording upload method:
  1. **Upload Auto-Recorded Session:** Uploads the browser mic conversation directly to Cloudinary.
  2. **Upload File Manually:** Drag-and-drop local audio files (`.mp3`, `.wav`) to upload instead.
  3. **Skip Upload:** Save outcomes and logs without uploading any recording.

### 4. Workspace Global Settings Panel
* **Workspace & Branding:** Workspace description, timezone configurations, and daily target logs.
* **Call Configurations:** Toggle auto-recording features and set operating business hours limits.
* **Lead Distribution:** Configure manual or automated **Round-Robin** routing rules.
* **Developer & Keys:** Twilio VoIP SID credentials and developer access tokens.

### 5. Support Portal Desk
* Log support tickets with urgent/medium/low priority tags.
* Administrative ticket resolver dropdown (Open ➔ In Progress ➔ Resolved ➔ Closed).
* Latency health check widgets showing live connection status for the database, api, and Cloudinary APIs.
* Setup FAQ accordion search.

---

## 🛠️ Technology Stack
* **Frontend:** Next.js 15, React 19, TypeScript, TailwindCSS, TanStack React Query, Recharts, Framer Motion, Sonner.
* **Backend:** Node.js, Express, Mongoose (MongoDB), Socket.io, Cloudinary SDK.
* **Database:** MongoDB (Activity logs, Settings, Call logs, Tickets, Notes, Users, Leads).

---

## ⚙️ Getting Started & Launch Guides

### 1. Environment Configurations
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_uri
JWT_SECRET=your_jwt_secret_token
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Create a `.env` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### 2. Setup the Backend Database & API Server
```bash
cd backend
npm install
npm run seed  # Seeds the database with default agents & workspace settings
npm run dev   # Runs backend on http://localhost:5000
```

### 3. Launch the Frontend Next.js Client
```bash
cd frontend
npm install
npm run dev   # Runs frontend client on http://localhost:3000
```

---

## 🔑 Access Credentials

### Admin Dashboard
* **Email:** `admin@coldconnect.com`
* **Password:** `Admin@123456`

### Agent Console
* **Email:** `agent@coldconnect.com`
* **Password:** `Agent@123456`
