# SmartBiz AI - Complete Project Explanation

## 🎯 Project Overview

**SmartBiz AI** is a **SaaS (Software as a Service) platform** that integrates **Artificial Intelligence** to optimize the management of **SMEs (Small and Medium Enterprises)**. The platform combines:
- **Data centralization** for financial information
- **Automated company valuation** using multiple methods
- **Predictive analysis** to assist business leaders in strategic decision-making

**PFE** stands for *"Projet de Fin d'Études"* (Final Year Project) - this is an academic/graduation project.

---

## 🏗️ Architecture

The project follows a **monorepo structure** with three main components:

### 1. **Backend** (`apps/backend/`)
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (Access + Refresh Tokens) with Passport.js
- **Security**: bcrypt for password hashing, rate limiting, role-based access control

**Key Modules:**
- **AuthModule**: Registration, login, email verification, password reset, team invitations
- **CompanyModule**: Multi-tenant company management
- **FinancialModule**: Excel data import, financial dashboard metrics, import history
- **ValuationModule**: Company valuation using DCF, EBITDA multiples, Gordon Growth methods
- **PredictionModule**: AI/ML predictions (interfaces with ML engine)
- **MailModule**: Email notifications via Nodemailer

### 2. **Frontend** (`apps/frontend/`)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS v4 with dark/light theme support
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts & MUI Charts
- **Internationalization**: i18next (supports French, English, Arabic with RTL)
- **Routing**: React Router v7

**Key Features:**
- Responsive layout with Sidebar and Topbar
- Theme toggle (light/dark mode) persisted in localStorage
- Multi-language support (FR/EN/AR) with automatic RTL for Arabic
- Role-based UI (ADMIN, USER, READER)

### 3. **ML Engine** (`apps/ml-engine/`)
- **Purpose**: Machine learning models for predictive analysis
- **Python-based** with training and testing pipelines
- **Integration**: Communicates with backend via HTTP (axios)

---

## 📊 Core Features (By Sprint)

### **Sprint 1: Authentication & Multi-Tenant Architecture**
✅ User registration with company creation  
✅ Secure login with JWT (Access Token: 15min, Refresh Token: 7 days)  
✅ Email verification system  
✅ Password reset via email link  
✅ Profile management  
✅ Multi-tenant database design (Company → Users relationship)

**User Roles:**
- **ADMIN**: Company administrator (can invite team members, manage data)
- **USER**: Standard user (can view and import data)
- **READER**: Read-only access

---

### **Sprint 2: UI, Theming, Internationalization & Company Valuation**
✅ Responsive layout (Sidebar + Topbar + Content)  
✅ Light/Dark theme toggle with persistence  
✅ Multi-language support (French, English, Arabic with RTL)  
✅ Team invitation system (email-based)  
✅ **Company Valuation Module** with multiple methods:
  - **DCF (Discounted Cash Flow)**: Based on future cash flows
  - **EV/EBITDA Multiples**: Market comparison approach
  - **Gordon Growth Model**: Dividend-based valuation
✅ Real-time calculation with formula explanation  
✅ Valuation history saved per company

---

### **Sprint 3: Financial Data Import & Interactive Dashboard**
✅ **Excel File Import** with validation:
  - Upload structured Excel files with required sheets
  - Automatic parsing and storage in PostgreSQL
  - Validation of mandatory sheets (CashFlow, Strategic KPIs, Annual Data)

✅ **Downloadable Excel Template** for data preparation  
✅ **Interactive Dashboard** with:
  - Revenue, expenses, and cash flow charts (Recharts)
  - Strategic KPI cards (CAC, LTV, TAM, Market Share, Employee Count)
  - Monthly financial metrics visualization

✅ **Import History Management**:
  - View all previous imports with dates and data volume
  - Switch between different import versions
  - Delete erroneous or obsolete imports
  - Automatic dashboard refresh after history changes

---

## 🗄️ Database Schema (Prisma)

### Core Entities:

**Company** (Multi-tenant root)
- id, name, registrationNumber, sector, currency, country
- Relations: users[], batches[], predictions[], valuations[]

**User** (Authentication & Authorization)
- id, firstName, lastName, email, password, role
- Email verification tokens, password reset tokens, invite tokens
- Belongs to one Company

**ImportBatch** (Financial data imports)
- Links to Company
- Stores strategic KPIs: CAC, LTV, TAM, MarketShare, EmployeeCount
- Contains macro features (JSON)
- Has many FinancialData records

**FinancialData** (Time-series metrics)
- metric name, value, period (datetime)
- Belongs to one ImportBatch (cascade delete)

**Prediction** (ML predictions)
- Status tracking (PENDING → PROCESSING → COMPLETED/FAILED)
- Result stored as JSON

**SavedValuation** (Company valuation history)
- Method used (DCF, Multiples, etc.)
- Inputs (JSON), Enterprise Value, Equity Value
- Formula and explanation text

---

## 🔐 Security Features

1. **JWT Authentication**:
   - Access Token: 15 minutes expiry
   - Refresh Token: 7 days, stored in HttpOnly cookie
   - Automatic token refresh via Axios interceptor

2. **Role-Based Access Control (RBAC)**:
   - `@Roles()` decorator for endpoint protection
   - `RolesGuard` checks user permissions
   - `JwtAuthGuard` validates JWT tokens

3. **Rate Limiting**:
   - 120 requests per IP per minute (ThrottlerModule)
   - Prevents brute-force attacks

4. **Password Security**:
   - bcrypt hashing (10 rounds)
   - Secure password reset with SHA-256 hashed tokens

5. **Multi-Tenancy Isolation**:
   - Each company's data is isolated by `companyId`
   - Users can only access their own company's data

---

## 🌐 Internationalization (i18n)

- **Languages**: French (FR), English (EN), Arabic (AR)
- **RTL Support**: Automatic text direction change for Arabic
- **Persistence**: Language preference saved via LanguageDetector
- **Implementation**: react-i18next with translation JSON files

---

## 📈 Key Business Metrics (KPIs)

The dashboard tracks:
- **CAC** (Customer Acquisition Cost): Cost to acquire a customer
- **LTV** (Lifetime Value): Total revenue from a customer
- **TAM** (Total Addressable Market): Market opportunity size
- **Market Share**: Company's position in the market
- **Employee Count**: Workforce size
- **Revenue & Expenses Trends**: Monthly financial performance
- **Cash Flow**: Monthly cash flow analysis

---

## 🚀 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | TailwindCSS v4 |
| **UI Components** | Material-UI, Lucide Icons |
| **Charts** | Recharts, MUI Charts |
| **State Management** | Zustand |
| **Form Validation** | React Hook Form + Zod |
| **Backend Framework** | NestJS (TypeScript) |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Authentication** | JWT + Passport.js |
| **Email** | Nodemailer |
| **ML Engine** | Python |
| **Containerization** | Docker (Dockerfile.dev) |

---

## 📁 Project Structure

```
PFE-smartBiz-AI/
├── apps/
│   ├── backend/              # NestJS API
│   │   ├── src/
│   │   │   ├── auth/        # Authentication module
│   │   │   ├── company/     # Company management
│   │   │   ├── financial/   # Excel import & dashboard
│   │   │   ├── valuation/   # Company valuation
│   │   │   ├── prediction/  # ML predictions
│   │   │   ├── mail/        # Email service
│   │   │   └── prisma/      # Database service
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── test/
│   │
│   ├── frontend/            # React application
│   │   └── src/
│   │       ├── components/  # Reusable UI components
│   │       ├── pages/       # Route pages
│   │       ├── stores/      # Zustand stores
│   │       ├── i18n/        # Translations
│   │       └── services/    # API clients
│   │
│   └── ml-engine/           # Python ML models
│       ├── app/             # Model definitions
│       ├── etl/             # Data pipeline
│       └── test/            # Model testing
│
├── package.json             # Root dependencies
└── README.md
```

---

## 🎓 Academic Context

This is a **Final Year Project (PFE)** for a degree program. The documentation in `pfe_release1_sprints_3.md` contains:
- Use case diagrams (Mermaid)
- Class diagrams
- Sequence diagrams
- Sprint backlogs with user stories
- Acceptance criteria

**Release 1** covers Sprints 1-3 (6 weeks total, 2 weeks per sprint) and establishes:
- Secure multi-tenant architecture
- Complete authentication system
- Financial data management
- Interactive dashboard
- Company valuation tools

**Future releases** (mentioned in conclusion) will focus on:
- Advanced AI features
- Predictive analytics
- Enhanced ML model integration

---

## 🔍 What Makes This Project Special

1. **Multi-Tenant SaaS**: Single platform serving multiple companies with data isolation
2. **Bimodal Data Import**: Accepts both manual entry and bulk Excel uploads
3. **Version Control for Financial Data**: Users can revert to previous import versions
4. **Real-Time Valuation**: Multiple financial valuation methods in one interface
5. **AI-Ready Architecture**: Modular design ready for ML model integration
6. **Trilingual Support**: Including RTL Arabic support (rare in business apps)
7. **Production-Ready Security**: JWT, rate limiting, role-based access, secure cookies

---

## 📝 Next Steps (Future Releases)

Based on the conclusion section:
- **Release 2**: Advanced AI features (predictive analytics, forecasting)
- **ML Engine Integration**: Real prediction endpoints
- **Enhanced Dashboard**: Predictive metrics and trend analysis
- **Export Features**: PDF/Excel report generation (jspdf, xlsx already in dependencies)

---

**Bottom Line**: SmartBiz AI is a comprehensive business management platform that helps SMEs centralize financial data, evaluate company worth using multiple methods, and (in future releases) leverage AI for predictive insights—all secured with enterprise-grade authentication and multi-tenant isolation.
