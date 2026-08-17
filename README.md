# 🍛 CampusCanteen V2 — Production-Grade Campus Food Court Platform

[![React 19](https://img.shields.io/badge/Frontend-React_19_%7C_Vite_%7C_Tailwind_CSS-blue.svg)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_%7C_Express-green.svg)](https://nodejs.org)
[![Prisma](https://img.shields.io/badge/Database-Prisma_ORM_%7C_PostgreSQL-indigo.svg)](https://www.prisma.io)
[![Live Backend](https://img.shields.io/badge/Live_Backend-Render_Deployed-orange.svg)](https://campuscanteen-v2-backend.onrender.com/health)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**CampusCanteen V2** is a modern, production-grade Campus Canteen Pre-Ordering & Management Platform designed to eliminate long food queues across university campuses. Built with **React 19**, **Vite**, **Tailwind CSS**, **Node.js Express**, **Prisma ORM**, **Neon Cloud PostgreSQL**, **Socket.IO**, **Firebase Admin**, and **Razorpay**.

---

## 🔗 Live Application & API Links

- 🌐 **Live Render Backend API:** [`https://campuscanteen-v2-backend.onrender.com`](https://campuscanteen-v2-backend.onrender.com/health)
- 🚀 **GitHub Repository:** [`ykaadii/CampusCanteen-v2`](https://github.com/ykaadii/CampusCanteen-v2)

---

## 🌟 Architecture & Key Features

### 🎓 1. Student Portal (`/student`)
- **Campus & Canteen Selection:** Switch between campus locations (e.g. NIT Delhi, Main University Campus) with automatic default campus preference saving.
- **Dine-In vs Takeaway Toggle:** Specify dining choice for packaging customization.
- **Preparation Scheduling:** Pre-order meals with customizable pickup delay (ASAP, +15m, +30m, +45m, +60m max).
- **Atomic Daily Canteen Tokens:** Automatic midnight counter reset generating clean token numbers (`Token #1`, `Token #2`, etc.) per canteen per day.
- **Flexible Payment Options:** Pay via Cash on Pickup or online via **Razorpay** (UPI, Credit/Debit Cards, NetBanking).
- **Live Order Timeline:** Track realtime kitchen progress (`Pending` → `Accepted` → `Preparing` → `Ready for Pickup` → `Delivered`).

### 👨‍🍳 2. Counter Staff Queue (`/canteen`)
- **Real-time Order Queue:** Socket.IO WebSocket room connection (`canteen:<canteenId>`) for instant audio/visual order notifications without page refresh.
- **Kanban Pipeline:** One-click order status progression (`Accept Order` → `Mark Preparing` → `Mark Ready` → `Mark Delivered`).
- **Counter Cash Collection:** Mark cash orders as paid upon customer arrival.
- **Menu Availability Toggle:** Enable/disable menu item stock in real time during peak rush hours.

### 🏢 3. Canteen Owner Executive Portal (`/owner`)
- **Executive KPI Dashboard:** Total Revenue, Today's Sales, Active Orders, Average Fulfillment Time, and Total Orders completed.
- **Sales Analytics & Financial Breakdown:** Day-Wise & Month-Wise revenue reports with interactive visual bar charts.
- **Peak Rush Hours Analysis:** Time-of-day order distribution analysis to optimize kitchen staffing.
- **Top 5 Selling Items:** Popularity table breakdown by quantity sold and revenue generated.

### 🛡️ 4. System Admin Panel (`/admin`)
- **Campus & Canteen Management:** Create, update, and manage university campuses and food outlets.
- **Cloudinary Photo Uploads:** Upload high-resolution canteen cover photos and dish images.
- **Role Assignments:** Assign canteen staff and owners to specific canteen counters.
- **User Directory:** System-wide user role management (`ADMIN`, `CANTEEN_OWNER`, `CANTEEN_STAFF`, `STUDENT`).

---

## 🛠️ Tech Stack & Integrations

| Layer | Technology / Service |
| :--- | :--- |
| **Frontend Framework** | React 19, Vite 6, Tailwind CSS 4 |
| **Icons & UI** | Lucide React, Framer Motion |
| **Backend Runtime** | Node.js (v24 LTS), Express.js |
| **Database & ORM** | Neon Cloud PostgreSQL, Prisma ORM (v6.19.3) |
| **Realtime WebSockets** | Socket.IO (v4.8) |
| **Payment Gateway** | Razorpay Node SDK (HMAC SHA256 Verification) |
| **Image Storage** | Cloudinary API |
| **Email Service** | Nodemailer (Gmail SMTP over SSL Port 465) |
| **Security & Auth** | JWT (JSON Web Tokens), bcrypt, Helmet, Express Rate Limit, Zod |

---

## 📡 RESTful API Endpoint Architecture

```text
POST   /api/auth/send-otp           # Generate & dispatch 6-digit email OTP
POST   /api/auth/verify-otp-signup  # Verify OTP & create Student user account
POST   /api/auth/login              # Authenticate user & issue JWT token
GET    /api/auth/me                 # Fetch current authenticated user session
PATCH  /api/auth/default-campus     # Update student default campus preference

GET    /api/campuses                # List all university campuses
GET    /api/campuses/:id/canteens   # List canteens under a specific campus

GET    /api/canteens                # Search & discover open canteens
GET    /api/canteens/:id            # Fetch canteen detail & menu items
PATCH  /api/canteens/:id/toggle-open # Open/close canteen outlet

GET    /api/orders                  # List user orders (Filtered by role)
POST   /api/orders                  # Place new order & generate Atomic Token #
PATCH  /api/orders/:id/status       # Update order status (ACCEPTED/PREPARING/READY/DELIVERED)

POST   /api/payments/create-razorpay-order # Initiate Razorpay order (paise conversion)
POST   /api/payments/verify-razorpay       # Cryptographically verify HMAC signature
PATCH  /api/payments/:orderId/cash-paid     # Mark Cash order as collected by staff

GET    /api/admin/metrics           # System-wide executive analytics
GET    /api/owner/analytics/:id     # Canteen financial reports & peak rush breakdown
```

---

## 🚀 Quick Start (Local Development)

### 1. Clone Repository
```bash
git clone https://github.com/ykaadii/CampusCanteen-v2.git
cd CampusCanteen-v2
```

### 2. Configure Backend
```bash
cd backend
npm install
```

Create a `backend/.env` file:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://neondb_owner:password@ep-solitary-glade.neon.tech/neondb?sslmode=require"
JWT_SECRET="campuscanteen_jwt_secret_key_2026"

# Email SMTP Settings (SSL Port 465)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"

# Online Payments (Razorpay Test Keys)
RAZORPAY_KEY_ID="rzp_test_your_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_secret"

# Media Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### 3. Push Database Schema & Seed Data
```bash
npx prisma db push
npm run db:seed
```

### 4. Configure Frontend
```bash
cd ../frontend
npm install
```

Create a `frontend/.env` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 5. Launch Application
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🔑 Demo Test Accounts

| Role | Email Address | Password | Portal Route |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@campus.edu` | `adminpassword123` | `/admin` |
| **Canteen Owner** | `owner.central@canteen.edu` | `owner123` | `/owner` |
| **Counter Staff** | `staff@canteen.edu` | `staff123` | `/canteen` |
| **Student** | `alex@student.edu` | `studentpassword123` | `/student` |

---

## 📄 Documentation & Guides

- 📖 [`deployment_guide.md`](./deployment_guide.md) — Comprehensive Render, Vercel, and Neon deployment instructions.
- 📖 [`user_credentials_manual_testing.md`](./user_credentials_manual_testing.md) — Detailed manual testing scenarios for all portals.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
