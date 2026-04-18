# SmartBiz AI - Project Completion Checklist

Date: April 14, 2026
Status baseline: verified against current codebase

Use this checklist as the single execution plan to finish the project and prepare release.

---

## 1) Close Core Functional Gaps (Must-Have)

### A. Notification System - Complete Runtime Integration
- [ ] Mount NotificationBell in the authenticated topbar layout.
- [ ] Add notification i18n keys to FR/EN/AR locale files.
- [ ] Add backend event hooks to create notifications on:
  - [ ] Import success
  - [ ] Valuation completion
  - [ ] Prediction completion/failure
- [ ] Add integration tests for notification endpoints (list, unread count, mark read, mark all read).
- [ ] Validate notification UX on desktop + mobile.

Definition of done:
- [ ] Notification bell visible in authenticated app.
- [ ] Unread count updates correctly.
- [ ] New business events generate records in DB and appear in UI.

---

### B. Advanced Reporting - Wire Existing Components
- [ ] Decide reporting scope for release:
  - [ ] Option 1: Keep Dashboard export as PDF-only
  - [ ] Option 2: Add Dashboard PDF + Excel/CSV actions
- [ ] If Option 2, mount dashboard ExportButtons in Dashboard flow.
- [ ] Standardize file naming conventions for report downloads.
- [ ] Ensure report labels/translations exist in FR/EN/AR.
- [ ] Add smoke tests for report generation actions.

Definition of done:
- [ ] Export actions are visible and working from Dashboard.
- [ ] Downloads work for non-empty and empty-safe states.

---

### C. Redis Caching - Move from Infra-Ready to App-Integrated
- [ ] Choose backend cache targets (dashboard metrics, prediction latest, reference data).
- [ ] Add Nest cache module integration with Redis connection.
- [ ] Add cache key strategy and TTL policy.
- [ ] Add cache invalidation on import/valuation/prediction updates.
- [ ] Add monitoring logs for cache hit/miss.

Definition of done:
- [ ] Cache used in at least one high-traffic read path.
- [ ] Invalidation works after data updates.

---

## 2) Production Hardening (Must-Have)

### A. Observability and Secrets
- [ ] Set real SENTRY_DSN values for backend + frontend in runtime env.
- [ ] Verify Sentry event capture in staging.
- [ ] Confirm pino logs are structured in production mode.
- [ ] Remove any hardcoded secrets from docs/examples used in runtime.

### B. API and Security
- [ ] Verify Swagger docs for all public endpoints are accurate.
- [ ] Validate auth guards/roles on critical routes.
- [ ] Confirm CORS origins per environment.
- [ ] Add/update rate-limit expectations in API docs.

### C. Data and Reliability
- [ ] Run Prisma migrations on clean environment.
- [ ] Backup/restore drill for PostgreSQL.
- [ ] Add failure path test for ML engine unavailable.

Definition of done:
- [ ] Staging environment can run for 24h without critical errors.

---

## 3) Quality Gates Before Release (Must-Pass)

### A. Backend
- [ ] Lint passes.
- [ ] Unit tests pass.
- [ ] Test coverage meets team threshold.

### B. Frontend
- [ ] Lint passes.
- [ ] Production build passes.
- [ ] Core flows manually validated:
  - [ ] Login/Register
  - [ ] Import financial file
  - [ ] Dashboard render + tab navigation
  - [ ] Run prediction and view states
  - [ ] Valuation flow
  - [ ] Notifications flow
  - [ ] Export/report flow

### C. CI/CD
- [ ] GitHub Actions pipeline green on main/develop.
- [ ] Docker images build successfully.

Definition of done:
- [ ] All quality gates pass in CI and local smoke test.

---

## 4) UX and Mobile Finish (Release Recommended)

- [ ] Validate responsive behavior for Dashboard, Import, Valuation, Team, Settings.
- [ ] Confirm touch target sizes and topbar/sidebar behavior on small screens.
- [ ] Check empty states consistency across major pages.
- [ ] Check FR/EN/AR translations for new UI entries.

Definition of done:
- [ ] No broken layout at common breakpoints.

---

## 5) Release Checklist (Go-Live)

- [ ] Version bump and changelog update.
- [ ] Update README + installation docs to match real final features.
- [ ] Freeze migration state and tag release candidate.
- [ ] Final security check (dependency audit + env sanity).
- [ ] Create release tag and deployment notes.

Go/No-Go:
- [ ] GO approved by project owner.

---

## Suggested Execution Order

1. Notification runtime integration
2. Reporting integration decision + wiring
3. Redis app-level integration
4. Production hardening + secrets
5. Full QA pass + CI green
6. Release
