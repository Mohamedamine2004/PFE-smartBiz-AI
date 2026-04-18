import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface ChartDataConfig {
  chartType: 'bar' | 'line' | 'pie';
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }>;
}

interface ReportChartProps {
  data: ChartDataConfig;
  height?: number;
}

const PALETTE = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const toColor = (value: string | string[] | undefined, fallback: string): string => {
  if (!value) return fallback;
  return Array.isArray(value) ? value[0] ?? fallback : value;
};

export const ReportChart = ({ data, height = 300 }: ReportChartProps) => {
  const chartData = useMemo(() => {
    if (data.chartType === 'pie') {
      // For pie charts, transform data differently
      return data.labels.map((label, i) => {
        const values = data.datasets[0]?.data || [];
        return {
          name: label,
          value: values[i] || 0,
          fill: PALETTE[i % PALETTE.length],
        };
      });
    }
    // For bar and line charts
    return data.labels.map((label, i) => {
      const row: Record<string, any> = { name: label };
      data.datasets.forEach((dataset, datasetIndex) => {
        row[`${dataset.label}_${datasetIndex}`] = dataset.data[i] || 0;
      });
      return row;
    });
  }, [data]);

  if (data.chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {data.datasets.map((dataset, index) => (
            <Bar
              key={dataset.label}
              dataKey={`${dataset.label}_${index}`}
              fill={toColor(dataset.backgroundColor, PALETTE[index % PALETTE.length])}
              name={dataset.label}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (data.chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {data.datasets.map((dataset, index) => (
            <Line
              key={dataset.label}
              type="monotone"
              dataKey={`${dataset.label}_${index}`}
              stroke={toColor(dataset.backgroundColor, PALETTE[index % PALETTE.length])}
              name={dataset.label}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Pie chart
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${name}: ${value}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill || PALETTE[index % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Utility function to extract chart data from Gemini response
export const extractChartFromResponse = (response: string): ChartDataConfig | null => {
  try {
    const match = response.match(/```json_chart\n?([\s\S]*?)\n?```/);
    if (!match || !match[1]) return null;
    const parsed = JSON.parse(match[1]);
    return parsed as ChartDataConfig;
  } catch {
    return null;
  }
};

// Helper to generate a revenue chart from financial data
export const generateRevenueChart = (
  revenues: { label: string; value: number }[],
): ChartDataConfig => {
  return {
    chartType: 'bar',
    title: 'Revenue Growth Trend',
    labels: revenues.map((r) => r.label),
    datasets: [
      {
        label: 'Revenue',
        data: revenues.map((r) => r.value),
        backgroundColor: '#2563EB',
      },
    ],
  };
};
