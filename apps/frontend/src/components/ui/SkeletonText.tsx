interface SkeletonTextProps {
  lines?: number;
  width?: string;
  height?: string;
  className?: string;
}

/**
 * Skeleton text placeholder — simulates loading text content.
 */
export const SkeletonText = ({ lines = 1, width = 'w-full', height = 'h-4', className = '' }: SkeletonTextProps) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`${height} ${i === lines - 1 ? width : 'w-full'} rounded-md bg-elevated/60 animate-pulse`}
        style={{ animationDelay: `${i * 80}ms` }}
      />
    ))}
  </div>
);
