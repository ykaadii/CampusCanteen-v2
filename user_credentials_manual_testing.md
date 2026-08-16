# CampusCanteen — User Roles & Credentials Document for Manual Testing

This document contains all system user credentials, roles, canteen assignments, and step-by-step manual testing scenarios for the **CampusCanteen MERN Application**.

---

## 1. System Super Admin Account (ADMIN)

| Role | User Name | Email Address | Password | Privileges & Portal Scope |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | Campus Admin | `admin@campus.edu` | `adminpassword123` | System Super Admin (`/admin`). Manages Campuses & Canteens CRUD, uploads/updates canteen cover photos, assigns Canteen Owners & Staff, views user directory. |

---

## 2. Canteen Owner Accounts (CANTEEN_OWNER)

Canteen Owners have access to the **Canteen Owner Portal (`/owner`)** to inspect day-wise revenue, month-wise sales, peak rush hours, top 5 dishes, and order logs.

| Canteen Name | User Name | Email Address | Password | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Central Student Food Court** | Central Canteen Owner | `owner.central@canteen.edu` | `owner123` | `CANTEEN_OWNER` |
| **Amul** | Amul Owner | `owner.amul@canteen.edu` | `owner123` | `CANTEEN_OWNER` |
| **HK cafe** | HK cafe Owner | `owner.hkcafe@canteen.edu` | `owner123` | `CANTEEN_OWNER` |
| **Mother Dairy** | Mother Dairy Owner | `owner.motherdairy@canteen.edu` | `owner123` | `CANTEEN_OWNER` |
| **Nescafe-Admin Block** | Nescafe-Admin Block Owner | `owner.nescafeadminblock@canteen.edu` | `owner123` | `CANTEEN_OWNER` |
| **Rajive ki Dukan** | Rajive ki Dukan Owner | `owner.rajivekidukan@canteen.edu` | `owner123` | `CANTEEN_OWNER` |
| **Dharmendra di Dukan** | Dharmendra di Dukan Owner | `owner.dharmendradidukan@canteen.edu` | `owner123` | `CANTEEN_OWNER` |

---

## 3. Canteen Counter Staff Accounts (CANTEEN_STAFF)

Canteen Counter Staff have access to the **Staff Queue Portal (`/canteen`)** to manage live order queues, transition order statuses (`Accept` → `Prepare` → `Ready` → `Deliver`), collect counter cash payments, and toggle dish availability (`Available` / `Sold Out`).

| Canteen Name | User Name | Email Address | Password | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Central Student Food Court** | Central Food Court Staff | `staff.central@canteen.edu` | `staff123` | `CANTEEN_STAFF` |
| **Amul** | Amul Canteen Staff | `staff.amul@canteen.edu` | `staff123` | `CANTEEN_STAFF` |
| **HK cafe** | HK Cafe Staff | `staff.hkcafe@canteen.edu` | `staff123` | `CANTEEN_STAFF` |
| **Mother Dairy** | Mother Dairy Staff | `staff.motherdairy@canteen.edu` | `staff123` | `CANTEEN_STAFF` |
| **Nescafe-Admin Block** | Nescafe Staff | `staff.nescafe@canteen.edu` | `staff123` | `CANTEEN_STAFF` |
| **Rajive ki Dukan** | Rajive Dukan Staff | `staff.rajive@canteen.edu` | `staff123` | `CANTEEN_STAFF` |
| **Dharmendra di Dukan** | Dharmendra Dukan Staff | `staff.dharmendra@canteen.edu` | `staff123` | `CANTEEN_STAFF` |

---

## 4. Student / Customer Accounts (STUDENT)

Students have access to the **Student Portal (`/student`)** to select default campus preferences, browse canteens, order dishes, select Dine-In vs Takeaway, schedule preparation timing (ASAP to 60m max), pay via Cash or Razorpay, and track live order progress.

| User Name | Email Address | Password | Default Campus | Role |
| :--- | :--- | :--- | :--- | :--- |
| Alex Smith | `alex@student.edu` | `studentpassword123` | NIT Delhi | `STUDENT` |
| Adiiii | `241230004@nitdelhi.ac.in` | `student123` | NIT Delhi | `STUDENT` |
| Rishu | `241230042@nitdelhi.ac.in` | `student123` | NIT Delhi | `STUDENT` |
| OTP Student | `test_otp_1786825703142@student.edu` | `student123` | Main University | `STUDENT` |
| Audit Student | `audit_user_1786875479451@campus.edu` | `student123` | NIT Delhi | `STUDENT` |

---

## 5. Manual Testing Scenarios Quick Start

### Scenario A: End-to-End Student Ordering & Pre-Order Timing
1. Log in as Student (`alex@student.edu` / `studentpassword123`).
2. Select your campus (e.g. `NIT Delhi`).
3. Click a canteen card (e.g. `Central Student Food Court`).
4. Click `+ Add to Cart` on food items.
5. Open Cart Drawer (`View Cart`):
   - Choose Order Preference: **`🍽️ Dine-In`** or **`📦 Takeaway / Pack`**.
   - Choose Preparation Timing: **`⚡ ASAP`**, **`+15m`**, **`+30m`**, **`+45m`**, or **`+60m`**.
   - Choose Payment Method: **`Cash on Pickup`** or **`Razorpay Online`**.
6. Click `Place Order`. Note down the generated **Token Number** (e.g. `Token #105`).

### Scenario B: Canteen Staff Live Queue & Counter Processing
1. Log in as Canteen Staff (`staff.central@canteen.edu` / `staff123`).
2. View the live order card for Token `#105`:
   - Verify Order Type badge: `📦 TAKEAWAY (PACK)` or `🍽️ DINE-IN`.
   - Verify Target Pickup Timing badge (e.g. `⏱️ Pickup at 12:45 PM`).
3. Click **`Accept Order`** → **`Start Preparing`** → **`Mark Ready for Pickup`** → **`Deliver / Hand Over`**.
4. Switch to **Menu Management** tab:
   - Click `Available` / `Sold Out` on any dish to test live stock availability toggling.

### Scenario C: Canteen Owner Business Analytics Inspection
1. Log in as Canteen Owner (`owner.central@canteen.edu` / `owner123`).
2. View KPI Metric Cards: Total Revenue (₹), Cash vs Razorpay subtotals, Total Orders, Average Order Value (AOV), and Order Type Ratios.
3. Switch sales report tabs:
   - `📅 Day-Wise`: Inspect daily sales breakdown table (`YYYY-MM-DD`).
   - `🗓️ Month-Wise`: Inspect monthly revenue comparison table (`August 2026`).
   - `⚡ Today's Peak Hours`: Inspect 24-hour peak rush hour distribution cards.
4. Inspect **Top 5 Selling Dishes** table and filter recent order transaction logs.

### Scenario D: System Admin Management
1. Log in as System Admin (`admin@campus.edu` / `adminpassword123`).
2. Navigate to `/admin`:
   - Manage Campuses and Canteens.
   - Click **`Change Photo`** to upload/update canteen cover images.
   - Click **`Assign Owner`** to assign or change canteen owner accounts.
   - Click **`Assign Staff`** to assign canteen counter staff members.
