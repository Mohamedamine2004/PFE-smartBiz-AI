# Report Wizard Feature Implementation

## Overview
The Report Wizard is a comprehensive 7-step form-based interface for generating customized AI-powered business reports. It integrates seamlessly with SmartBiz AI's existing backend infrastructure and provides real-time progress tracking for long-running report generation tasks.

## Architecture

### Backend (NestJS)

#### Files Updated/Created
- `apps/backend/src/report/report.controller.ts` - Added SSE endpoint for real-time progress
- `apps/backend/src/report/report.service.ts` - Added `streamReportProgress()` method for SSE streaming
- `apps/backend/src/report/dto/generate-report.dto.ts` - Enhanced with `ReportTone` and `ReportSection` enums
- `apps/backend/src/report/gemini.service.ts` - Existing (uses Gemini API for AI content)
- `apps/backend/src/report/report-pdf.service.ts` - Existing (uses PDFKit for PDF generation)

#### Key Endpoints
- `POST /api/v1/report/generate` - Creates a new report job
- `GET /api/v1/report/jobs` - Lists all report jobs for the company
- `GET /api/v1/report/jobs/:id` - Gets status of a specific report
- `GET /api/v1/report/jobs/:id/download` - Downloads completed PDF
- `GET /api/v1/report/jobs/:id/progress` - SSE stream for real-time progress (optional)

### Frontend (React)

#### Components Structure
```
apps/frontend/src/features/report/
├── ReportWizard.tsx              # Main wizard container (7 steps)
├── ReportProgress.tsx            # Real-time progress overlay
├── ReportChart.tsx               # Chart rendering (uses Recharts)
├── hooks/
│   └── useReportGeneration.ts    # SSE/polling hooks
├── steps/
│   ├── Step1ReportType.tsx       # Select financial | marketing | strategic | operational
│   ├── Step2Language.tsx         # Select English | French | Arabic
│   ├── Step3ReportLength.tsx     # Select 10, 20, or 30 pages
│   ├── Step4MainProblem.tsx      # Free-text business problem
│   ├── Step5Sections.tsx         # Multi-select report sections
│   ├── Step6Tone.tsx             # Select professional tone
│   └── Step7Confirmation.tsx     # Review and generate
├── types.ts                      # TypeScript interfaces
└── index.ts                      # Barrel export
```

#### Key Components

##### ReportWizard
- Multi-step form with progress bar
- Validation before each step transition
- Handles form state management
- Submits to backend API
- Integrates with ReportProgress on success

##### ReportProgress
- Displays real-time generation status
- Polls backend for updates every 2 seconds
- Shows progress through predefined steps
- Provides download button on completion
- Handles error states

##### ReportChart
- Uses Recharts library (already in dependencies)
- Supports bar, line, and pie charts
- Automatically extracts chart configs from Gemini responses
- Responsive sizing

#### Hooks

##### useReportGeneration & useReportGenerationPolling
- Handles SSE stream connection or polling fallback
- Manages progress state
- Supports error callbacks
- Clean subscription/resource management

### Internationalization

Added translations for all wizard strings in:
- `apps/frontend/src/i18n/locales/en.json`
- `apps/frontend/src/i18n/locales/fr.json`
- `apps/frontend/src/i18n/locales/ar.json`

Keys include:
- `wizard.*` - All wizard UI text
- `report.status*` - Real-time feedback
- `report.download*` - Download actions

### Types

#### Frontend (`apps/frontend/src/types/report.ts`)
Enhanced with:
- `ReportTone` enum (PROFESSIONAL, ANALYTICAL, EXECUTIVE, CONSULTATIVE)
- `ReportSection` enum (6 sections: EXECUTIVE_SUMMARY, SWOT_ANALYSIS, etc.)
- Updated `GenerateReportPayload` interface

#### Backend (`apps/backend/src/report/dto/generate-report.dto.ts`)
Enhanced with:
- `@IsEnum(ReportTone)` validation
- `@IsArray() @IsEnum(ReportSection, { each: true })` validation
- New optional fields: `tone`, `sections`

## Data Flow

### Report Generation Flow

```
1. User fills 7-step wizard form
   ↓
2. Frontend validates all fields
   ↓
3. Frontend calls POST /api/v1/report/generate
   ↓
4. Backend creates QUEUED report job
   ↓
5. React component shows ReportProgress overlay
   ↓
6. Frontend polls GET /api/v1/report/jobs/:id
   ↓
7. Backend background process:
   a. Load financial data from Prisma
   b. Call Gemini for each section
   c. Generate PDF via PDFKit
   d. Save to disk
   e. Update status to COMPLETED
   ↓
8. Frontend detects COMPLETED, shows download button
   ↓
9. User downloads PDF from GET /api/v1/report/jobs/:id/download
```

### Security

- **Multi-tenant**: All DB queries include `where: { companyId }`
- **Auth**: JWT required via existing `JwtAuthGuard`
- **Role-based**: ADMIN/USER can generate, ADMIN/USER/READER can view
- **File paths**: Generated PDFs stored in company-scoped directories

## Configuration

### Environment Variables

Add to `apps/backend/.env`:
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=mistralai/mistral-7b-instruct
```

### Rate Limiting

- OpenRouter model limits depend on your account and selected model
- Backend respects with 1-second delays between section generation
- Frontend polls every 2 seconds for updates

## Usage

### Integrating into Your Page

```tsx
import { ReportWizard } from '../features/report';

export function MyPage() {
  return (
    <ReportWizard 
      onSuccess={(reportId) => {
        console.log('Report started:', reportId);
      }}
    />
  );
}
```

### From Reports Page
The existing Reports.tsx page can be augmented to include the wizard:

```tsx
import { useState } from 'react';
import { ReportWizard } from '../features/report';

export const ReportsPage = () => {
  const [showWizard, setShowWizard] = useState(false);

  if (showWizard) {
    return <ReportWizard onSuccess={() => setShowWizard(false)} />;
  }

  return (
    <>
      <button onClick={() => setShowWizard(true)}>New Report</button>
      {/* existing reports list */}
    </>
  );
};
```

## Testing Checklist

- [ ] All 7 steps render correctly
- [ ] Validation works for each step
- [ ] Back/Next navigation works
- [ ] Form state persists during navigation
- [ ] Report generation API call succeeds
- [ ] Real-time progress updates display
- [ ] PDF download works after completion
- [ ] Multi-language UI (EN, FR, AR)
- [ ] Error handling and user feedback
- [ ] Mobile responsive design
- [ ] Works with all report types
- [ ] Respects Gemini rate limits

## Future Enhancements

1. **Save Draft Reports** - Allow users to save and resume draft reports
2. **Report Templates** - Pre-configured report recipes
3. **Email Notifications** - Send completed PDF via email
4. **Report History** - Archive and re-run previous reports
5. **Batch Operations** - Generate multiple reports at once
6. **Custom Branding** - Add company logo to PDF
7. **Advanced Analytics** - ML-powered trend detection in reports
8. **Collaborative Reviews** - Comment and share draft reports

## Troubleshooting

### SSE Not Working
- Falls back to polling automatically
- Check browser console for error messages
- Ensure backend supports `@Sse` decorator

### Gemini API Errors
- Check `GEMINI_API_KEY` is set correctly
- Verify API quota/billing
- Check rate limits (15 RPM for free tier)
- Review `GeminiService` error handling

### PDF Download Fails
- Ensure `reports/` directory is writable
- Check file permissions
- Verify report reached COMPLETED status

### Translations Missing
- Check i18n locale files have all keys
- Verify namespace paths match component usage
- Run build to ensure no missing keys

## Performance Considerations

- **Large Reports**: 30-page reports may take 5+ minutes
- **Concurrent Generation**: PostgreSQL should handle concurrent writes
- **File Storage**: Consider cleanup strategy for old reports
- **Network**: Large PDF downloads may need timeouts adjusted

## Security Notes

- Validate all user input server-side
- Sanitize Gemini output before PDF rendering
- Store PDFs in private directory, never expose path to frontend
- Consider encrypting sensitive financial data in reports
- Implement audit logging for report access
