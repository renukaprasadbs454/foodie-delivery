import { Suspense } from 'react';
import { ReviewsPage } from '@/features/reviews/pages/ReviewsPage';

/** AdminReviews — GAP-API-20 Partial (P2-ADM-05). */
export default function AdminReviewsRoute() {
  return (
    <Suspense fallback={<div>Loading reviews…</div>}>
      <ReviewsPage />
    </Suspense>
  );
}
