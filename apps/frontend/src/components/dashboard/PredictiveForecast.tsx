import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ForecastData {
  period: string;
  revenue: number;
  revenueLower: number;
  revenueUpper: number;
  expenses: number;
  cashflow: number;
}

interface PredictiveForecastProps {
  data: ForecastData[];
  historicalData: any[];
  confidence: number;
}

/**
 * Predictive forecast chart with confidence intervals.
 */
export const PredictiveForecast = ({ data, historicalData, confidence }: PredictiveForecastProps) => {
  const { t } = useTranslation();

  if (!data || data.length === 0) return null;

  // Calculate growth trend
  const firstForecast = data[0];
  const lastForecast = data[data.length - 1];
  const growthRate = ((lastForecast.revenue - firstForecast.revenue) / firstForecast.revenue * 100).toFixed(1);
  const isPositive = lastForecast.revenue > firstForecast.revenue;

  // Combine historical and forecast data
  const chartData = [
    ...historicalData.map(d => ({
      ...d,
      actualRevenue: d.revenue,
      forecastRevenue: null,
      revenueUpper: null,
      revenueLower: null,
    })),
    ...data.map(d => ({
      ...d,
      actualRevenue: null,
      forecastRevenue: d.revenue,
      revenueUpper: d.revenueUpper,
      revenueLower: d.revenueLower,
    })),
  ];

  return (
    <div className="card p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 lg:mb-6">
        <div>
          <h3 className="text-base lg:text-lg font-semibold text-text-main">
            {t('dashboard.prediction.title', 'Revenue Forecast')}
          </h3>
          <p className="text-xs lg:text-sm text-text-muted mt-1">
            {t('dashboard.prediction.subtitle', 'AI-powered prediction with confidence intervals')}
          </p>
        </div>
        
        <div className={`px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-medium ${
          isPositive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
        }`}>
          {isPositive ? <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4 inline mr-1" /> : <TrendingDown className="w-3 h-3 lg:w-4 lg:h-4 inline mr-1" />}
          {growthRate}%
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className="mb-3 lg:mb-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-xs lg:text-sm font-medium text-blue-700">
            {t('dashboard.prediction.confidence', 'Model Confidence')}: {(confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 lg:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="period" 
              className="text-text-muted"
              tick={{ fontSize: 11 }}
            />
            <YAxis className="text-text-muted" tick={{ fontSize: 11 }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
              }}
            />
            {historicalData.length > 0 && (
              <ReferenceLine 
                x={historicalData[historicalData.length - 1]?.period} 
                stroke="var(--color-brand)" 
                strokeDasharray="3 3" 
              />
            )}
            <Area
              type="monotone"
              dataKey="forecastRevenue"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorForecast)"
              name="Forecast"
            />
            <Area
              type="monotone"
              dataKey="actualRevenue"
              stroke="#10b981"
              fill="none"
              name="Actual"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 lg:gap-6 text-xs lg:text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span>{t('dashboard.prediction.actual', 'Actual Revenue')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full" />
          <span>{t('dashboard.prediction.predicted', 'Predicted Revenue')}</span>
        </div>
      </div>
    </div>
  );
};
