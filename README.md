# 📦 Enterprise Inventory Management System (EIMS)

A complete, production-ready, full-stack Inventory Management System featuring a high-performance **Django REST Framework (DRF) backend** and a modern, interactive **React + TypeScript + Vite + TailwindCSS frontend**.

This system is designed with strict **Role-Based Access Control (RBAC)**, optimized queries, custom caching/rate-limiting via **Redis**, cloud media storage via **AWS S3**, and detailed system auditing.

---

## 🌟 Key Highlights

- 👥 **Advanced RBAC:** Three distinct user roles (`ADMIN`, `MANAGER`, `STAFF`) with granular permissions.
- ⚡ **High-Performance Backend:** Caching, session management, and rate-limiting using **Redis**.
- 📊 **Dynamic Analytics Dashboard:** Built with **React 19**, **Zustand** state management, and interactive charts via **Recharts**.
- ☁️ **Cloud Storage Integration:** Automated media and static asset management using **AWS S3**.
- 📝 **Audit Logging & Notifications:** System-wide tracking of resource modifications and immediate operator alerts.
- 🎯 **Robust Security:** Pre-configured CORS, custom authentication middleware, and input validation via **Zod**.

---

## 🏗️ System Architecture

The following diagram illustrates how the system components communicate:

<p align="center">
  <img src="./django_react_architecture_v2.svg" alt="Project Structure" width="700"/>
</p>

---

## 📂 Repository Structure

```
inventory_management_System/
├── Inventory_management_backend/  # 🐍 DRF Python Backend
│   ├── core/                      # Global project configurations
│   ├── base/                      # Common database models & helpers
│   ├── accounts/                  # Authentication, roles, & registration
│   ├── products/                  # Catalog, category, and pricing management
│   ├── warehouses/                # Warehouse sites & tracking
│   ├── inventory/                 # Stock movement and adjustments
│   ├── orders/                    # Order processing & inventory reconciliation
│   ├── notifications/             # Immediate alerts/messages
│   ├── audit_logs/                # Admin logging of activity
│   ├── docs/                      # Postman collections
│   ├── static/                    # Local static assets
│   ├── requirements.txt           # Python dependency checklist
│   └── manage.py                  # Django utility entry point
│
├── inventory_FE/                  # ⚛️ Vite + React + TypeScript Frontend
│   ├── src/                       # Application source code (components, pages, stores)
│   ├── public/                    # Static assets
│   ├── package.json               # Frontend dependencies & script entrypoints
│   ├── tailwind.config.js         # Styling layout utilities
│   └── vite.config.ts             # Vite build orchestration
│
├── .gitignore                     # Unified, multi-stack Git exclusion list
└── README.md                      # Unified project orchestration guide (This file)
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Key Purpose |
| :--- | :--- | :--- |
| **Frontend Core** | React 19, TypeScript, Vite | Scalable, type-safe, hot-reloading web shell |
| **State & Fetching** | Zustand, TanStack React Query v5 | Highly optimized cache and local app state management |
| **Styling & UI** | TailwindCSS, Framer Motion, Lucide | Premium, animated, and responsive user experience |
| **Visual Analytics**| Recharts | Dynamic dashboards with interactive graphs |
| **Backend Core** | Django 5.2, Django REST Framework | Robust RESTful business logic and endpoint control |
| **Database** | PostgreSQL | Transactional, relations-focused database |
| **Cache & Speed** | Redis | Caching, session management, and rate-limiting |
| **File Storage** | AWS S3 / Boto3 | High-availability asset storage for product media |

---

## 🚀 Installation & Setup

### ⚙️ Prerequisites
Ensure the following tools are installed and running locally:
- **Node.js** (v18+) & **NPM**
- **Python** (v3.11+)
- **PostgreSQL** (v14+)
- **Redis Server**

---

### 1. 🐍 Backend Setup (Django)

1. Navigate to the backend directory:
   ```bash
   cd Inventory_management_backend
   ```
2. Create and activate a virtual environment:
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate (macOS/Linux)
   source venv/bin/activate
   
   # Activate (Windows)
   venv\Scripts\activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Setup PostgreSQL database:
   Run the PostgreSQL shell or PGAdmin and create the database:
   ```sql
   CREATE DATABASE inventory_management_db;
   ```
5. Configure environment secrets:
   Copy the example template and update the variables:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and fill in your DB credentials, Redis endpoints, and AWS credentials if using S3.*

6. Execute database migrations & create administrator account:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```
7. Fire up the backend server:
   ```bash
   python manage.py runserver
   ```
   *The backend will be live at `http://127.0.0.1:8000/`.*

---

### 2. ⚛️ Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd inventory_FE
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Establish your environment variables:
   Create a `.env` file inside the `inventory_FE/` directory:
   ```env
   VITE_API_URL=http://127.0.0.1:8000/api
   ```
4. Start the frontend developer server:
   ```bash
   npm run dev
   ```
   *The frontend dashboard will be live at `http://localhost:5173/`.*

---

## 👥 Role-Based Access Control (RBAC)

The platform is designed around strict, custom authorization models matching user roles to exact API endpoints:

| Role | Hierarchy Level | System Access Profile |
| :--- | :--- | :--- |
| **`ADMIN`** | Tier 1 (Highest) | Absolute read/write privileges over all entities, users, warehouses, and settings. |
| **`MANAGER`**| Tier 2 (Medium) | Operational management: configure products, warehouses, and adjust order statuses. |
| **`STAFF`** | Tier 3 (Operator) | Day-to-day work: check catalogs, view/create their own orders, and review notifications. |

### 🔐 API Role Enforcement

- **`IsAdminUserRole`**: Limits access solely to authenticated administrators.
- **`IsManagerOrAdmin`**: Restricts access to managers or administrators (e.g., product adjustments, log viewing).
- **Products, Warehouses, & Inventory APIs**:
  - `GET` (View-only): Allowed for all authenticated users.
  - `POST/PUT/PATCH/DELETE` (Mutations): Allowed only for `IsManagerOrAdmin`.
- **Orders API**:
  - `GET` (List): Standard `STAFF` see **only their own** orders. `MANAGER` and `ADMIN` retrieve **all system orders** globally.
  - `POST` (Creation): Open to all users to submit orders.
- **Audit Logs API**:
  - Accessible strictly via `IsManagerOrAdmin`.

### 📝 Role Registration Payload
When registering a new user, you can optionally supply a `role`. The backend includes case-insensitive normalization (e.g., `"Manager"` or `"manager"` automatically normalizes to `"MANAGER"`):
```json
{
    "username": "manager1",
    "email": "manager@example.com",
    "name": "Akash Bera",
    "role": "Manager",
    "password": "test1234",
    "confirm_password": "test1234"
```

---

## 📡 API Overview & Routes

Versioned endpoints under the `/api/` prefix:

### 🔑 Authentication
- `POST /api/accounts/v1/register/` - Create profile (supports dynamic role assignment)
- `POST /api/accounts/v1/login/` - Login and fetch Auth token
- `POST /api/accounts/v1/logout/` - Invalidate current session

### 📦 Products
- `GET /api/products/v1/products/` - Search and list products (paginated)
- `POST /api/products/v1/products/` - Add product details (*Manager/Admin only*)
- `PATCH /api/products/v1/products/{id}/` - Update specifications (*Manager/Admin only*)

### 🛒 Orders & Logistics
- `GET /api/orders/v1/orders/` - Retrieve orders (scoped list or absolute list depending on role)
- `POST /api/orders/v1/orders/` - Order dispatch and stock calculation
- `PATCH /api/orders/v1/orders/{id}/` - Modify order states (*Manager/Admin only*)

### 🔔 Operations Logging
- `GET /api/notifications/v1/notifications/` - View direct user notifications
- `GET /api/audit_logs/v1/auditlogs/` - Audit system-wide transactions (*Manager/Admin only*)

---

## 🧪 API Verification using Postman

We have included a complete Postman collection to simplify validation of all backend routes.

1. Find the collection JSON file at:
   `Inventory_management_backend/docs/inventory_management.postman_collection.json`
2. Open Postman, click **Import**, and select this file.
3. Use the pre-configured endpoints to test Registering, Logging in, and mutating data under different role credentials!

---

## 🎨 Premium UI Components & Visual Polish

The React frontend includes high-fidelity UI layouts:
- **Glassmorphism Sidebar Navigation**: Fluid design utilizing Framer Motion transitions.
- **Interactive Metrics Dashboard**: Recharts-based multi-axis line graphs and bar graphs for order statistics and stock capacities.
- **Role-specific UI views**: Hide or disable control elements in real-time according to logged-in user credentials.
- **Toast Notifications**: Interactive state alerts when inventory quantities change or actions succeed/fail.
