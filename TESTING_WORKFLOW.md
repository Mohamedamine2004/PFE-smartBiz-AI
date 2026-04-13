# 🧪 SmartBiz AI - Complete Testing Workflow

This guide shows you **exactly what to test** and **how to test it**, step by step.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Authentication System](#phase-1-authentication-system)
3. [Phase 2: Team Management](#phase-2-team-management)
4. [Phase 3: Company Valuation](#phase-3-company-valuation)
5. [Phase 4: Financial Data Import](#phase-4-financial-data-import)
6. [Phase 5: Dashboard & Analytics](#phase-5-dashboard--analytics)
7. [Phase 6: User Interface Features](#phase-6-user-interface-features)
8. [Phase 7: API Testing with Postman/cURL](#phase-7-api-testing)
9. [Testing Checklist](#testing-checklist)

---

## ⚙️ Prerequisites

### Before You Start:

```bash
# 1. Start all Docker containers
docker-compose up -d

# 2. Wait 15 seconds for services to be ready
# Check status:
docker-compose ps

# 3. Run database migrations (first time only)
docker-compose exec backend npx prisma migrate dev --name init

# 4. Verify services are running:
curl http://localhost:5173  # Frontend
curl http://localhost:3000/api/v1  # Backend (should return 404 - no route at root)
curl http://localhost:8000/docs  # ML Engine Swagger UI

# 5. Open your browser
# Frontend: http://localhost:5173
```

---

## Phase 1: Authentication System

### 🎯 What to Test:
- User registration with company creation
- Email verification (can skip with Mailtrap not configured)
- Login with JWT tokens
- Password reset flow
- Token refresh mechanism
- Session management

### Test 1.1: Register a New Account

**Steps:**
1. Open http://localhost:5173
2. Click **"Register"** or go to `/register`
3. Fill in the form:
   ```
   First Name: John
   Last Name: Doe
   Company Name: TestCorp SARL
   Tax ID (Matricule Fiscal): 1234567/A/B/001
   Email: john@testcorp.com
   Password: Test123456!
   Confirm Password: Test123456!
   ```
4. Click **"Create Account"**

**Expected Result:**
- ✅ Success message: "Account created. Check your email."
- ✅ User and Company created in database
- ✅ Redirect to login page

**Verify in Database:**
```bash
# Open Prisma Studio
docker-compose exec backend npm run studio
# Open: http://localhost:5555
# Check: 
#   - Company "TestCorp SARL" exists
#   - User "john@testcorp.com" exists with role ADMIN
```

### Test 1.2: Login

**Steps:**
1. Go to `/login`
2. Enter credentials:
   ```
   Email: john@testcorp.com
   Password: Test123456!
   ```
3. Click **"Login"**

**Expected Result:**
- ✅ Successful login
- ✅ Redirect to `/dashboard` or `/settings`
- ✅ Access token stored in localStorage
- ✅ Refresh token in HTTP-only cookie

**Verify:**
```javascript
// Open browser DevTools (F12) → Console
localStorage.getItem('access_token')
// Should return a JWT token
```

### Test 1.3: Forgot Password

**Steps:**
1. Go to `/login`
2. Click **"Forgot Password?"**
3. Enter email: `john@testcorp.com`
4. Click **"Send Reset Link"**

**Expected Result:**
- ✅ Message: "If this email exists, a reset link has been sent"
- ⚠️ Email won't arrive unless Mailtrap/SMTP is configured

**Alternative - Manual Password Reset (for testing):**
```bash
# In Prisma Studio (http://localhost:5555)
# 1. Find user john@testcorp.com
# 2. Note the resetPasswordToken (if generated)
# 3. Or manually set a new password hash
```

### Test 1.4: Profile Access (Protected Route)

**After Login:**
```bash
# Check browser DevTools → Network tab
# You should see GET request to /api/v1/auth/me
# Response should contain:
{
  "message": "Accès autorisé à la route protégée",
  "user": {
    "userId": "...",
    "email": "john@testcorp.com",
    "role": "ADMIN",
    "companyId": "..."
  }
}
```

### Test 1.5: Logout & Session Management

**Steps:**
1. Click **Logout** button (if available)
2. Try accessing `/dashboard`

**Expected Result:**
- ✅ Redirected to `/login`
- ✅ localStorage cleared
- ✅ Cannot access protected routes

---

## Phase 2: Team Management

### 🎯 What to Test:
- Invite team members (ADMIN only)
- Accept invitation
- View team list
- Delete team members
- Role-based access control

### Test 2.1: Invite Team Member

**Prerequisites:**
- Logged in as ADMIN
- Go to `/team` or click **"Team"** in sidebar

**Steps:**
1. Click **"Invite Member"**
2. Fill form:
   ```
   Email: alice@testcorp.com
   Role: USER
   ```
3. Click **"Send Invitation"**

**Expected Result:**
- ✅ Success message: "Invitation sent successfully"
- ✅ Team member appears in list with status "Pending"
- ⚠️ Invitation email won't arrive without SMTP

**Verify in Database (Prisma Studio):**
```
- User "alice@testcorp.com" created
- inviteToken is set
- inviteTokenExpires is 7 days from now
- role: USER
```

### Test 2.2: Accept Invitation

**Steps:**
1. Get the invite token from database (Prisma Studio)
   ```
   User → alice@testcorp.com → inviteToken: "abc123..."
   ```
2. Open in browser:
   ```
   http://localhost:5173/accept-invite?token=abc123...
   ```
3. Fill form:
   ```
   First Name: Alice
   Last Name: Smith
   Password: Alice123456!
   Confirm Password: Alice123456!
   ```
4. Click **"Activate Account"**

**Expected Result:**
- ✅ Account activated
- ✅ Redirected to login
- ✅ Can login with new credentials

### Test 2.3: View Team List

**As ADMIN:**
1. Go to `/team`
2. Verify you see:
   - Yourself (ADMIN)
   - Alice (USER) - if accepted invitation

**Expected Result:**
- ✅ Table shows all team members
- ✅ Displays: Name, Email, Role, Status
- ✅ Delete button visible for non-admin members

### Test 2.4: Delete Team Member

**As ADMIN:**
1. Go to `/team`
2. Find a team member
3. Click **"Delete"**
4. Confirm deletion

**Expected Result:**
- ✅ Member removed from list
- ✅ Soft delete in database (deletedAt set)
- ✅ Member can no longer login

### Test 2.5: Role-Based Access (READER)

**Create a READER user:**
1. Invite: `bob@testcorp.com` with role **READER**
2. Accept invitation and login as Bob
3. Try to access `/team`

**Expected Result:**
- ✅ Bob CANNOT access team management
- ✅ Bob CAN view dashboard (READER has read access)
- ✅ Bob CANNOT import data

---

## Phase 3: Company Valuation

### 🎯 What to Test:
- DCF (Discounted Cash Flow) method
- EV/EBITDA Multiples method
- Gordon Growth Model
- Real-time calculation
- Save valuation history
- Compare multiple valuations

### Test 3.1: EV/EBITDA Multiples Valuation

**Steps:**
1. Login as ADMIN or USER
2. Go to `/valuation` or click **"Valuation"** in sidebar
3. Select method: **"EV / EBITDA"**
4. Fill in:
   ```
   EBITDA: 500000
   Multiple: 6.5
   Net Debt: 200000
   ```
5. Watch real-time calculation

**Expected Result:**
```
Enterprise Value = EBITDA × Multiple
                 = 500,000 × 6.5
                 = 3,250,000 €

Equity Value = Enterprise Value - Net Debt
             = 3,250,000 - 200,000
             = 3,050,000 €
```

**UI Should Show:**
- ✅ Formula displayed
- ✅ Explanation text
- ✅ Results with currency formatting
- ✅ "Save" button enabled

### Test 3.2: DCF (Discounted Cash Flow) Valuation

**Steps:**
1. Select method: **"DCF"**
2. Fill in:
   ```
   Free Cash Flow (Year 1): 300000
   Growth Rate (%): 5
   WACC (%): 10
   Terminal Growth Rate (%): 2
   Net Debt: 150000
   ```
3. Observe calculation

**Expected Result:**
```
Terminal Value = FCF × (1 + g) / (WACC - g)
               = 300,000 × 1.05 / (0.10 - 0.02)
               = 315,000 / 0.08
               = 3,937,500 €

Enterprise Value ≈ 3,937,500 €
Equity Value = 3,937,500 - 150,000 = 3,787,500 €
```

**Validation Test:**
- Try entering `Growth Rate >= WACC` (e.g., both 10%)
- ✅ Should show error: "WACC must be greater than growth rate"

### Test 3.3: Save Valuation

**Steps:**
1. After calculating a valuation
2. Enter optional label: "Q1 2026 Valuation"
3. Click **"Save"**

**Expected Result:**
- ✅ Success message
- ✅ Valuation appears in history panel
- ✅ Can view details later

### Test 3.4: View Valuation History

**Steps:**
1. Save 2-3 different valuations
2. Check **"History"** panel on the right

**Expected Result:**
- ✅ List shows all saved valuations
- ✅ Displays: Date, Method, Label, Enterprise Value
- ✅ Can click to view details
- ✅ Can delete old valuations

### Test 3.5: Compare Multiple Valuations

**Steps:**
1. Go to valuation history
2. Select 2 valuations
3. Click **"Compare"** (if available)

**Expected Result:**
- ✅ Side-by-side comparison view
- ✅ Shows differences in methods and results

---

## Phase 4: Financial Data Import

### 🎯 What to Test:
- Download Excel template
- Import financial data via Excel
- Validation of required sheets
- Import history management
- Revert to previous import
- Delete imports

### Test 4.1: Download Excel Template

**Steps:**
1. Go to `/import` or click **"Import Data"** in sidebar
2. Click **"Download Template"**
3. Save the file

**Expected Result:**
- ✅ File downloads: `SmartBiz_Financial_Template.xlsx`
- ✅ File contains 3 sheets:
  - `CashFlow` - Monthly financial metrics
  - `StrategicKPIs` - CAC, LTV, TAM, etc.
  - `AnnualData` - Yearly valuation data

### Test 4.2: Prepare Test Data

**Create an Excel file with this structure:**

**Sheet 1: CashFlow** (Monthly data)
| Period | Revenue | Expenses | NetIncome | OperatingCashFlow |
|--------|---------|----------|-----------|-------------------|
| 2025-01 | 150000 | 120000 | 30000 | 35000 |
| 2025-02 | 165000 | 125000 | 40000 | 42000 |
| 2025-03 | 180000 | 130000 | 50000 | 48000 |
| 2025-04 | 175000 | 128000 | 47000 | 50000 |
| 2025-05 | 190000 | 135000 | 55000 | 57000 |
| 2025-06 | 200000 | 140000 | 60000 | 62000 |

**Sheet 2: StrategicKPIs**
| Metric | Value |
|--------|-------|
| CAC | 5000 |
| LTV | 25000 |
| TAM | 50000000 |
| MarketShare | 2.5 |
| EmployeeCount | 45 |

**Sheet 3: AnnualData** (Optional, for valuation)
| Year | Revenue | EBITDA | TotalAssets |
|------|---------|--------|-------------|
| 2024 | 1800000 | 500000 | 2500000 |
| 2025 | 2100000 | 600000 | 2800000 |

Save as: `test_financial_data.xlsx`

### Test 4.3: Import Excel File

**Steps:**
1. Go to `/import`
2. Click **"Choose File"** or drag & drop
3. Select `test_financial_data.xlsx`
4. Click **"Import"**

**Expected Result:**
- ✅ Upload progress indicator
- ✅ Success message: "Import successful - X rows imported"
- ✅ Shows:
  ```
  ✓ CashFlow: 6 rows
  ✓ StrategicKPIs: 5 metrics
  ✓ Import Batch ID: xxx-xxx-xxx
  ```

**Verify in Database (Prisma Studio):**
```
ImportBatch table:
  - New batch created
  - cac: 5000
  - ltv: 25000
  - tam: 50000000
  - marketShare: 2.5
  - employeeCount: 45

FinancialData table:
  - 6 rows for Revenue (one per month)
  - 6 rows for Expenses
  - 6 rows for NetIncome
  - etc.
```

### Test 4.4: Import Validation (Error Cases)

**Test 4.4.1: Missing Required Sheet**
1. Create Excel file with only 2 sheets (missing CashFlow)
2. Try to import

**Expected Result:**
- ❌ Error: "Missing required sheet: CashFlow"
- ❌ Import rejected

**Test 4.4.2: Invalid File Type**
1. Try to upload a `.csv` or `.pdf` file

**Expected Result:**
- ❌ Error: "Only Excel files (.xlsx, .xls) are accepted"

**Test 4.4.3: File Too Large**
1. Try to upload file > 10MB

**Expected Result:**
- ❌ Error: "File size exceeds 10MB limit"

### Test 4.5: Import History

**Steps:**
1. Import 2-3 different Excel files
2. Go to `/dashboard`
3. Click **"Import History"** button (clock icon or drawer)

**Expected Result:**
- ✅ Shows list of all imports
- ✅ Each import displays:
  - Date & time
  - Number of records
  - Batch ID
- ✅ Most recent import at top

### Test 4.6: Revert to Previous Import

**Steps:**
1. Open Import History drawer
2. Click on an older import
3. Confirm selection

**Expected Result:**
- ✅ Dashboard updates with old data
- ✅ Charts reflect selected import's data
- ✅ Visual indicator showing which import is active
- ✅ Can switch back to latest import

### Test 4.7: Delete Import

**Steps:**
1. Open Import History drawer
2. Find an import
3. Click **"Delete"** (trash icon)
4. Confirm deletion

**Expected Result:**
- ✅ Import removed from list
- ✅ Dashboard refreshes with remaining data
- ✅ If last import deleted, shows empty state
- ✅ All FinancialData rows deleted (cascade)

**Verify in Database:**
```
ImportBatch: Row deleted
FinancialData: All related rows deleted
```

---

## Phase 5: Dashboard & Analytics

### 🎯 What to Test:
- Revenue & Expenses charts
- Cash flow metrics
- Strategic KPI cards
- Chart interactivity
- Empty state handling

### Test 5.1: Dashboard with Data

**Prerequisites:**
- Import at least one Excel file (Phase 4)

**Steps:**
1. Go to `/dashboard`
2. Observe the dashboard

**Expected Result:**

**Charts Visible:**
- ✅ **Revenue vs Expenses** (bar/line chart by month)
- ✅ **Cash Flow Trend** (line chart)
- ✅ **Profit Margin** (percentage chart)

**KPI Cards:**
- ✅ CAC: 5,000 €
- ✅ LTV: 25,000 €
- ✅ LTV/CAC Ratio: 5.0
- ✅ TAM: 50,000,000 €
- ✅ Market Share: 2.5%
- ✅ Employee Count: 45

**Interactivity:**
- ✅ Hover over charts → tooltips appear
- ✅ Click legend → toggle data series
- ✅ Charts responsive on window resize

### Test 5.2: Empty Dashboard (No Data)

**Steps:**
1. Delete all imports (or use fresh account)
2. Go to `/dashboard`

**Expected Result:**
- ✅ Empty state message
- ✅ Text: "No financial data yet. Import your first Excel file to get started."
- ✅ Button: **"Import Data"** → redirects to `/import`

### Test 5.3: Chart Drill-Down

**Steps:**
1. Hover over a revenue bar in the chart
2. Click to see details (if implemented)

**Expected Result:**
- ✅ Tooltip shows exact value
- ✅ Shows period (e.g., "March 2025: 180,000 €")

---

## Phase 6: User Interface Features

### 🎯 What to Test:
- Light/Dark theme toggle
- Language switching (FR/EN/AR)
- RTL support for Arabic
- Responsive design
- Navigation

### Test 6.1: Theme Toggle

**Steps:**
1. Click **theme icon** (🌙/☀️) in topbar
2. Toggle between light and dark

**Expected Result:**
- ✅ Theme changes immediately
- ✅ All components adapt (sidebar, cards, charts)
- ✅ Theme persists after page refresh
- ✅ Preference saved in localStorage

**Verify:**
```javascript
// Browser console
localStorage.getItem('theme')
// Should return "dark" or "light"
```

### Test 6.2: Language Switching

**Steps:**
1. Click **language selector** (🌐 Globe icon) in topbar
2. Select **"English"**
3. Select **"العربية"** (Arabic)
4. Select **"Français"**

**Expected Results:**

**English:**
- ✅ All text in English
- ✅ LTR layout

**Arabic:**
- ✅ All text in Arabic
- ✅ **RTL layout** (sidebar moves to right)
- ✅ Text alignment right
- ✅ Charts adapt to RTL

**French:**
- ✅ All text in French
- ✅ LTR layout

### Test 6.3: Navigation

**Test all routes:**
```
/dashboard       - Main dashboard
/import          - Excel import page
/valuation       - Company valuation
/team            - Team management (ADMIN only)
/settings        - User settings
```

**Expected Result:**
- ✅ All routes accessible via sidebar
- ✅ Active route highlighted
- ✅ Smooth transitions

### Test 6.4: Settings Page

**Steps:**
1. Go to `/settings`
2. Test each section

**Sections to Test:**

**Account Settings:**
- ✅ View profile information
- ✅ Change password
- ✅ Update email

**Company Profile:**
- ✅ View company details
- ✅ Edit company name, sector, country

**Preferences:**
- ✅ View language & theme settings
- ✅ (Optional) Currency preference

---

## Phase 7: API Testing

### 🎯 What to Test:
- Direct API calls with Postman/cURL
- Authentication flow
- Data validation
- Error handling

### Setup: Get JWT Token

```bash
# 1. Login via API
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@testcorp.com",
    "password": "Test123456!"
  }'

# Response:
{
  "access_token": "eyJhbGci...",
  "user": { ... },
  "redirect": "/dashboard"
}

# 2. Copy the access_token for next requests
export TOKEN="eyJhbGci..."
```

### Test 7.1: Protected Routes

```bash
# Get profile
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Expected: User profile with JWT payload
```

### Test 7.2: Valuation Methods

```bash
# Get available methods
curl -X GET http://localhost:3000/api/v1/valuation/methods \
  -H "Authorization: Bearer $TOKEN"

# Expected:
[
  {
    "id": "ev_ebitda",
    "name": "EV / EBITDA",
    "description": "..."
  },
  {
    "id": "dcf",
    "name": "Discounted Cash Flow",
    "description": "..."
  }
]
```

### Test 7.3: Calculate Valuation

```bash
# EV/EBITDA calculation
curl -X POST http://localhost:3000/api/v1/valuation/calculate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "ev_ebitda",
    "inputs": {
      "ebitda": 500000,
      "multiple": 6.5,
      "netDebt": 200000
    }
  }'

# Expected:
{
  "enterpriseValue": 3250000,
  "equityValue": 3050000,
  "formula": "EV = EBITDA × Multiple",
  "explanation": "..."
}
```

### Test 7.4: Import Validation

```bash
# Try to import without file (should fail)
curl -X POST http://localhost:3000/api/v1/financial/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: multipart/form-data"

# Expected: 400 Bad Request - No file uploaded

# Try with invalid file type
curl -X POST http://localhost:3000/api/v1/financial/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"

# Expected: 400 Bad Request - Only Excel files accepted
```

### Test 7.5: Dashboard Metrics

```bash
# Get dashboard metrics
curl -X GET http://localhost:3000/api/v1/financial/dashboard-metrics \
  -H "Authorization: Bearer $TOKEN"

# Expected:
{
  "hasData": true,
  "strategicKpis": {
    "cac": 5000,
    "ltv": 25000,
    "ltvCacRatio": 5,
    "tam": 50000000,
    "marketShare": 2.5,
    "employeeCount": 45
  },
  "chartData": [
    { "period": "2025-01", "revenue": 150000, "expenses": 120000 },
    ...
  ]
}
```

### Test 7.6: Import History

```bash
# Get import history
curl -X GET http://localhost:3000/api/v1/financial/imports \
  -H "Authorization: Bearer $TOKEN"

# Expected:
[
  {
    "id": "uuid-1",
    "createdAt": "2026-04-09T10:00:00Z",
    "recordCount": 30
  },
  {
    "id": "uuid-2",
    "createdAt": "2026-04-08T15:30:00Z",
    "recordCount": 25
  }
]
```

### Test 7.7: Unauthorized Access

```bash
# Try to access without token
curl -X GET http://localhost:3000/api/v1/financial/dashboard-metrics

# Expected: 401 Unauthorized

# Try with invalid token
curl -X GET http://localhost:3000/api/v1/financial/dashboard-metrics \
  -H "Authorization: Bearer invalid_token"

# Expected: 401 Unauthorized - Invalid token
```

### Test 7.8: Role-Based Access

```bash
# Login as READER user
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@testcorp.com",
    "password": "Bob123456!"
  }'

export READER_TOKEN="..."

# Try to import data (should fail for READER)
curl -X POST http://localhost:3000/api/v1/financial/import \
  -H "Authorization: Bearer $READER_TOKEN" \
  -F "file=@test.xlsx"

# Expected: 403 Forbidden - Insufficient permissions

# But can view dashboard
curl -X GET http://localhost:3000/api/v1/financial/dashboard-metrics \
  -H "Authorization: Bearer $READER_TOKEN"

# Expected: 200 OK - Data returned
```

---

## 📊 Testing Checklist

### Authentication ✅
- [ ] Register new account with company
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Logout and verify session cleared
- [ ] Access protected route without token (should fail)
- [ ] Password reset flow (if email configured)
- [ ] Email verification (if email configured)

### Team Management ✅
- [ ] Invite USER role member
- [ ] Invite READER role member
- [ ] Accept invitation and create account
- [ ] View team list as ADMIN
- [ ] Delete team member
- [ ] READER cannot access team page (403)
- [ ] READER can view dashboard
- [ ] READER cannot import data (403)

### Company Valuation ✅
- [ ] Calculate EV/EBITDA valuation
- [ ] Calculate DCF valuation
- [ ] Calculate Gordon Growth valuation
- [ ] Real-time calculation updates
- [ ] Save valuation to history
- [ ] View valuation history
- [ ] Delete old valuation
- [ ] Invalid DCF inputs rejected (WACC ≤ Growth)

### Financial Import ✅
- [ ] Download Excel template
- [ ] Import valid Excel file
- [ ] Import file with missing sheets (should fail)
- [ ] Import invalid file type (should fail)
- [ ] Import file > 10MB (should fail)
- [ ] View import history
- [ ] Switch to previous import
- [ ] Delete import
- [ ] Dashboard updates after import changes

### Dashboard ✅
- [ ] Revenue vs Expenses chart displays
- [ ] Cash flow trend chart displays
- [ ] Strategic KPI cards show correct values
- [ ] Hover tooltips work on charts
- [ ] Charts responsive on resize
- [ ] Empty state displays when no data
- [ ] "Import Data" button from empty state

### UI Features ✅
- [ ] Toggle light/dark theme
- [ ] Theme persists after refresh
- [ ] Switch to English
- [ ] Switch to Arabic (RTL layout)
- [ ] Switch to French
- [ ] Language persists after refresh
- [ ] Sidebar navigation works
- [ ] All routes accessible

### API Testing ✅
- [ ] Login via API returns JWT
- [ ] Access protected route with valid token
- [ ] Access route without token (401)
- [ ] Access route with invalid token (401)
- [ ] Calculate valuation via API
- [ ] Import history via API
- [ ] Role-based access enforced
- [ ] File validation works via API

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to backend"
```bash
# Check if backend is running
docker-compose ps

# Restart backend
docker-compose restart backend

# Check logs
docker-compose logs backend
```

### Issue 2: "Database connection error"
```bash
# Wait for PostgreSQL to be healthy
docker-compose ps postgres

# Should show: healthy
# If not, wait 10-20 seconds

# Restart backend after database is ready
docker-compose restart backend
```

### Issue 3: "Prisma Client not generated"
```bash
docker-compose exec backend npx prisma generate
docker-compose restart backend
```

### Issue 4: "Cannot import Excel"
- Verify file has all 3 required sheets: CashFlow, StrategicKPIs, AnnualData
- Check sheet names match exactly (case-sensitive)
- Verify columns are correct
- Check backend logs: `docker-compose logs backend`

### Issue 5: "Charts not displaying"
- Check browser console for errors (F12)
- Verify import was successful
- Check Network tab for failed API calls
- Verify data exists in database (Prisma Studio)

---

## 📈 Performance Testing

### Load Time Testing
```bash
# Measure API response times
curl -w "@curl-format.txt" -o /dev/null -s \
  http://localhost:3000/api/v1/financial/dashboard-metrics \
  -H "Authorization: Bearer $TOKEN"

# Frontend load time:
# Open DevTools → Network tab → Refresh page
# Check "Load" time at bottom
```

### Database Query Performance
```bash
# In Prisma Studio, run queries
# Check response times in browser Network tab
# Dashboard metrics should load in < 500ms
```

---

## 🎯 Next Steps After Testing

1. **Document any bugs** found during testing
2. **Fix issues** and re-test
3. **Add unit tests** for critical paths
4. **Set up CI/CD** pipeline
5. **Configure email service** (Mailtrap/SendGrid)
6. **Deploy to production** with Docker Compose or Kubernetes
7. **Set up monitoring** (Prometheus, Grafana)
8. **Add E2E tests** with Cypress/Playwright

---

**Happy Testing! 🚀**

If you encounter any issues, check:
- `DOCKER_README.md` for Docker troubleshooting
- Backend logs: `docker-compose logs backend`
- Frontend console: Browser DevTools (F12)
- Database: Prisma Studio at http://localhost:5555
