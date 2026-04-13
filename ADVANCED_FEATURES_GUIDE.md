# Advanced Features Implementation Guide

This guide covers Tasks 11-13: Predictive Analytics, Notification System, and Report Generation.

---

## 📋 Task 11: Build Predictive Analytics Dashboard

### Overview
Add AI-powered forecasts and predictions to the dashboard using your existing ML engine.

### Step 1: Create Prediction Types

**File:** `apps/frontend/src/types/prediction.ts`

```typescript
export interface PredictionResult {
  hasPrediction: boolean;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  predictions?: ForecastData[];
  valuations?: ValuationScenario[];
  scenarios?: ScenarioData;
  confidence?: number;
  featureImportance?: FeatureImportance[];
  error?: string;
}

export interface ForecastData {
  period: string;
  revenue: number;
  revenueLower: number;  // Confidence interval
  revenueUpper: number;
  expenses: number;
  expensesLower: number;
  expensesUpper: number;
  cashflow: number;
}

export interface ValuationScenario {
  scenario: 'optimistic' | 'base' | 'pessimistic';
  enterpriseValue: number;
  equityValue: number;
  probability: number;
}

export interface ScenarioData {
  optimistic: number;
  base: number;
  pessimistic: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;  // 0-1
}
```

### Step 2: Create Predictive Forecast Component

**File:** `apps/frontend/src/components/dashboard/PredictiveForecast.tsx`

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ForecastData } from '../../types/prediction';

interface PredictiveForecastProps {
  data: ForecastData[];
  historicalData: any[];
  confidence: number;
}

export const PredictiveForecast = ({ data, historicalData, confidence }: PredictiveForecastProps) => {
  const { t } = useTranslation();

  if (!data || data.length === 0) return null;

  // Calculate growth trend
  const firstForecast = data[0];
  const lastForecast = data[data.length - 1];
  const growthRate = ((lastForecast.revenue - firstForecast.revenue) / firstForecast.revenue * 100).toFixed(1);
  const isPositive = lastForecast.revenue > firstForecast.revenue;

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-text-main">
            {t('dashboard.prediction.title', 'Revenue Forecast')}
          </h3>
          <p className="text-sm text-text-muted mt-1">
            {t('dashboard.prediction.subtitle', 'AI-powered prediction with confidence intervals')}
          </p>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isPositive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
        }`}>
          {isPositive ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
          {growthRate}%
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className="mb-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">
            {t('dashboard.prediction.confidence', 'Model Confidence')}: {(confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={[...historicalData, ...data]}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="period" 
              className="text-text-muted"
              tick={{ fontSize: 12 }}
            />
            <YAxis className="text-text-muted" tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
              }}
            />
            <ReferenceLine x={historicalData.length - 1} stroke="var(--color-brand)" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
            <Line
              type="monotone"
              dataKey="revenueUpper"
              stroke="#8884d8"
              strokeDasharray="3 3"
              strokeWidth={1}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="revenueLower"
              stroke="#8884d8"
              strokeDasharray="3 3"
              strokeWidth={1}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full" />
          <span>{t('dashboard.prediction.predicted', 'Predicted Revenue')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500/30 rounded-full" />
          <span>{t('dashboard.prediction.confidenceBand', 'Confidence Interval')}</span>
        </div>
      </div>
    </div>
  );
};
```

### Step 3: Add Anomaly Detection Component

**File:** `apps/frontend/src/components/dashboard/AnomalyAlerts.tsx`

```typescript
import { AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Anomaly {
  id: string;
  metric: string;
  date: string;
  actualValue: number;
  expectedValue: number;
  percentageChange: number;
  severity: 'high' | 'medium' | 'low';
}

interface AnomalyAlertsProps {
  anomalies: Anomaly[];
}

export const AnomalyAlerts = ({ anomalies }: AnomalyAlertsProps) => {
  const { t } = useTranslation();

  if (!anomalies || anomalies.length === 0) return null;

  return (
    <div className="space-y-3">
      {anomalies.map((anomaly) => (
        <div
          key={anomaly.id}
          className={`p-4 border rounded-lg flex items-start gap-3 ${
            anomaly.severity === 'high'
              ? 'bg-red-500/5 border-red-500/20'
              : anomaly.severity === 'medium'
              ? 'bg-yellow-500/5 border-yellow-500/20'
              : 'bg-blue-500/5 border-blue-500/20'
          }`}
        >
          <AlertTriangle
            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              anomaly.severity === 'high'
                ? 'text-red-600'
                : anomaly.severity === 'medium'
                ? 'text-yellow-600'
                : 'text-blue-600'
            }`}
          />
          
          <div className="flex-1">
            <p className="text-sm font-medium text-text-main">
              {anomaly.metric} anomaly detected
            </p>
            <p className="text-xs text-text-muted mt-1">
              On {anomaly.date}, {anomaly.metric} was {anomaly.actualValue.toLocaleString()},
              which is {Math.abs(anomaly.percentageChange).toFixed(1)}%{' '}
              {anomaly.percentageChange > 0 ? 'higher' : 'lower'} than expected.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 📋 Task 12: Implement Notification System

### Step 1: Add Notification Model to Prisma

**File:** `apps/backend/prisma/schema.prisma`

Add these models to your schema:

```prisma
// Notification model
model Notification {
  id        String             @id @default(uuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  read      Boolean            @default(false)
  link      String?
  createdAt DateTime           @default(now())

  @@index([userId, read, createdAt])
}

enum NotificationType {
  IMPORT_SUCCESS
  VALUATION_COMPLETE
  PREDICTION_READY
  ANOMALY_DETECTED
  TEAM_INVITE
  SYSTEM_ALERT
}
```

Run migration:
```bash
cd apps/backend
npx prisma migrate dev --name add_notifications
```

### Step 2: Create Notification Service

**File:** `apps/backend/src/notification/notification.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from 'nestjs-pino';

export type NotificationType = 
  | 'IMPORT_SUCCESS'
  | 'VALUATION_COMPLETE'
  | 'PREDICTION_READY'
  | 'ANOMALY_DETECTED'
  | 'TEAM_INVITE'
  | 'SYSTEM_ALERT';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
  ) {
    this.logger.info({
      msg: 'Creating notification',
      userId,
      type,
    });

    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
      },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async getUserNotifications(userId: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.update({
      where: {
        id: notificationId,
        userId,
      },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });
  }
}
```

### Step 3: Create Notification Bell Component

**File:** `apps/frontend/src/components/NotificationBell.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/axios';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const NotificationBell = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        api.get('/notification').then(r => r.data),
        api.get('/notification/unread-count').then(r => r.data.count),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    await api.post(`/notification/${id}/read`);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await api.post('/notification/read-all');
    fetchNotifications();
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-text-muted hover:text-text-main hover:bg-elevated rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-text-main">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-brand hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-text-muted">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-border last:border-0 ${
                    !notif.read ? 'bg-brand/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-main">
                        {notif.title}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {notif.message}
                      </p>
                      <p className="text-xs text-text-muted mt-2">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="p-1 text-text-muted hover:text-brand"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 📋 Task 13: Add Advanced Report Generation

### Step 1: Create PDF Report Service

**File:** `apps/frontend/src/lib/report.generator.ts`

```typescript
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate } from './formatters';

interface DashboardMetrics {
  chartData: any[];
  strategicKpis: {
    cac: number;
    ltv: number;
    tam: number;
    marketShare: number;
  };
}

/**
 * Generate executive summary PDF report
 */
export const generateExecutiveSummary = async (
  companyName: string,
  metrics: DashboardMetrics,
  period: string,
): Promise<Blob> => {
  const doc = new jsPDF();
  
  // Company logo/title
  doc.setFontSize(24);
  doc.setTextColor(33, 33, 33);
  doc.text('Executive Summary', 105, 30, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(companyName, 105, 40, { align: 'center' });
  doc.text(`Period: ${period}`, 105, 48, { align: 'center' });
  
  // Key Metrics Section
  doc.setFontSize(16);
  doc.setTextColor(33, 33, 33);
  doc.text('Key Performance Indicators', 14, 65);
  
  // KPI Table
  const kpiData = [
    ['Customer Acquisition Cost (CAC)', formatCurrency(metrics.strategicKpis.cac)],
    ['Lifetime Value (LTV)', formatCurrency(metrics.strategicKpis.ltv)],
    ['LTV/CAC Ratio', (metrics.strategicKpis.ltv / metrics.strategicKpis.cac).toFixed(2)],
    ['Total Addressable Market', formatCurrency(metrics.strategicKpis.tam)],
    ['Market Share', `${metrics.strategicKpis.marketShare}%`],
  ];
  
  (doc as any).autoTable({
    startY: 70,
    head: [['Metric', 'Value']],
    body: kpiData,
    theme: 'grid',
    styles: { fontSize: 11 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  // Revenue Trend Section
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Revenue Trends', 14, 20);
  
  const revenueData = metrics.chartData.slice(-12).map(d => [
    formatDate(d.month),
    formatCurrency(d.revenue),
    formatCurrency(d.expenses),
    formatCurrency(d.cashflow),
  ]);
  
  (doc as any).autoTable({
    startY: 25,
    head: [['Period', 'Revenue', 'Expenses', 'Cash Flow']],
    body: revenueData,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [34, 197, 94] },
  });
  
  // Summary and recommendations
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Summary & Recommendations', 14, 20);
  
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  
  const recommendations = [
    '• Revenue shows positive growth trend - consider scaling operations',
    '• LTV/CAC ratio is healthy - marketing spend is efficient',
    '• Cash flow remains positive - maintain current trajectory',
    '• Market share growth indicates competitive advantage',
  ];
  
  recommendations.forEach((rec, idx) => {
    doc.text(rec, 14, 30 + idx * 10);
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} by SmartBiz AI`,
    105,
    doc.internal.pageSize.height - 10,
    { align: 'center' },
  );
  
  return doc.output('blob');
};

/**
 * Download PDF report
 */
export const downloadPDFReport = async (
  companyName: string,
  metrics: DashboardMetrics,
  period: string,
) => {
  const blob = await generateExecutiveSummary(companyName, metrics, period);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `executive-summary-${companyName}-${Date.now()}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};
```

### Step 2: Add Export Buttons to Dashboard

**File:** `apps/frontend/src/components/dashboard/ExportButtons.tsx`

```typescript
import { Download, FileText, Table } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { downloadPDFReport } from '../../lib/report.generator';
import { exportToExcel } from '../../lib/export.utils';

interface ExportButtonsProps {
  metrics: any;
  companyName: string;
  period: string;
}

export const ExportButtons = ({ metrics, companyName, period }: ExportButtonsProps) => {
  const { t } = useTranslation();

  const handlePDFExport = async () => {
    try {
      await downloadPDFReport(companyName, metrics, period);
      toast.success(t('dashboard.exportPDF.success', 'PDF report downloaded'));
    } catch (error) {
      toast.error(t('dashboard.exportPDF.error', 'Failed to generate PDF report'));
    }
  };

  const handleExcelExport = async () => {
    try {
      await exportToExcel(metrics, companyName);
      toast.success(t('dashboard.exportExcel.success', 'Excel report downloaded'));
    } catch (error) {
      toast.error(t('dashboard.exportExcel.error', 'Failed to generate Excel report'));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePDFExport}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-main bg-surface border border-border rounded-lg hover:bg-elevated transition-colors"
        title={t('dashboard.exportPDF.tooltip', 'Export as PDF')}
      >
        <FileText className="w-4 h-4" />
        PDF
      </button>
      
      <button
        onClick={handleExcelExport}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-main bg-surface border border-border rounded-lg hover:bg-elevated transition-colors"
        title={t('dashboard.exportExcel.tooltip', 'Export as Excel')}
      >
        <Table className="w-4 h-4" />
        Excel
      </button>
    </div>
  );
};
```

---

## ✅ Implementation Checklist

### Task 11: Predictive Analytics
- [ ] Create prediction types
- [ ] Build PredictiveForecast component
- [ ] Build AnomalyAlerts component
- [ ] Integrate into Dashboard page
- [ ] Add API calls to ML engine
- [ ] Test predictions display correctly

### Task 12: Notification System
- [ ] Add Notification model to Prisma
- [ ] Run database migration
- [ ] Create notification service
- [ ] Create notification controller
- [ ] Build NotificationBell component
- [ ] Add notification polling
- [ ] Test notifications

### Task 13: Report Generation
- [ ] Create report.generator.ts
- [ ] Add jsPDF and dependencies
- [ ] Build ExportButtons component
- [ ] Add to dashboard
- [ ] Test PDF generation
- [ ] Test Excel export

---

## 🚀 Installation Commands

```bash
# Navigate to frontend
cd apps/frontend

# Install dependencies for reports
npm install jspdf jspdf-autotable
```

---

## 📊 Expected Results

### After Task 11 (Predictive Analytics):
✅ Revenue forecast charts with confidence intervals  
✅ AI-powered insights displayed  
✅ Anomaly detection alerts shown  
✅ Model confidence indicators  

### After Task 12 (Notifications):
✅ Notification bell with unread count  
✅ Real-time notification updates  
✅ Mark as read functionality  
✅ Notification history  

### After Task 13 (Reports):
✅ PDF executive summary generation  
✅ Excel export functionality  
✅ Professional report formatting  
✅ One-click download  

---

**Ready to implement!** Start with Task 13 (Reports) as it provides immediate value, then add predictive analytics.
