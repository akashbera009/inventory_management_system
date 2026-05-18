# Inventory Management System

A production-ready Inventory Management System built with Django and Django REST Framework, featuring pre-configured settings for AWS S3, PostgreSQL, Redis, CORS, and comprehensive security features.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
  - [1. Virtual Environment Setup](#1-virtual-environment-setup)
  - [2. Database Setup (PostgreSQL)](#2-database-setup-postgresql)
  - [3. Redis Setup](#3-redis-setup)
  - [4. Environment Variables Configuration](#4-environment-variables-configuration)
  - [5. Database Migrations](#5-database-migrations)
  - [6. Running the Development Server](#6-running-the-development-server)
- [API Overview](#api-overview)
- [Project Structure](#project-structure)
- [AWS S3 Configuration](#aws-s3-configuration)

## Prerequisites
Before you begin, ensure you have the following installed:
- Python 3.11+
- PostgreSQL
- Redis
- AWS Account (for S3 storage)
- Postman (optional, for testing APIs)

## Installation & Setup

### 1. Virtual Environment Setup
First, clone the repository and navigate into the project directory:
```bash
git clone https://github.com/parikshitrathore/Python-Next-Leap.git Inventory_management_backend

cd Inventory_management_backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

Install the required dependencies:
```bash
pip install -r requirements.txt
```

### 2. Database Setup (PostgreSQL)
Ensure PostgreSQL is running on your system. Create a new database for the project:
```bash
/opt/homebrew/opt/postgresql@17/bin/psql postgres
```
```sql
CREATE DATABASE inventory_management_db;
```

You can also use the PostgreSQL shell (`psql`):
```bash
createdb inventory_management_db
```

### 3. Redis Setup
Redis is used for caching and rate limiting.
- **macOS (via Homebrew):**
  ```bash
  brew install redis
  brew services start redis
  ```
- **Linux (Ubuntu/Debian):**
  ```bash
  sudo apt-get install redis-server
  sudo systemctl start redis-server
  ```
- **Windows:** Use WSL2 or download the latest MSI from the Redis GitHub page.

### 4. Environment Variables Configuration
Copy the template `.env.example` to a new `.env` file:
```bash
cp .env.example .env
```
Open `.env` and fill in your credentials:
```plaintext
# Core
SECRET_KEY=your-secure-secret-key
DEBUG=True
ALLOWED_HOST=127.0.0.1,localhost

# Database
DATABASE_NAME=inventory_management_db
DATABASE_USER=your_postgres_user
DATABASE_PASSWORD=your_postgres_password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# AWS S3
USE_S3=False  # Set to True for production
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=your-bucket
AWS_S3_REGION_NAME=your-region

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

### 5. Database Migrations
Apply the initial migrations to set up your database schema:
```bash
python manage.py migrate
```
Create an administrative user to access the Django Admin:
```bash
python manage.py createsuperuser
```

### 6. Running the Development Server
Start the development server:
```bash
python manage.py runserver
```
The API will be available at `http://127.0.0.1:8000/`.

---

## API Overview

The project uses versioned APIs (v1) accessible under the `/api/` prefix.

### Authentication
- `POST /api/accounts/v1/register/` - Register a new user (supports optional `role` field)
- `POST /api/accounts/v1/login/` - Login and receive Auth Token
- `POST /api/accounts/v1/logout/` - Invalidate current token

### Products
- `GET /api/products/v1/products/` - List all products (supports search/filter)
- `POST /api/products/v1/products/` - Create a new product (Manager/Admin only)
- `GET /api/products/v1/products/{id}/` - Retrieve product details
- `PATCH /api/products/v1/products/{id}/` - Update product information (Manager/Admin only)

### Orders
- `GET /api/orders/v1/orders/` - List orders (Standard/Staff see only their own; Manager/Admin see all)
- `POST /api/orders/v1/orders/` - Place a new order (handles inventory deduction)
- `GET /api/orders/v1/orders/{id}/` - Retrieve order status and items
- `PATCH /api/orders/v1/orders/{id}/` - Update order status (Manager/Admin only)

### Notifications & Logs
- `GET /api/notifications/v1/notifications/` - View user notifications
- `GET /api/audit_logs/v1/auditlogs/` - View system audit logs (Manager/Admin only)

---

## Role-Based Access Control (RBAC)

The system features three distinct roles (`ADMIN`, `MANAGER`, `STAFF`) to govern data modification and resource visibility:

| Role | Description | Permissions Summary |
|---|---|---|
| **Admin** | System administrator with global control. | Full read/write access across all resources & users. |
| **Manager** | Warehouse/inventory coordinator. | Manage products, warehouses, inventories, and order statuses. |
| **Staff** | Warehouse operators / sales agents. | View catalogs, view/place their own orders, and view own notifications. |

### Enforcing Roles at the API Level
API authorization is enforced using custom Django REST Framework permission classes:
1. **`IsAdminUserRole`**: Grants access only if the authenticated user has the `ADMIN` role.
2. **`IsManagerOrAdmin`**: Grants access if the authenticated user has the `MANAGER` or `ADMIN` role.

### Summary of Endpoint Restrictions

* **Products, Warehouses, & Inventory APIs**:
  - `GET` (List/Retrieve): Permitted for all authenticated users (including `STAFF`).
  - `POST`, `PUT`, `PATCH`, `DELETE` (Mutations): Strictly restricted to `IsManagerOrAdmin`.
* **Orders API**:
  - `GET` (List/Retrieve): Scoped to own orders for `STAFF`. Expanded to returning **all system orders** for `MANAGER` or `ADMIN`.
  - `POST` (Creation): Permitted for all authenticated users.
  - `PUT`, `PATCH`, `DELETE` (Mutations): Strictly restricted to `IsManagerOrAdmin` (e.g. updating order statuses).
* **Audit Logs API**:
  - Complete endpoint is restricted via `IsManagerOrAdmin`. Standard staff members cannot view system activity logs.

### Role Registration Payload
When registering a new user, you can optionally supply a `role`. The backend includes case-insensitive normalization (e.g. `"Manager"` or `"manager"` automatically normalizes to `"MANAGER"`):
```json
{
    "username": "manager1",
    "email": "manager@example.com",
    "name": "Akash Bera",
    "role": "Manager",
    "password": "test1234",
    "confirm_password": "test1234"
}
```

---

## Project Structure
```
├── accounts/          # User management & Profiles
├── products/          # Product catalog & pricing
├── warehouses/        # Warehouse locations & capacity
├── inventory/         # Stock management & allocation
├── orders/            # Order processing & history
├── notifications/     # User alerts & messages
├── audit_logs/        # System activity tracking
├── core/              # Global settings & configuration
├── base/              # Common utilities & base models
├── static/            # Static assets
└── manage.py          # Django management script
```

## Postman Collection

A complete Postman collection is provided in the `docs/` folder to help you test all available API endpoints.

- **File**: `docs/inventory_management.postman_collection.json`
- **Instructions**:
  1. Open Postman.
  2. Click on **Import**.
  3. Select the file from the `docs/` folder.
  4. You will find grouped requests for Products, Orders, Inventory, and Authentication.

---

## AWS S3 Configuration

1. Create an S3 bucket in AWS Console
2. Configure IAM user with the following S3 permissions:
   - `s3:ListBucket` / `s3:GetBucketLocation` on the bucket ARN
   - `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, `s3:HeadObject` on `bucket/*`
3. Update `.env` with AWS credentials
4. Run collectstatic to upload static files directly to S3:
```bash
python manage.py collectstatic --noinput
```

---



# use if postgis is not running 
brew services list

brew services start postgresql@17
