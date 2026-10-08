# Real Estate CRM

A modern, full-stack CRM built specifically for real estate agencies to manage leads, properties, follow-ups, and sales team assignments securely.

## 🚀 Tech Stack
- **Frontend:** Next.js (React), CSS Modules (Custom UI), JSX
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (Hosted on Neon DB)
- **Authentication:** JWT (JSON Web Tokens) & Bcrypt

## ⚙️ Setup Instructions (Local Development)

### 1. Clone the repository
```bash
git clone <your-github-repo-url>
cd Real-estate-crm
```

### 2. Backend Setup
```bash
cd backend
npm install
```
**Environment Variables:** Create a `.env` file in the `backend` folder:
```env
PORT=5000
DATABASE_URL=postgresql://<username>:<password>@<neon-db-url>/crm?sslmode=require
JWT_SECRET=supersecretkey
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Start the frontend server:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🗄️ Database Schema & API Overview

### Database Tables (PostgreSQL)
1. **Users:** Stores Admin and Sales employee credentials (Passwords are hashed).
2. **Leads:** Stores customer inquiries (Name, Phone, Email, Stage, Property Type, Budget, Follow-up Date, Assigned To).
3. **Properties:** Inventory of properties/projects available for sale.
4. **Bookings:** Tracks properties that have been successfully sold/booked.

### Key API Endpoints
**Auth (Authentication)**
- `POST /api/auth/login`: Authenticates user and returns JWT token.

**Leads (Lead Management)**
- `GET /api/leads`: Fetch all leads (Admin sees all, Sales sees only assigned leads).
- `POST /api/leads`: Add a new lead.
- `PUT /api/leads/:id`: Edit a lead.
- `DELETE /api/leads/:id`: Delete a lead.
- `POST /api/leads/bulk-delete`: Bulk delete leads (Admin only).

**Properties & Employees**
- `GET /api/properties`: Fetch available inventory.
- `GET /api/employees`: Fetch list of sales representatives (Admin only).

---

## 🌐 Deployment
- **Frontend URL:** `https://crm-project-final-kappa.vercel.app` (Deployed on Vercel)
- **Backend URL:** `https://crm-project-final-production.up.railway.app` (Deployed on Railway)
- **Database:** Hosted on Neon Cloud (PostgreSQL).

*Note: For production deployment, ensure the frontend API calls point to the Live Backend URL instead of localhost.*
