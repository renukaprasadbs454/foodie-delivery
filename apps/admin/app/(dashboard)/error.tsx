'use client';

import { ErrorBoundaryFallback } from 'foodie-shared-web';

/**
 * Dashboard error tier — Blueprint §27.2.
 */
export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundaryFallback title="This section hit a problem" onAction={reset} />
  );
}
