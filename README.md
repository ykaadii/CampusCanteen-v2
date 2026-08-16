# 🍛 CampusCanteen — Full-Stack MERN Application

A modern, production-grade Campus Food Court Pre-Ordering & Management System built with **React 19**, **Vite**, **Tailwind CSS**, **Node.js Express**, **Prisma ORM**, **PostgreSQL**, **Socket.IO**, and **Razorpay**.

---

## 🌟 Key Features

- 📱 **Responsive Multi-Portal Frontend:**
  - **Student View (`/student`):** Browse canteens, select default campus, choose Dine-In vs Takeaway, schedule preparation timing (ASAP to 60m max), pay via Cash or Razorpay online, and track live order timelines.
  - **Canteen Counter Staff (`/canteen`):** Real-time Socket.IO live order queue, status transitions (`Accept` → `Prepare` → `Ready` → `Deliver`), counter cash collection, and dish stock toggles.
  - **Canteen Owner Portal (`/owner`):** Executive KPI metrics, Day-Wise & Month-Wise sales breakdown reports, peak rush hours, top 5 selling dishes table, and transaction history logs.
  - **Admin Panel (`/admin`):** Campus & Canteen CRUD, canteen cover photo uploads, canteen owner & staff assignments, user directory.

- 🔒 **Security & Authentication:**
  - 4-Tier Role Architecture (`ADMIN`, `CANTEEN_OWNER`, `CANTEEN_STAFF`, `STUDENT`).
  - 2-Step Email OTP verification, JWT authentication, bcrypt password hashing, Helmet, CORS protection, Zod schema validation, and server-side price enforcement.

- 💳 **Online Payments & Cloud Integrations:**
  - Razorpay online checkout with HMAC SHA256 signature verification.
  - Cloudinary media upload integration for canteen cover photos & menu images.
  - Nodemailer Gmail SMTP integration for transactional OTP emails.

---

## 🚀 Quick Start (Local Development)

### 1. Clone Repository & Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Create `backend/.env` based on `backend/.env.example`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://user:password@localhost:5432/campus_canteen"
JWT_SECRET="your_jwt_secret"
```

### 3. Run Database Migrations & Seed Data

```bash
cd backend
npx prisma db push
npm run db:seed
```

### 4. Start Development Servers

```bash
# Terminal 1: Start Backend API
cd backend
npm run dev

# Terminal 2: Start Frontend Client
cd frontend
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 🔑 Manual Testing Accounts

See [`user_credentials_manual_testing.md`](./user_credentials_manual_testing.md) or [`user_credentials_manual_testing.doc`](./user_credentials_manual_testing.doc) for full login details.

- **System Admin:** `admin@campus.edu` / `adminpassword123`
- **Canteen Owner:** `owner.central@canteen.edu` / `owner123`
- **Canteen Staff:** `staff.central@canteen.edu` / `staff123`
- **Student User:** `alex@student.edu` / `studentpassword123`

---

## 🌐 Production Deployment Guide

See [`deployment_guide.md`](./deployment_guide.md) or [`deployment_guide.doc`](./deployment_guide.doc) for deployment steps to **Render** (backend), **Vercel** (frontend), and **Neon** (PostgreSQL).
