interface SkeletonChartProps {
  height?: string;
  className?: string;
}

/**
 * Skeleton chart placeholder — simulates a loading chart area.
 */
export const SkeletonChart = ({ height = 'h-64', className = '' }: SkeletonChartProps) => (
  <div className={`card p-6 border border-border rounded-lg bg-background ${className}`}>
    <div className="h-5 w-48 rounded-md bg-elevated/60 animate-pulse mb-4" />
    <div className={`${height} w-full rounded-lg bg-elevated/40 animate-pulse`} />
  </div>
);
