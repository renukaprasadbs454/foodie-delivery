import { baseApi } from '../baseApi';
import type {
  SubmitReviewArg,
  SubmittedReview,
} from '../../features/reviews/types';

/**
 * Review submit RTK — P2-CUS-08 (list uses restaurantsApi.getRestaurantReviews).
 */
export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitReview: builder.mutation<SubmittedReview, SubmitReviewArg>({
      query: ({ orderId, restaurantRating, deliveryRating, comment }) => ({
        url: `/api/v1/orders/${orderId}/review`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          restaurantRating,
          deliveryRating: deliveryRating ?? null,
          comment: comment?.trim() ? comment.trim() : null,
        },
      }),
      invalidatesTags: (result) => [
        { type: 'Order', id: result?.orderId ?? 'LIST' },
        { type: 'Review', id: result?.restaurantId ? `LIST-${result.restaurantId}` : 'LIST' },
        { type: 'Review', id: 'LIST' },
      ],
    }),
  }),
});

export const { useSubmitReviewMutation } = reviewsApi;
