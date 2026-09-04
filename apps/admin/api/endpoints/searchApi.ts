import { baseApi } from '../baseApi';

export interface GlobalSearchRestaurant {
  id: string;
  name: string;
  cuisineType?: string;
  rating?: number;
  isAvailable?: boolean;
  address?: string;
  imageS3Key?: string;
}

export interface GlobalSearchFoodItem {
  id: string;
  name: string;
  description?: string;
  basePrice?: number;
  isVeg?: boolean;
  isAvailable?: boolean;
  categoryName?: string;
  restaurantId?: string;
}

export interface GlobalSearchResponse {
  restaurants?: GlobalSearchRestaurant[];
  foodItems?: GlobalSearchFoodItem[];
}

export const searchApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    searchGlobal: builder.query<GlobalSearchResponse, string>({
      query: (q) => `/api/bff/search/global?query=${encodeURIComponent(q)}`,
      keepUnusedDataFor: 30,
    }),
  }),
});

export const { useLazySearchGlobalQuery } = searchApi;
