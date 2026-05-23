# 📦 Enterprise Inventory Management System (EIMS)

A complete, production-ready full-stack Inventory Management System featuring a high-performance **Django REST Framework backend** and a modern **React + TypeScript + Vite + TailwindCSS frontend**.

Designed with strict **Role-Based Access Control (RBAC)**, optimized ORM queries, Redis caching/rate-limiting, AWS S3 cloud storage, Celery async task processing, and detailed system auditing.

---

## 🌟 Key Features

- **Advanced RBAC** — Three roles (`ADMIN`, `MANAGER`, `STAFF`) with granular per-endpoint permissions.
- **Async Task Processing** — Celery + Redis for background jobs: bulk CSV imports and scheduled low-stock alerts.
- **Interactive Analytics Dashboard** — Aggregated stats endpoint (no pagination limitation), Recharts bar chart for order status distribution, real-time revenue and low-stock summaries.
- **Warehouse Map** — Dark-themed interactive map (react-leaflet + CartoDB Dark Matter tiles) with per-warehouse markers and lat/lng editing.
- **Product Catalog** — Category classification (10 categories), filter/sort toolbar, CSV bulk import with live progress polling, per-row view dialog.
- **Profile Management** — Clickable avatar opens a profile modal with read/edit mode for personal details.
- **Audit Logging & Notifications** — System-wide activity trail with color-coded status badges; automated low-stock notifications via Celery Beat.
- **Cloud Storage** — AWS S3 for media/static in production (`USE_S3=True`); local filesystem in development.

---

## 🏗️ Architecture

<p align="center">
  <img src="./django_react_architecture_v2.svg" alt="System Architecture" width="700"/>
</p>

---

## 📂 Repository Structure

```
inventory_management_System/
├── Inventory_management_backend/   # Django 5.2 REST API
│   ├── core/           # Settings, URL routing, Celery app
│   ├── base/           # Shared mixins, permissions, pagination, dashboard stats
│   ├── accounts/       # Custom User model, auth, profile
│   ├── products/       # Product catalog, categories, CSV import jobs & tasks
│   ├── warehouses/     # Warehouse CRUD, lat/lng location fields
│   ├── inventory/      # Stock records, adjustment, low-stock Celery task
│   ├── orders/         # Order lifecycle, inventory reconciliation
│   ├── notifications/  # Per-user alerts
│   ├── audit_logs/     # Immutable activity trail
│   ├── docs/           # Postman collection
│   └── requirements.txt
│
└── inventory_FE/                   # React 19 + Vite frontend
    └── src/
        ├── api/            # Axios client (Token auth interceptor)
        ├── features/       # Domain modules: auth, products, orders, inventory,
        │                   #   warehouses, notifications, auditLogs, dashboard
        ├── pages/          # Route-level page components
        ├── components/     # Shared UI: DataTable, StatCard, StatusBadge, etc.
        ├── store/          # Zustand stores (authStore, themeStore)
        ├── layouts/        # DashboardLayout (sidebar, header, profile modal)
        └── providers/      # QueryProvider (TanStack React Query v5)
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite | Type-safe SPA with hot reload |
| **State** | Zustand + TanStack React Query v5 | Client state (auth/theme) + server cache |
| **Styling** | TailwindCSS, shadcn/ui, Framer Motion | Responsive UI with animations |
| **Charts** | Recharts | Order status bar chart |
| **Map** | react-leaflet + CartoDB Dark Matter | Warehouse location visualization |
| **Forms** | React Hook Form + Zod | Validated forms throughout |
| **Backend** | Django 5.2, DRF | REST API, RBAC, ORM |
| **Database** | PostgreSQL | Primary data store |
| **Cache/Queue** | Redis | Caching, sessions, Celery broker |
| **Async Tasks** | Celery 5.4 + django-celery-beat | Background jobs, scheduled tasks |
| **Task Results** | django-celery-results | Task result storage in PostgreSQL |
| **Storage** | AWS S3 / Boto3 | Production media & static files |

---

## 🚀 Installation & Setup

### Prerequisites

- Python 3.11+, Node.js 18+, npm
- PostgreSQL 14+
- Redis (broker for Celery and Django caching)

---

### 1. Backend Setup

```bash
cd Inventory_management_backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # macOS/Linux
# venv\Scripts\activate           # Windows

pip install -r requirements.txt
```

Create the PostgreSQL database:

```sql
CREATE DATABASE inventory_management_db;
```

Configure environment variables:

```bash
cp .env.example .env
```

Key variables in `.env`:

```env
SECRET_KEY=your-secure-secret-key
DEBUG=True
ALLOWED_HOST=127.0.0.1,localhost

DATABASE_NAME=inventory_management_db
DATABASE_USER=your_postgres_user
DATABASE_PASSWORD=your_postgres_password
DATABASE_HOST=localhost
DATABASE_PORT=5432

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

USE_S3=False
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=
```

Apply migrations and create a superuser:

```bash
python manage.py migrate
python manage.py createsuperuser
```

(Optional) Seed product categories for existing products:

```bash
python manage.py seed_categories
```

Start the development server:

```bash
python manage.py runserver
```

---

### 2. Celery Workers (Async Tasks)

Open two additional terminals in `Inventory_management_backend/` with the venv activated:

**Worker** (processes queued tasks — CSV imports, etc.):

```bash
celery -A core worker -l info
```

**Beat scheduler** (triggers periodic tasks — hourly low-stock check):

```bash
celery -A core beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

> Both require Redis to be running. The `django-celery-results` backend stores task results in PostgreSQL (no separate result store needed).

---

### 3. Frontend Setup

```bash
cd inventory_FE
npm install
```

Create `inventory_FE/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Start the dev server:

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## 👥 Role-Based Access Control

| Role | Level | Access |
|---|---|---|
| `ADMIN` | Tier 1 | Full read/write across all resources and users |
| `MANAGER` | Tier 2 | Manage products, warehouses, inventory, order statuses |
| `STAFF` | Tier 3 | View catalog, place and view own orders, view own notifications |

### Endpoint Restrictions Summary

- **Products / Warehouses / Inventory** — `GET`: all authenticated users. `POST/PATCH/DELETE`: Manager/Admin only.
- **Orders** — `GET`: STAFF see own orders only; Manager/Admin see all. `POST`: all authenticated. `PATCH/DELETE`: Manager/Admin only.
- **Audit Logs** — Manager/Admin only.
- **Dashboard Stats** — All authenticated (STAFF get order counts scoped to their own orders; Manager/Admin get full aggregated stats).

### Registration Payload

```json
{
  "username": "manager1",
  "email": "manager@example.com",
  "name": "Akash Bera",
  "role": "MANAGER",
  "password": "test1234",
  "confirm_password": "test1234"
}
```

Role values are case-insensitive (`"manager"` normalizes to `"MANAGER"`).

---

## 📡 API Reference

All endpoints are versioned under `/api/`.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/accounts/v1/register/` | Register new user |
| POST | `/accounts/v1/login/` | Login, receive auth token |
| POST | `/accounts/v1/logout/` | Invalidate token |
| GET | `/accounts/v1/profile/` | Get current user profile |
| PATCH | `/accounts/v1/profile/` | Update profile fields |

### Products
| Method | Endpoint | Description |
|---|---|---|
| GET | `/products/v1/products/` | List products (search, filter by `is_active`/`category`, sort by `name`/`price`/`sku`) |
| POST | `/products/v1/products/` | Create product *(Manager/Admin)* |
| PATCH | `/products/v1/products/{id}/` | Update product *(Manager/Admin)* |
| DELETE | `/products/v1/products/{id}/` | Delete product *(Manager/Admin)* |
| POST | `/products/v1/products/import/` | Upload CSV for async bulk import *(Manager/Admin)* |
| GET | `/products/v1/products/import/{job_id}/status/` | Poll CSV import job progress |

### Warehouses
| Method | Endpoint | Description |
|---|---|---|
| GET | `/warehouses/v1/warehouses/` | List warehouses (includes `latitude`, `longitude`) |
| POST | `/warehouses/v1/warehouses/` | Create warehouse *(Manager/Admin)* |
| PATCH | `/warehouses/v1/warehouses/{id}/` | Update warehouse *(Manager/Admin)* |

### Inventory
| Method | Endpoint | Description |
|---|---|---|
| GET | `/inventory/v1/inventory/` | List stock records (paginated) |
| POST | `/inventory/v1/inventory/` | Add stock entry *(Manager/Admin)* |
| PATCH | `/inventory/v1/inventory/{id}/` | Adjust `quantity_available` *(Manager/Admin)* |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| GET | `/orders/v1/orders/` | List orders (scoped by role) |
| POST | `/orders/v1/orders/` | Place order (deducts inventory atomically) |
| PATCH | `/orders/v1/orders/{id}/` | Update order status *(Manager/Admin)* |

### Notifications & Audit Logs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications/v1/notifications/` | User notifications |
| GET | `/audit_logs/v1/auditlogs/` | Audit trail *(Manager/Admin)* |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard/v1/stats/` | Aggregated stats: active orders, revenue, low-stock count, warehouse count, order status breakdown |

---

## ⚙️ Async Tasks (Celery)

### Low-Stock Alert (Scheduled)

Runs every hour via Celery Beat. Queries all inventory records with `quantity_available ≤ 10` and creates a `Notification` for every `ADMIN`/`MANAGER` user. Deduplicates — skips items that already triggered a notification in the last 24 hours.

### CSV Product Import (On-demand)

Triggered via `POST /products/v1/products/import/`. The view saves the uploaded file to a temp path, creates a `CSVImportJob` record, then dispatches `import_products_from_csv.delay(job_id)`.

The task:
1. Parses CSV rows (`name`, `sku`, `price`, `weight`, `description` columns)
2. Upserts products by SKU (creates or updates)
3. Increments `CSVImportJob.processed_rows` after each row for live progress tracking
4. Sets job status to `completed` or `failed` with per-row error details

Frontend polls `/products/v1/products/import/{job_id}/status/` every 2 seconds and displays a progress bar until the job finishes.

---

## 🗺️ Warehouse Map

Warehouses support optional `latitude` and `longitude` fields. When set, a marker appears on the dark-themed interactive map (CartoDB Dark Matter tile layer, no API key required) rendered above the warehouses table. The map auto-fits bounds to all markers.

---

## 🎨 Frontend Pages

| Page | Features |
|---|---|
| **Dashboard** | Stat cards (active orders, revenue, low stock, warehouses), order status bar chart, recent notifications, low-stock items table — all from a single aggregated API call |
| **Products** | Filter by status/category, sort by name/price/SKU, search with debounce, per-row view dialog, edit dialog, CSV import with progress |
| **Warehouses** | Dark map with markers, coordinates column, create/edit with lat/lng inputs |
| **Inventory** | Products-in-stock and active-warehouses summary cards, stock adjustment dialog |
| **Orders** | Status filter, update status dialog with inline error display |
| **Audit Logs** | Color-coded status pills (pending=yellow, confirmed=green, completed=blue, cancelled=red) |
| **Profile** | Click avatar in header → modal with read/edit mode for name, date of birth, address |

---

## 🧪 API Testing

A complete Postman collection is available at:

```
Inventory_management_backend/docs/inventory_management.postman_collection.json
```

Import it into Postman to test all endpoints with pre-configured requests grouped by resource.

---

## ☁️ AWS S3 (Production)

Set `USE_S3=True` in `.env` and provide AWS credentials. Then run:

```bash
python manage.py collectstatic --noinput
```

Required IAM permissions on the bucket:
- `s3:ListBucket`, `s3:GetBucketLocation` on the bucket ARN
- `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, `s3:HeadObject` on `bucket/*`
