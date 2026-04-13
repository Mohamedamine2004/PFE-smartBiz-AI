# 🐳 Docker Setup for SmartBiz AI

This guide explains how to run the entire SmartBiz AI application using Docker.

## 📋 Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)

## 🚀 Quick Start

### 1️⃣ First Time Setup

```bash
# Navigate to project root
cd PFE-smartBiz-AI

# Copy environment files
copy apps\backend\.env.example apps\backend\.env
copy apps\frontend\.env.example apps\frontend\.env.local

# Edit the .env files with your configuration (especially email settings)
notepad apps\backend\.env
```

### 2️⃣ Start All Services

```bash
# Build and start all containers
docker-compose up -d

# Check if everything is running
docker-compose ps
```

### 3️⃣ Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | React Application |
| **Backend API** | http://localhost:3000/api/v1 | NestJS REST API |
| **ML Engine** | http://localhost:8000/docs | FastAPI + Swagger UI |
| **PostgreSQL** | localhost:5432 | Database |

### 4️⃣ Initialize Database (First Time Only)

```bash
# Run Prisma migrations
docker-compose exec backend npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view/edit data
docker-compose exec backend npm run studio
# Access at: http://localhost:5555
```

## 🔧 Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f ml-engine
```

### Stop Services

```bash
# Stop all containers (keep data)
docker-compose stop

# Stop and remove containers (keep volumes)
docker-compose down
```

### Complete Cleanup

```bash
# Stop everything and remove volumes (DELETES ALL DATA)
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

### Restart a Single Service

```bash
docker-compose restart backend
```

### Rebuild After Code Changes

```bash
# Rebuild specific container
docker-compose build backend
docker-compose up -d backend

# Or rebuild everything
docker-compose build
docker-compose up -d
```

## 📦 Architecture

```
┌─────────────────────────────────────────────┐
│           Docker Network                    │
│                                             │
│  ┌──────────────┐    ┌───────────────┐     │
│  │   Frontend   │───>│    Backend    │     │
│  │  (React)     │    │   (NestJS)    │     │
│  │  :5173       │    │    :3000      │     │
│  └──────────────┘    └───────┬───────┘     │
│                               │             │
│                        ┌──────┴───────┐     │
│                        │   PostgreSQL │     │
│                        │    :5432     │     │
│                        └──────────────┘     │
│                               ▲             │
│  ┌──────────────┐    ┌───────┴───────┐     │
│  │  ML Engine   │<───│   Backend     │     │
│  │  (Python)    │    │   (Proxy)     │     │
│  │   :8000      │    │               │     │
│  └──────────────┘    └───────────────┘     │
│                                             │
└─────────────────────────────────────────────┘
```

## 🔐 Security Notes

**⚠️ IMPORTANT FOR PRODUCTION:**

1. **Change default passwords** in `docker-compose.yml`:
   - `POSTGRES_PASSWORD`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`

2. **Use `.env` files** instead of hardcoding values in docker-compose.yml

3. **Never commit** `.env` files to Git (already in `.gitignore`)

4. **For production**, use:
   ```yaml
   # docker-compose.prod.yml
   version: '3.8'
   services:
     backend:
       build:
         context: ./apps/backend
         dockerfile: Dockerfile  # Not Dockerfile.dev
   ```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is healthy
docker-compose ps

# Wait for PostgreSQL to be ready (check health)
docker-compose logs postgres

# Restart backend after database is ready
docker-compose restart backend
```

### Port Already in Use

If ports 3000, 5173, 5432, or 8000 are already in use:

```bash
# Edit docker-compose.yml and change the port mapping
# Example: Change "3000:3000" to "3001:3000"
```

### Prisma Client Not Generated

```bash
docker-compose exec backend npx prisma generate
docker-compose restart backend
```

### Hot Reload Not Working

Ensure volumes are mounted correctly in `docker-compose.yml`:
```yaml
volumes:
  - ./apps/backend:/usr/src/app
```

### Clear All Data and Start Fresh

```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend npx prisma migrate dev --name init
```

## 🔍 Development Workflow

### Making Changes to Backend

1. Edit files in `apps/backend/src/`
2. NestJS auto-reloads (hot-reload enabled)
3. Changes reflected immediately

### Making Changes to Frontend

1. Edit files in `apps/frontend/src/`
2. Vite HMR (Hot Module Replacement) updates instantly
3. Changes reflected immediately

### Making Changes to Database Schema

```bash
# Edit prisma/schema.prisma
docker-compose exec backend npx prisma migrate dev --name your_migration_name
docker-compose exec backend npx prisma generate
```

## 📊 Monitoring

```bash
# View resource usage
docker stats

# View specific container
docker stats smartbiz-backend
```

## 🧪 Testing

```bash
# Run backend tests
docker-compose exec backend npm test

# Run frontend build
docker-compose exec frontend npm run build
```

## 📝 Environment Variables

### Backend (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://smartbiz_user:smartbiz_password@postgres:5432/smartbiz_db` |
| `JWT_SECRET` | Secret for JWT access tokens | (change this!) |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | (change this!) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `MAIL_HOST` | SMTP server host | `smtp.mailtrap.io` |
| `MAIL_PORT` | SMTP server port | `2525` |
| `MAIL_USER` | SMTP username | (your mailtrap user) |
| `MAIL_PASS` | SMTP password | (your mailtrap password) |
| `MAIL_FROM` | Sender email | `noreply@smartbiz.ai` |

### Frontend (`.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000/api/v1` |

## 🎯 Next Steps

1. ✅ Start all services with `docker-compose up -d`
2. ✅ Run database migrations
3. ✅ Access frontend at http://localhost:5173
4. ✅ Create your first account and company
5. ✅ Start importing financial data!

---

**Need Help?** Check the main README.md or create an issue in the repository.
