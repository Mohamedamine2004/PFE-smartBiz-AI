import { Loader2 } from 'lucide-react';

interface SkeletonPageProps {
  showSpinner?: boolean;
  /** Whether to show a header skeleton */
  showHeader?: boolean;
  /** Number of skeleton cards to show */
  cards?: number;
}

/**
 * Full-page skeleton — used as a Suspense fallback or during initial data load.
 */
export const SkeletonPage = ({ showSpinner = true, showHeader = true, cards = 2 }: SkeletonPageProps) => (
  <div className="space-y-5 page-animate">
    {/* Spinner (optional) */}
    {showSpinner && (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
    )}

    {/* Header skeleton */}
    {showHeader && (
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-md bg-elevated/60 animate-pulse" />
        <div className="h-4 w-80 rounded-md bg-elevated/40 animate-pulse" />
      </div>
    )}

    {/* Card skeletons */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="card p-6 border border-border rounded-lg bg-background h-64"
        >
          <div className="h-5 w-40 rounded-md bg-elevated/60 animate-pulse mb-4" />
          <div className="h-full w-full rounded-lg bg-elevated/30 animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);
