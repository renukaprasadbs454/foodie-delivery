import { useCallback, useState } from 'react';
import { useGetRestaurantsQuery } from '../../../api/endpoints/restaurantsApi';
import { MOCK_RESTAURANTS } from '../mockData';
import type { RestaurantListParams, RestaurantSummary } from '../types';

type FeedArgs = Omit<RestaurantListParams, 'page' | 'size'> & {
  size?: number;
  userLatitude?: number;
  userLongitude?: number;
};

export function useRestaurantFeed(args: FeedArgs) {
  const queryResult = useGetRestaurantsQuery({
    cuisineType: args.cuisineType,
    search: args.search,
    sort: args.sort,
    lat: args.userLatitude,
    lng: args.userLongitude,
  });

  const apiItems = queryResult.data;
  const items: RestaurantSummary[] = (apiItems && apiItems.length > 0) ? apiItems : MOCK_RESTAURANTS;

  return {
    items,
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
    onLoadMore: () => { },
    hasMore: false,
  };
}
