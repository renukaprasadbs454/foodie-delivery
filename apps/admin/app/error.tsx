'use client';

import { ErrorBoundaryFallback } from 'foodie-shared-web';

/**
 * Root error tier — Blueprint §27.2.
 */
export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryFallback title="Something went wrong" onAction={reset} />;
}
