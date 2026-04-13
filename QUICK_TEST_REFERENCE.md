# 🚀 SmartBiz AI - Quick Testing Reference Card

## 📌 Quick Start (Copy-Paste Commands)

### 1. Start Everything
```bash
docker-compose up -d
# Wait 15 seconds...

# Initialize database (first time only)
docker-compose exec backend npx prisma migrate dev --name init

# Open Prisma Studio (optional)
docker-compose exec backend npm run studio
```

### 2. URLs to Bookmark
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api/v1 |
| Prisma Studio | http://localhost:5555 |
| ML Engine Swagger | http://localhost:8000/docs |

---

## 🧪 Test Data Templates

### Test Account Credentials
```
Email: admin@test.com
Password: Admin123456!
Role: ADMIN
Company: TestCorp SARL
Tax ID: 1234567/A/B/001
```

### Excel Import Data
Create file `test_data.xlsx` with these 3 sheets:

**Sheet 1: "CashFlow"**
| Period | Revenue | Expenses | NetIncome |
|--------|---------|----------|-----------|
| 2025-01 | 100000 | 80000 | 20000 |
| 2025-02 | 110000 | 85000 | 25000 |
| 2025-03 | 120000 | 90000 | 30000 |
| 2025-04 | 115000 | 88000 | 27000 |
| 2025-05 | 130000 | 95000 | 35000 |
| 2025-06 | 140000 | 100000 | 40000 |

**Sheet 2: "StrategicKPIs"**
| Metric | Value |
|--------|-------|
| CAC | 3000 |
| LTV | 15000 |
| TAM | 25000000 |
| MarketShare | 1.8 |
| EmployeeCount | 25 |

**Sheet 3: "AnnualData"** (optional)
| Year | Revenue | EBITDA |
|------|---------|--------|
| 2024 | 1200000 | 350000 |
| 2025 | 1400000 | 420000 |

---

## 🔑 API Testing Quick Commands

### Login & Get Token
```bash
# Windows CMD
curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@test.com\",\"password\":\"Admin123456!\"}"

# PowerShell
$headers = @{"Content-Type"="application/json"}
$body = @{email="admin@test.com"; password="Admin123456!"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method Post -Headers $headers -Body $body

# Copy the access_token from response
```

### Test Protected Route
```bash
curl -X GET http://localhost:3000/api/v1/auth/me -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Calculate Valuation
```bash
curl -X POST http://localhost:3000/api/v1/valuation/calculate -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d "{\"method\":\"ev_ebitda\",\"inputs\":{\"ebitda\":500000,\"multiple\":6.5,\"netDebt\":200000}}"
```

### Get Dashboard Metrics
```bash
curl -X GET http://localhost:3000/api/v1/financial/dashboard-metrics -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Import History
```bash
curl -X GET http://localhost:3000/api/v1/financial/imports -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 Testing Flow (Step-by-Step)

### Session 1: Authentication (15 min)
1. [ ] Register new account
2. [ ] Verify in Prisma Studio
3. [ ] Login
4. [ ] Check localStorage for token
5. [ ] Logout and verify redirect to login

### Session 2: Team Management (10 min)
1. [ ] Go to /team
2. [ ] Invite user with role USER
3. [ ] Invite user with role READER
4. [ ] Verify in Prisma Studio
5. [ ] Try to delete a member

### Session 3: Valuation (10 min)
1. [ ] Go to /valuation
2. [ ] Calculate EV/EBITDA (EBITDA: 500000, Multiple: 6.5, Net Debt: 200000)
3. [ ] Calculate DCF (FCF: 300000, Growth: 5%, WACC: 10%)
4. [ ] Save both valuations
5. [ ] View history panel

### Session 4: Import & Dashboard (15 min)
1. [ ] Download Excel template
2. [ ] Fill with test data (see template above)
3. [ ] Import to /import
4. [ ] Verify success message
5. [ ] Go to /dashboard
6. [ ] Verify charts and KPIs display
7. [ ] Import second file with different data
8. [ ] Test import history switch
9. [ ] Test import deletion

### Session 5: UI Features (5 min)
1. [ ] Toggle theme (light/dark)
2. [ ] Switch to Arabic (verify RTL)
3. [ ] Switch back to English
4. [ ] Refresh page - verify persistence

---

## 🔍 Quick Database Checks

### Prisma Studio Queries
Open: http://localhost:5555

**After Registration:**
- Company table → Should have 1 row
- User table → Should have 1 row (ADMIN)

**After Team Invites:**
- User table → Should have 3 rows (ADMIN + USER + READER)

**After Excel Import:**
- ImportBatch table → Should have 1 row per import
- FinancialData table → Should have ~30 rows (6 metrics × 6 months)

**After Valuation Save:**
- SavedValuation table → Should have 1 row per saved valuation

---

## ⚡ Common Scenarios

### Scenario 1: Test Complete User Journey
```
1. Register → Login → Import Data → View Dashboard → Calculate Valuation → Save
```

### Scenario 2: Test Role-Based Access
```
1. Create READER user → Login as READER → Try to import (should fail 403)
2. Try to view dashboard (should succeed 200)
```

### Scenario 3: Test Import History
```
1. Import file A → Import file B → Import file C
2. Switch to file A → Verify dashboard shows old data
3. Delete file B → Verify it's removed
```

### Scenario 4: Test Valuation Methods
```
1. Calculate EV/EBITDA → Save
2. Calculate DCF → Save
3. Calculate Gordon Growth → Save
4. Compare all 3 in history
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't login | Check password (min 8 chars), verify email |
| 401 Unauthorized | Token expired, login again |
| 403 Forbidden | Check user role in Prisma Studio |
| Import fails | Check Excel sheet names (case-sensitive) |
| Charts not showing | Verify data imported successfully |
| Database error | Wait for PostgreSQL health check |
| Port already in use | Change port in docker-compose.yml |

---

## 📊 Expected Results

### After Complete Setup:
```
Database:
  Companies: 1
  Users: 3 (ADMIN, USER, READER)
  ImportBatches: 2-3
  FinancialData: ~60-90 rows
  SavedValuations: 2-3

Frontend:
  Dashboard loads with charts
  KPI cards show correct values
  Theme toggle works
  Language switching works

Backend:
  All API endpoints respond
  JWT authentication works
  Role-based access enforced
```

---

## 💡 Pro Tips

1. **Use Prisma Studio** to verify database state at any time
2. **Check browser DevTools Console** for frontend errors
3. **Check Network tab** to see API requests/responses
4. **Use Docker logs** for backend debugging: `docker-compose logs backend`
5. **Save test Excel files** for repeated testing
6. **Take screenshots** of successful tests for documentation

---

**Full Testing Time: ~55 minutes**
**Quick Smoke Test: ~15 minutes**
