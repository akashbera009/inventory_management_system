# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Enterprise Inventory Management System (EIMS) — a full-stack monorepo with a Django REST API backend and a React + TypeScript frontend.

## Repository Structure

```
/
├── Inventory_management_backend/   # Django 5.2 API
└── inventory_FE/                   # React 19 + Vite frontend
```

## Backend Commands

All commands run from `Inventory_management_backend/`:

```bash
python manage.py runserver          # Dev server on :8000
python manage.py migrate            # Apply DB migrations
python manage.py makemigrations     # Generate migrations
python manage.py createsuperuser    # Create admin user
python manage.py collectstatic      # Upload statics to S3
```

**Prerequisites:** PostgreSQL and Redis must be running. Copy `.env.example` → `.env` and fill in credentials.

## Frontend Commands

All commands run from `inventory_FE/`:

```bash
npm run dev       # Vite dev server on :5173
npm run build     # Type-check + production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

**Environment:** Set `VITE_API_BASE_URL=http://127.0.0.1:8000/api` in `inventory_FE/.env`.

## Backend Architecture

**Apps and responsibilities:**
- `accounts/` — Custom `User` model (extends `AbstractUser`), registration, login, logout, profile. Role field: `ADMIN | MANAGER | STAFF`.
- `products/` — Product catalog and pricing.
- `warehouses/` — Warehouse locations and capacity.
- `inventory/` — Stock records and allocation logic.
- `orders/` — Order lifecycle and inventory reconciliation.
- `notifications/` — Per-user alerts.
- `audit_logs/` — Immutable activity trail (Manager/Admin only).
- `base/` — Shared mixins, base model classes, and utilities used across all apps.

**All API endpoints are versioned under `/api/v1/`.**

**Auth:** DRF `TokenAuthentication`. Token is returned on login and must be sent as `Authorization: Token <token>`.

**Permissions:** Custom permission classes enforce RBAC at the view level. Three roles: `ADMIN > MANAGER > STAFF`. Audit logs require `ADMIN` or `MANAGER`.

**Rate limiting:** Anonymous: 100 req/day; Authenticated: 1000 req/day (configured in `core/settings.py`).

**Caching/Sessions:** Redis on `localhost:6379` (configured via `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB` env vars).

**Storage:** In `DEBUG=True`, media/static files use local filesystem. In production, AWS S3 is used (`USE_S3=True`).

## Frontend Architecture

**State management split:**
- **Zustand** (`src/store/`) — Client-side persistent state: auth token/user/role (`authStore`), UI theme (`themeStore`). Persisted to `localStorage`.
- **TanStack React Query v5** (`src/providers/QueryProvider.tsx`) — All server state. Mutations invalidate relevant query keys.

**Axios client** (`src/api/axios.ts`) — Automatically attaches `Authorization: Token <token>` from the Zustand auth store on every request.

**Feature organization** (`src/features/`): Each domain (auth, products, orders, inventory, warehouses, notifications, auditLogs) contains its own hooks, API calls, and types. Page components in `src/pages/` consume these features.

**Route protection:**
- `ProtectedRoute` — Redirects unauthenticated users to `/login`.
- `RoleRoute` — Wraps routes that require specific roles (e.g., audit logs restricted to ADMIN/MANAGER).

**Form pattern:** React Hook Form + Zod schemas for validation throughout.

**UI:** TailwindCSS + shadcn components + Lucide icons + Framer Motion animations + Recharts for dashboard charts.

## API Reference

A Postman collection is available at `Inventory_management_backend/docs/inventory_management.postman_collection.json`.

Key endpoint groups:
- `/api/v1/accounts/` — Auth (register, login, logout, profile)
- `/api/v1/products/products/` — Product CRUD
- `/api/v1/orders/orders/` — Order CRUD
- `/api/v1/warehouses/warehouses/` — Warehouse CRUD
- `/api/v1/inventory/inventory/` — Stock records
- `/api/v1/notifications/notifications/` — User notifications
- `/api/v1/audit_logs/auditlogs/` — Audit trail (Manager/Admin only)
