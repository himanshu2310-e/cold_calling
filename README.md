# ColdConnect CRM 🚀
> **Smart Cold Calling, Lead Routing, and Performance Analytics Dashboard.**

ColdConnect CRM is a premium, high-performance SaaS dashboard designed for cold calling teams, lead management, and workspace optimization. Built with modern dark aesthetics, smooth micro-animations, and modular component architectures.

---

## 🎨 Premium Visual Experience
* **Soft Aurora Login:** GPU-accelerated backdrop spotlight gradients matching Apple WWDC/Stripe aesthetics.
* **Notion-Style Calendar:** Drag-and-drop scheduling planner to log upcoming callbacks.
* **Interactive Analytics:** Real-time funnel progression indicators and Recharts visualizations.

---

## ⚡ Core Features
1. **Workspace Global Settings:**
   * Adjust office hours operation limits and agent lead import permissions.
   * Toggle auto-recording triggers, daily targets, and custom file retention guidelines.
   * Select routing rules (Manual, Round Robin, or High-Priority first).
2. **Support Ticket Desk:**
   * Support forms with ticket category and urgency tier tags.
   * Public service health monitoring widgets with active connection latency logs.
   * Collapsible FAQ guide drawer.
3. **Outbound Dialer & Custom Audio Recording:**
   * Interactive calling deck with time tracking.
   * Decide call-end actions: upload auto-recorded conversation, upload manual audio from your computer, or skip recording.
4. **Lead Details & Notes Timeline:**
   * Dedicated Notes tab showing discussions timeline.
   * Live inline note updates (adds `(edited)` tag) and delete controls.

---

## 🛠️ Technology Stack
* **Frontend:** Next.js 15, TypeScript, TailwindCSS, TanStack React Query, Sonner, Lucide Icons, Framer Motion, Recharts.
* **Backend:** Node.js, Express, Mongoose (MongoDB), Socket.io, Cloudinary SDK.
* **Database:** MongoDB (Activity logs, Settings config, Call logs, Support tickets, Notes, Users, Leads).

---

## ⚙️ Getting Started

### 1. Environment Variables Configuration
Create a `.env` file in the `backend/` directory based on `.env.example`:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signing_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

Create a `.env` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### 2. Launch the Backend Server
```bash
cd backend
npm install
npm run seed  # Seed the database with initial agents
npm run dev   # Runs on http://localhost:5000
```

### 3. Launch the Frontend Application
```bash
cd frontend
npm install
npm run dev   # Runs on http://localhost:3000
```

---

## 🔑 Default Credentials

### Admin Console
* **URL:** `http://localhost:3000/login`
* **Email:** `admin@coldconnect.com`
* **Password:** `Admin@123456`

### Agent Console
* **URL:** `http://localhost:3000/login`
* **Email:** `agent@coldconnect.com`
* **Password:** `Agent@123456`