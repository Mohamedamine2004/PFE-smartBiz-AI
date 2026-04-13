interface SkeletonCardProps {
  /** Number of KPI-style metric items */
  metrics?: number;
  /** Whether to show a chart placeholder */
  showChart?: boolean;
  className?: string;
}

/**
 * Skeleton card — simulates a loading dashboard card with metrics.
 */
export const SkeletonCard = ({ metrics = 4, showChart = false, className = '' }: SkeletonCardProps) => (
  <div className={`card p-6 border border-border rounded-lg bg-background ${className}`}>
    {/* Card header */}
    <div className="h-5 w-40 rounded-md bg-elevated/60 animate-pulse mb-4" />

    {/* Metrics grid */}
    {metrics > 0 && (
      <div className={`grid gap-4 ${metrics <= 2 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {Array.from({ length: metrics }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 rounded bg-elevated/60 animate-pulse" />
            <div className="h-7 w-28 rounded bg-elevated/60 animate-pulse" />
          </div>
        ))}
      </div>
    )}

    {/* Chart placeholder */}
    {showChart && (
      <div className="mt-6 h-48 w-full rounded-lg bg-elevated/40 animate-pulse" />
    )}
  </div>
);
