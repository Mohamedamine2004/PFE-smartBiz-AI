# SmartBiz AI - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Core Features](#core-features)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Frontend Structure](#frontend-structure)
8. [Backend Structure](#backend-structure)
9. [ML Engine](#ml-engine)
10. [Security](#security)
11. [Deployment](#deployment)
12. [Development Workflow](#development-workflow)

---

## 🎯 Project Overview

**SmartBiz AI** is a **SaaS (Software as a Service) platform** that integrates **Artificial Intelligence** to optimize the management of **SMEs (Small and Medium Enterprises)**. 

### Purpose
- **Data centralization** for financial information
- **Automated company valuation** using multiple financial methods
- **Predictive analysis** to assist business leaders in strategic decision-making
- **Multi-tenant architecture** serving multiple companies with data isolation

### Academic Context
This is a **Final Year Project (PFE - Projet de Fin d'Études)** designed to demonstrate enterprise-grade software development with AI integration.

---

## 🏗️ Architecture

### Monorepo Structure
The project follows a **monorepo architecture** with three main components:

```
PFE-smartBiz-AI/
├── apps/
│   ├── backend/          # NestJS REST API
│   ├── frontend/         # React 19 Application
│   └── ml-engine/        # Python ML Models
├── docker-compose.yml    # Container orchestration
└── init-scripts/         # Database initialization
```

### Component Breakdown

#### 1. Backend (`apps/backend/`)
- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (Access + Refresh Tokens) with Passport.js
- **Architecture**: Module-based with clear separation of concerns

**Key Modules:**
- **AuthModule**: Registration, login, email verification, password reset, team invitations
- **CompanyModule**: Multi-tenant company management
- **FinancialModule**: Excel data import, financial dashboard metrics, import history
- **ValuationModule**: Company valuation using DCF, EBITDA multiples, Gordon Growth methods
- **PredictionModule**: AI/ML predictions interface
- **MailModule**: Email notifications via Nodemailer

#### 2. Frontend (`apps/frontend/`)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS v4 with dark/light theme support
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts & MUI Charts
- **Internationalization**: i18next (French, English, Arabic with RTL)
- **Routing**: React Router v7

**Key Features:**
- Responsive layout with Sidebar and Topbar
- Theme toggle (light/dark mode) persisted in localStorage
- Multi-language support (FR/EN/AR) with automatic RTL for Arabic
- Role-based UI (ADMIN, USER, READER)
- Lazy-loaded pages for performance

#### 3. ML Engine (`apps/ml-engine/`)
- **Framework**: FastAPI (Python)
- **Purpose**: Machine learning models for predictive analysis
- **Features**: Growth prediction, valuation scenarios, feature importance
- **Integration**: Communicates with backend via HTTP (axios)

---

## 💻 Technology Stack

### Frontend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI Framework |
| TypeScript | Latest | Type Safety |
| Vite | Latest | Build Tool |
| TailwindCSS | v4 | Styling |
| Zustand | Latest | State Management |
| React Router | v7 | Routing |
| Recharts | Latest | Charts |
| MUI Charts | Latest | Advanced Charts |
| React Hook Form | Latest | Form Management |
| Zod | Latest | Schema Validation |
| i18next | Latest | Internationalization |
| Axios | Latest | HTTP Client |
| Lucide Icons | Latest | Icon Library |
| dom-to-image-more | Latest | Image Export |
| jsPDF | Latest | PDF Export |
| xlsx | Latest | Excel Processing |

### Backend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | Latest | Backend Framework |
| TypeScript | Latest | Type Safety |
| Prisma | Latest | ORM |
| PostgreSQL | 16 | Database |
| Passport.js | Latest | Authentication |
| JWT | Latest | Token-based Auth |
| bcrypt | Latest | Password Hashing |
| Nodemailer | Latest | Email Service |
| xlsx | Latest | Excel Processing |

### ML Engine Technologies
| Technology | Purpose |
|------------|---------|
| Python | ML Development |
| FastAPI | REST API |
| scikit-learn | Machine Learning |
| pandas | Data Processing |
| numpy | Numerical Computing |
| uvicorn | ASGI Server |

---

## 🚀 Core Features

### Sprint 1: Authentication & Multi-Tenant Architecture

#### ✅ User Registration with Company Creation
- Users register with personal information
- Automatic company creation during registration
- Email verification required for account activation
- Role assignment (ADMIN for first user)

#### ✅ Secure Login with JWT
- **Access Token**: 15 minutes expiry
- **Refresh Token**: 7 days, stored in HttpOnly cookie
- Automatic token refresh via Axios interceptor
- Secure password reset with SHA-256 hashed tokens

#### ✅ Email Verification System
- Token-based email verification
- Verification status tracking
- Resend verification capability

#### ✅ Password Reset via Email Link
- Secure password reset flow
- Time-limited reset tokens
- Email-based token delivery

#### ✅ Profile Management
- Update personal information
- Change password
- View company information

#### ✅ Multi-Tenant Database Design
- Company → Users relationship
- Data isolation by companyId
- Role-based access control

**User Roles:**
- **ADMIN**: Company administrator (can invite team members, manage data)
- **USER**: Standard user (can view and import data)
- **READER**: Read-only access

---

### Sprint 2: UI, Theming, Internationalization & Company Valuation

#### ✅ Responsive Layout
- Sidebar navigation
- Topbar with user controls
- Content area with responsive grid
- Mobile-friendly design

#### ✅ Light/Dark Theme Toggle
- Theme persistence in localStorage
- System preference detection
- Smooth theme transitions
- Design token consistency

#### ✅ Multi-Language Support
- **French (FR)**: Primary language
- **English (EN)**: International support
- **Arabic (AR)**: With automatic RTL text direction
- Language preference persistence via LanguageDetector

#### ✅ Team Invitation System
- Email-based team invitations
- Invite token generation and validation
- Accept/decline invitation flow
- Role assignment during invitation

#### ✅ Company Valuation Module

**Valuation Methods:**

1. **DCF (Discounted Cash Flow)**
   - Based on future cash flows
   - Terminal value calculation
   - WACC (Weighted Average Cost of Capital) discounting
   - Real-time calculation with formula explanation

2. **EV/EBITDA Multiples**
   - Market comparison approach
   - Industry-specific multiples
   - Enterprise value derivation
   - Equity value calculation

3. **Gordon Growth Model**
   - Dividend-based valuation
   - Perpetual growth rate assumption
   - Simple and intuitive formula

**Valuation Features:**
- Real-time calculation
- Multiple method comparison
- Formula explanation for transparency
- Valuation history saved per company
- Export to PDF/PNG/Excel
- Sensitivity analysis with sliders

---

### Sprint 3: Financial Data Import & Interactive Dashboard

#### ✅ Excel File Import
- Upload structured Excel files with required sheets
- Automatic parsing and validation
- Required sheets:
  - **CashFlow**: Monthly financial metrics
  - **Strategic KPIs**: Business metrics (CAC, LTV, TAM, etc.)
  - **Annual Data**: Yearly valuation data (macroFeatures)
- Validation of mandatory sheets
- Error handling with detailed messages
- Import success confirmation with row count

#### ✅ Downloadable Excel Template
- Pre-formatted template generation
- Three required sheets with correct column names
- Sample data for guidance
- One-click download

#### ✅ Interactive Dashboard

**Charts & Visualizations:**
- Revenue, expenses, and cash flow charts (Recharts)
- Revenue breakdown pie chart
- Profit margin trends
- Cash runway projection
- Trend analysis with moving averages

**Strategic KPI Cards:**
- **CAC** (Customer Acquisition Cost)
- **LTV** (Lifetime Value)
- **TAM** (Total Addressable Market)
- **Market Share**: Company's position in the market
- **Employee Count**: Workforce size

**Monthly Financial Metrics:**
- Revenue trends
- Expense tracking
- Cash flow analysis
- Profit margins

#### ✅ Import History Management
- View all previous imports with dates and data volume
- Switch between different import versions
- Delete erroneous or obsolete imports
- Automatic dashboard refresh after history changes
- Cascade deletion of related financial data

---

## 🗄️ Database Schema

### Core Entities (Prisma ORM)

#### Company (Multi-tenant root)
```prisma
model Company {
  id                 String           @id @default(uuid())
  name               String           @unique
  registrationNumber String           @unique
  sector             String?
  currency           String?
  fiscalYearStart    Int?
  country            String?
  users              User[]
  batches            ImportBatch[]
  predictions        Prediction[]
  valuations         SavedValuation[]
  createdAt          DateTime         @default(now())
  deletedAt          DateTime?        // Soft delete
}
```

**Relations:**
- One-to-Many with User
- One-to-Many with ImportBatch
- One-to-Many with Prediction
- One-to-Many with SavedValuation

---

#### User (Authentication & Authorization)
```prisma
model User {
  id           String    @id @default(uuid())
  firstName    String
  lastName     String
  email        String    @unique
  password     String    // bcrypt hashed
  refreshToken String?   // JWT refresh token
  role         UserRole  @default(USER)
  companyId    String
  company      Company   @relation(fields: [companyId], references: [id])
  createdAt    DateTime  @default(now())
  deletedAt    DateTime?
  
  isEmailVerified      Boolean   @default(false)
  verifyEmailToken     String?   @unique
  resetPasswordToken   String?   @unique
  resetPasswordExpires DateTime?
  inviteToken          String?   @unique
  inviteTokenExpires   DateTime?
}

enum UserRole {
  ADMIN
  USER
  READER
}
```

**Security Features:**
- Email verification tokens
- Password reset tokens with expiry
- Invite tokens for team invitations
- Soft delete support
- Refresh token rotation

---

#### ImportBatch (Financial data imports)
```prisma
model ImportBatch {
  id            String          @id @default(uuid())
  companyId     String
  company       Company         @relation(fields: [companyId], references: [id])
  data          FinancialData[]
  createdAt     DateTime        @default(now())
  
  // Strategic KPIs from Excel
  cac           Float?          // Customer Acquisition Cost
  ltv           Float?          // Lifetime Value
  tam           Float?          // Total Addressable Market
  marketShare   Float?
  employeeCount Int?
  
  // Annual valuation data
  macroFeatures Json?
}
```

**Purpose:**
- Groups related financial data imports
- Stores strategic KPIs at batch level
- Links to company for multi-tenancy
- Contains macro features for ML

---

#### FinancialData (Time-series metrics)
```prisma
model FinancialData {
  id      String      @id @default(uuid())
  batchId String
  batch   ImportBatch @relation(fields: [batchId], references: [id], onDelete: Cascade)
  metric  String      // e.g., "revenue", "expenses", "cashflow"
  value   Float
  period  DateTime    // Monthly granularity

  @@index([batchId, metric, period])
}
```

**Features:**
- Time-series financial metrics
- Cascade deletion with parent batch
- Indexed for efficient querying
- Flexible metric types

---

#### Prediction (ML predictions)
```prisma
model Prediction {
  id        String           @id @default(uuid())
  companyId String
  company   Company          @relation(fields: [companyId], references: [id])
  status    PredictionStatus @default(PENDING)
  result    Json?            // Prediction results
  createdAt DateTime         @default(now())
}

enum PredictionStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

**Lifecycle:**
1. PENDING → Created by user request
2. PROCESSING → Sent to ML engine
3. COMPLETED → Results stored
4. FAILED → Error handling

---

#### SavedValuation (Company valuation history)
```prisma
model SavedValuation {
  id              String   @id @default(uuid())
  companyId       String
  company         Company  @relation(fields: [companyId], references: [id])
  userId          String
  method          String   // DCF, Multiples, Gordon Growth
  inputs          Json     // Valuation parameters
  enterpriseValue Float?
  equityValue     Float
  formula         String   // Formula used
  explanation     String   // Human-readable explanation
  label           String?  // User-friendly label
  createdAt       DateTime @default(now())

  @@index([companyId, createdAt(sort: Desc)])
}
```

**Features:**
- Complete valuation history
- Method tracking
- Input preservation
- Formula transparency
- Indexed for fast retrieval

---

## 🔌 API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /auth/register` - User registration with company creation
- `POST /auth/login` - User login (returns JWT)
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Invalidate refresh token
- `POST /auth/forgot-password` - Request password reset email
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/verify-email` - Verify email with token
- `POST /auth/resend-verification` - Resend verification email
- `GET /auth/me` - Get current user profile
- `PATCH /auth/profile` - Update profile
- `PATCH /auth/change-password` - Change password

### Company (`/api/v1/company`)
- `GET /company/profile` - Get company information
- `PATCH /company/profile` - Update company profile

### Team (`/api/v1/company/team`)
- `GET /company/team` - List team members (ADMIN/USER)
- `POST /company/team/invite` - Send team invitation
- `POST /company/team/accept-invite` - Accept invitation
- `DELETE /company/team/:id` - Remove team member (ADMIN)
- `PATCH /company/team/:id/role` - Update user role (ADMIN)

### Financial (`/api/v1/financial`)
- `POST /financial/import` - Import Excel file
- `GET /financial/template` - Download Excel template
- `GET /financial/dashboard-metrics` - Get dashboard metrics (latest import)
- `GET /financial/dashboard-metrics/:batchId` - Get metrics for specific import
- `GET /financial/imports` - Get import history
- `DELETE /financial/imports/:batchId` - Delete import

### Valuation (`/api/v1/valuation`)
- `POST /valuation/calculate` - Calculate company valuation
- `GET /valuation/history` - Get valuation history
- `DELETE /valuation/:id` - Delete saved valuation

### Prediction (`/api/v1/prediction`)
- `POST /prediction/create` - Create prediction request
- `GET /prediction/:id` - Get prediction status/results
- `GET /prediction/company` - Get all predictions for company

---

## 🎨 Frontend Structure

### Pages
- **Login** - User authentication
- **Register** - New user registration
- **ForgotPassword** - Password reset request
- **ResetPassword** - Password reset with token
- **AcceptInvite** - Team invitation acceptance
- **EmailVerified** - Email verification confirmation
- **Dashboard** - Main financial dashboard
- **ImportPage** - Excel data import interface
- **Settings** - User and company settings
- **Team** - Team management
- **Valuation** - Company valuation tool
- **WaitingSetup** - Waiting page for company setup

### Components

#### Dashboard Components
- `DashboardHeader` - Dashboard page header
- `DashboardTopbar` - Dashboard controls (import selector, history)
- `RevenueExpensesChart` - Revenue vs expenses visualization
- `RevenuePieChart` - Revenue breakdown
- `CashFlowMetricsTable` - Cash flow data table
- `CashRunwayChart` - Cash runway projection
- `ProfitMarginChart` - Profit margin trends
- `TrendAnalysisChart` - Trend analysis with moving averages
- `StrategicKpisGrid` - KPI cards display
- `ImportHistoryDrawer` - Import history side panel
- `AiStrategicInsight` - AI-generated insights
- `PredictionStatesCard` - Prediction status display
- `FeatureImportanceChart` - ML feature importance
- `CustomerRetentionChart` - Customer retention visualization
- `RevenueProjectionChart` - Revenue forecast
- `DashboardEmptyState` - Empty state messaging

#### Valuation Components
- `ValuationForm` - Input form for valuation parameters
- `ValuationResultCard` - Result display
- `MethodSelector` - Valuation method selection
- `ComparisonView` - Multi-method comparison
- `SensitivitySliders` - Sensitivity analysis
- `HistoryPanel` - Valuation history
- `ExportButtons` - Export to PDF/PNG/Excel

#### Team Components
- `TeamTable` - Team members list
- `InviteForm` - Invitation form
- `DeleteUserModal` - User removal confirmation

#### Settings Components
- `AccountCard` - Account settings
- `CompanyCard` - Company settings
- `PreferencesCard` - User preferences (language, theme)

#### UI Components
- `Alert` - Notification alerts
- `Button` - Styled buttons
- `Spinner` - Loading indicator
- `Logo` - Brand logo
- `PageHeader` - Page headers
- `FormInput` - Form input wrapper
- `FormSelect` - Select dropdown
- `Tooltip` - Hover tooltips
- `ReadOnlyField` - Display-only fields
- `DownloadTemplateButton` - Template download

### State Management (Zustand)

#### authStore
- User authentication state
- Token management
- User profile
- Company information
- Login/logout/register actions

#### themeStore
- Theme state (light/dark)
- Theme toggle action
- System preference detection

#### valuationStore
- Valuation form state
- Calculation results
- History management
- Method selection

### Services

#### axios.ts
- Axios instance with interceptors
- Automatic token refresh
- Error handling
- Base URL configuration

#### financial.service.ts
- Dashboard metrics fetching
- Import history retrieval
- Data import/upload
- Template download

#### valuationApi.ts
- Valuation calculation
- History management
- Method-specific calculations

### Utilities

#### formatters.ts
- Number formatting
- Currency formatting
- Date formatting
- Percentage formatting

#### validations.ts
- Form validation schemas (Zod)
- Reusable validation rules

#### export.utils.ts
- PDF export
- PNG export
- Excel export
- Chart image generation

---

## ⚙️ Backend Structure

### Module Architecture

#### AuthModule
**Files:**
- `auth.controller.ts` - Auth endpoints
- `auth.service.ts` - Auth business logic
- `post-login.service.ts` - Post-login operations

**DTOs:**
- `login.dto.ts` - Login validation
- `register.dto.ts` - Registration validation
- `forgot-password.dto.ts` - Password reset request
- `reset-password.dto.ts` - Password reset with token

**Guards:**
- `jwt-auth.guard.ts` - JWT validation
- `roles.guard.ts` - Role-based access control

**Decorators:**
- `current-user.decorator.ts` - Extract current user
- `roles.decorator.ts` - Role requirement marker

**Strategies:**
- `jwt.strategy.ts` - Passport JWT strategy

**Interfaces:**
- `jwt-payload.interface.ts` - JWT token structure

---

#### CompanyModule
**Files:**
- `company.controller.ts` - Company endpoints
- `company.service.ts` - Company business logic

**DTOs:**
- `update-company-profile.dto.ts` - Company update validation

---

#### FinancialModule
**Files:**
- `financial.controller.ts` - Financial endpoints
- `financial.service.ts` - Financial business logic

**DTOs:**
- `import-data.dto.ts` - Import validation

**Key Services:**
- Excel file parsing
- Data validation
- Template generation
- Metrics calculation
- Import history management

---

#### ValuationModule
**Files:**
- `valuation.controller.ts` - Valuation endpoints
- `valuation.service.ts` - Valuation calculations

**DTOs:**
- `calculate-valuation.dto.ts` - Calculation inputs
- `save-valuation.dto.ts` - Save valuation

**Valuation Methods:**
- DCF calculation
- EBITDA multiples
- Gordon Growth Model
- Enterprise value derivation
- Equity value calculation

---

#### PredictionModule
**Files:**
- `prediction.controller.ts` - Prediction endpoints
- `prediction.service.ts` - ML engine communication

**Features:**
- Async prediction requests
- Status tracking
- Result retrieval
- ML engine HTTP client

---

#### MailModule
**Files:**
- `mail.service.ts` - Email sending service

**Features:**
- Email verification emails
- Password reset emails
- Team invitation emails
- Nodemailer integration

---

#### PrismaModule
**Files:**
- `prisma.service.ts` - Database connection
- Prisma client singleton

**Features:**
- Database connection management
- Migration support
- Query logging (development)

---

### Security Implementation

#### 1. JWT Authentication
```typescript
// Access Token: 15 minutes
JWT_ACCESS_SECRET=your-secret
JWT_EXPIRES_IN=15m

// Refresh Token: 7 days (HttpOnly cookie)
JWT_REFRESH_SECRET=your-secret
JWT_REFRESH_EXPIRES_IN=7d
```

**Flow:**
1. User logs in → receives access + refresh tokens
2. Access token used for API requests
3. When access token expires → refresh endpoint called
4. New access token issued
5. Logout invalidates refresh token

---

#### 2. Role-Based Access Control (RBAC)
```typescript
@Roles('ADMIN')  // Decorator marks endpoint
@UseGuards(JwtAuthGuard, RolesGuard)
```

**Guard Chain:**
- `JwtAuthGuard` → Validates JWT token
- `RolesGuard` → Checks user role against required role

---

#### 3. Rate Limiting
```typescript
// ThrottlerModule configuration
120 requests per IP per minute
```

**Purpose:**
- Prevent brute-force attacks
- Protect authentication endpoints
- API abuse prevention

---

#### 4. Password Security
- **Hashing**: bcrypt with 10 rounds
- **Salt**: Automatic salt generation
- **Verification**: bcrypt.compare()
- **Reset Tokens**: SHA-256 hashed tokens with expiry

---

#### 5. Multi-Tenancy Isolation
- Every query filtered by `companyId`
- Users can only access their company's data
- Database-level isolation via relations
- Soft delete support for data retention

---

## 🤖 ML Engine

### Architecture
```
apps/ml-engine/
├── app/
│   ├── main.py          # FastAPI application
│   ├── engine.py        # Prediction engine
│   └── schemas.py       # Pydantic models
├── etl/
│   ├── step1_sub.py     # Data subscription
│   ├── step2_num.py     # Numerical encoding
│   ├── step3_wide.py    # Data reshaping
│   ├── step4_feat.py    # Feature engineering
│   └── step5_tgt.py     # Target variable creation
├── 1_build_pipeline.py  # Pipeline construction
├── 2_train_model.py     # Model training
├── 3_test_model.py      # Model evaluation
└── 4_run_all.py         # Complete pipeline execution
```

### API Endpoints

#### Health Check
```
GET /health
Response: { "status": "healthy", "engine_ready": true }
```

#### Prediction
```
POST /predict
Headers: X-API-Key: <api_key>
Body: { "companies": [...] }
Response: {
  "predictions": [...],
  "valuations": [...],
  "scenarios": {...},
  "confidence": 0.85,
  "feature_importance": [...]
}
```

### ML Capabilities

#### Prediction Engine
- **Growth Prediction**: Revenue growth forecasting
- **Valuation Scenarios**: Multiple scenario analysis (optimistic, base, pessimistic)
- **Confidence Scoring**: Model confidence metrics
- **Feature Importance**: Key drivers identification

#### ETL Pipeline
1. **Data Subscription**: Extract relevant data
2. **Numerical Encoding**: Categorical to numerical
3. **Data Reshaping**: Long to wide format
4. **Feature Engineering**: Create predictive features
5. **Target Creation**: Define prediction targets

#### Model Training
- Historical data processing
- Feature selection
- Model training (scikit-learn)
- Model evaluation
- Pipeline persistence

---

## 🔐 Security

### Security Features Summary

1. **JWT Authentication**
   - Short-lived access tokens (15min)
   - Long-lived refresh tokens (7 days) in HttpOnly cookies
   - Automatic token refresh
   - Secure token storage

2. **Password Security**
   - bcrypt hashing (10 rounds)
   - Secure password reset with hashed tokens
   - Token expiry mechanisms

3. **Rate Limiting**
   - 120 requests per IP per minute
   - Brute-force protection

4. **Role-Based Access Control**
   - ADMIN, USER, READER roles
   - Endpoint-level protection
   - Data-level isolation

5. **Multi-Tenancy**
   - Company-based data isolation
   - Foreign key constraints
   - Cascade deletions

6. **Input Validation**
   - DTOs with class-validator
   - Zod validation on frontend
   - File upload validation

7. **CORS Configuration**
   - Restrictive origin policies
   - Credentials support
   - Environment-based configuration

---

## 🚢 Deployment

### Docker Compose Setup

#### Services

1. **PostgreSQL Database**
   ```yaml
   image: postgres:16-alpine
   port: 5432
   healthcheck: pg_isready
   volume: postgres_data
   ```

2. **Backend (NestJS)**
   ```yaml
   build: apps/backend/Dockerfile.dev
   port: 3000
   depends_on: postgres (healthy)
   command: npx prisma migrate deploy && npm run start:dev
   ```

3. **Frontend (React)**
   ```yaml
   build: apps/frontend/Dockerfile
   port: 5173
   depends_on: backend
   ```

4. **ML Engine (Python)**
   ```yaml
   build: apps/ml-engine/Dockerfile
   port: 8000
   depends_on: postgres
   command: python -m uvicorn app.main:app --reload
   ```

#### Networks
- `smartbiz-network`: Bridge network for service communication

#### Volumes
- `postgres_data`: Database persistence
- `backend_modules`: Backend dependencies
- `frontend_modules`: Frontend dependencies
- `ml_models`: ML model persistence

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@postgres:5432/smartbiz_db
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-secret
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=587
MAIL_USER=your-user
MAIL_PASSWORD=your-password
MAIL_FROM=noreply@smartbiz.ai
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3000/api/v1
ML_ENGINE_URL=http://ml-engine:8000
ML_API_KEY=dev-secret-key
```

---

## 🛠️ Development Workflow

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 16
- Docker & Docker Compose (optional)

### Local Development (Without Docker)

#### 1. Start Database
```bash
docker-compose up -d postgres
```

#### 2. Backend Setup
```bash
cd apps/backend
npm install
npx prisma migrate dev
npm run start:dev
```

#### 3. Frontend Setup
```bash
cd apps/frontend
npm install
npm run dev
```

#### 4. ML Engine Setup
```bash
cd apps/ml-engine
pip install -r requirements.txt
python run.py
```

### Docker Development

#### Start All Services
```bash
./docker-start.bat  # Windows
# OR
docker-compose up -d
```

#### View Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ml-engine
```

#### Stop Services
```bash
docker-compose down
```

#### Reset Database
```bash
docker-compose down -v
docker-compose up -d
```

### Testing

#### Backend Tests
```bash
cd apps/backend
npm run test
npm run test:watch
npm run test:cov
```

#### Frontend Tests
```bash
cd apps/frontend
npm run test
```

### Database Migrations

#### Create Migration
```bash
cd apps/backend
npx prisma migrate dev --name <migration_name>
```

#### Deploy Migrations
```bash
npx prisma migrate deploy
```

#### Reset Database
```bash
npx prisma migrate reset
```

#### Open Prisma Studio
```bash
npx prisma studio
```

---

## 📊 Key Business Metrics (KPIs)

The dashboard tracks:

| Metric | Description | Formula |
|--------|-------------|---------|
| **CAC** | Customer Acquisition Cost | Total Sales & Marketing / New Customers |
| **LTV** | Lifetime Value | Average Revenue Per Customer × Gross Margin × Customer Lifespan |
| **TAM** | Total Addressable Market | Market opportunity size |
| **Market Share** | Company's market position | Company Revenue / Total Market Revenue × 100 |
| **Employee Count** | Workforce size | Total employees |
| **Revenue** | Monthly recurring revenue | Sum of revenue metrics |
| **Expenses** | Monthly operating expenses | Sum of expense metrics |
| **Cash Flow** | Monthly cash position | Revenue - Expenses |
| **Profit Margin** | Profitability | (Revenue - Expenses) / Revenue × 100 |

---

## 📈 Performance Optimizations

### Frontend
- **Lazy Loading**: Route-based code splitting
- **Memoization**: React.memo for components
- **Debouncing**: Chart resize handlers
- **Suspense**: Loading states for async components
- **Zustand**: Minimal re-renders with selective subscriptions

### Backend
- **Database Indexing**: Composite indexes on FinancialData
- **Query Optimization**: Selective column fetching
- **Connection Pooling**: Prisma connection management
- **Rate Limiting**: API abuse prevention
- **Caching**: (Future enhancement opportunity)

### ML Engine
- **Pipeline Persistence**: Pre-built pipelines
- **Model Caching**: In-memory model storage
- **Async Processing**: Non-blocking predictions
- **Batch Processing**: Multi-company predictions

---

## 🌐 Internationalization

### Supported Languages
- **French (fr)**: Default language
- **English (en)**: International support
- **Arabic (ar)**: With RTL text direction

### Implementation
- react-i18next for translation management
- LanguageDetector for preference persistence
- Automatic RTL for Arabic
- Translation files in `i18n/locales/*.json`

### Usage
```typescript
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();
// Change language
i18n.changeLanguage('en');
// Current language
i18n.language; // 'en', 'fr', 'ar'
```

---

## 🎓 Academic Context

This is a **Final Year Project (PFE)** for a degree program. The documentation includes:

- Use case diagrams (Mermaid)
- Class diagrams
- Sequence diagrams
- Sprint backlogs with user stories
- Acceptance criteria

**Release 1** covers Sprints 1-3 (6 weeks total, 2 weeks per sprint) and establishes:
- ✅ Secure multi-tenant architecture
- ✅ Complete authentication system
- ✅ Financial data management
- ✅ Interactive dashboard
- ✅ Company valuation tools

**Future releases** will focus on:
- Advanced AI features
- Predictive analytics
- Enhanced ML model integration
- Report generation
- Advanced dashboard features

---

## 📝 Project Strengths

1. **Multi-Tenant SaaS**: Single platform serving multiple companies with data isolation
2. **Bimodal Data Import**: Accepts both manual entry and bulk Excel uploads
3. **Version Control for Financial Data**: Users can revert to previous import versions
4. **Real-Time Valuation**: Multiple financial valuation methods in one interface
5. **AI-Ready Architecture**: Modular design ready for ML model integration
6. **Trilingual Support**: Including RTL Arabic support (rare in business apps)
7. **Production-Ready Security**: JWT, rate limiting, role-based access, secure cookies
8. **Clean Architecture**: Well-structured monorepo with clear separation of concerns
9. **Type Safety**: Full TypeScript coverage across frontend and backend
10. **Modern Tech Stack**: Latest versions of React, NestJS, and Python ML libraries

---

## 🚀 Quick Start

### Using Docker (Recommended)
```bash
# Clone repository
git clone <repository-url>
cd PFE-smartBiz-AI

# Start all services
./docker-start.bat  # Windows
# OR
docker-compose up -d

# Access application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000/api/v1
# ML Engine: http://localhost:8000
```

### Manual Setup
```bash
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Backend
cd apps/backend
npm install
npx prisma migrate dev
npm run start:dev

# 3. Frontend
cd apps/frontend
npm install
npm run dev

# 4. ML Engine
cd apps/ml-engine
pip install -r requirements.txt
python run.py
```

---

**Bottom Line**: SmartBiz AI is a comprehensive business management platform that helps SMEs centralize financial data, evaluate company worth using multiple methods, and leverage AI for predictive insights—all secured with enterprise-grade authentication and multi-tenant isolation.
