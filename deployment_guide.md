# CampusCanteen — Step-by-Step Production Deployment Guide

This document provides complete instructions for deploying the **CampusCanteen MERN Stack Application** to free / cloud hosting platforms (**Render**, **Vercel**, and **Neon PostgreSQL**).

---

## Architecture Summary

| Component | Technology | Recommended Cloud Platform | Free Tier Supported |
| :--- | :--- | :--- | :--- |
| **Database** | PostgreSQL | [Neon.tech](https://neon.tech) / Supabase / Render DB | Yes |
| **Backend API** | Node.js Express + Socket.IO | [Render.com Web Service](https://render.com) | Yes |
| **Frontend SPA** | React 19 + Vite | [Vercel](https://vercel.com) / Netlify | Yes |
| **Media Uploads** | Cloudinary SDK | [Cloudinary](https://cloudinary.com) | Yes |
| **Payments** | Razorpay SDK | [Razorpay Dashboard](https://dashboard.razorpay.com) | Test & Live Mode |

---

## Step 1: Set Up Cloud PostgreSQL Database (Neon.tech)

1. Sign up for a free account at **[https://neon.tech](https://neon.tech)**.
2. Click **Create Project**, name it `campuscanteen-db`, and select your nearest region.
3. Copy the generated PostgreSQL Connection String:
   ```text
   postgres://username:password@ep-host-name.pooler.neon.tech/neondb?sslmode=require
   ```
4. Save this string as your production `DATABASE_URL`.

---

## Step 2: Deploy Backend API to Render (Web Service)

1. Push your project codebase to **GitHub**.
2. Sign up at **[https://render.com](https://render.com)**.
3. Click **New +** &rarr; **Web Service**.
4. Connect your GitHub repository.
5. Configure deployment settings:
   - **Name:** `campuscanteen-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

6. Add **Environment Variables** under Render Dashboard:

| Variable Key | Example Value | Notes |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for Express server |
| `NODE_ENV` | `production` | Production node environment |
| `DATABASE_URL` | `postgres://...` | Connection string from Step 1 |
| `JWT_SECRET` | `super_secret_jwt_key_2026` | Random secure string |
| `CLIENT_URL` | `https://campuscanteen.vercel.app` | Production frontend URL |
| `RAZORPAY_KEY_ID` | `rzp_test_xxxxxx` | Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | `xxxxxxxxx` | Razorpay Key Secret |
| `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | Cloudinary name |
| `CLOUDINARY_API_KEY` | `your_api_key` | Cloudinary key |
| `CLOUDINARY_API_SECRET` | `your_api_secret` | Cloudinary secret |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP Server |
| `EMAIL_PORT` | `587` | SMTP Port |
| `EMAIL_USER` | `your.email@gmail.com` | Email Sender |
| `EMAIL_PASS` | `xxxx xxxx xxxx xxxx` | Gmail App Password |

7. Click **Create Web Service**. Note your backend live URL (e.g. `https://campuscanteen-backend.onrender.com`).
8. To seed initial canteen data, open Render Shell and run:
   ```bash
   npm run db:seed
   ```

---

## Step 3: Deploy Frontend Application to Vercel

1. Log in to **[https://vercel.com](https://vercel.com)**.
2. Click **Add New...** &rarr; **Project**.
3. Import your GitHub repository.
4. Configure build settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. Add **Environment Variables**:

| Variable Key | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://campuscanteen-backend.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://campuscanteen-backend.onrender.com` |

6. Click **Deploy**. Vercel will build and assign your live production URL (e.g. `https://campuscanteen.vercel.app`).

---

## Step 4: Verify Post-Deployment Setup

1. Open your frontend URL: `https://campuscanteen.vercel.app`.
2. Test Login using Super Admin: `admin@campus.edu` / `adminpassword123`.
3. Test Canteen Owner Portal: `owner.central@canteen.edu` / `owner123`.
4. Test Student Pre-Order, Dine-In vs Takeaway, and Token generation.
5. Verify live Socket.IO status updates on Staff Queue.
