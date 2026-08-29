import { useCallback, useState } from 'react';
import { MOCK_RESTAURANTS } from '../mockData';
import type { RestaurantListParams } from '../types';
import { DEFAULT_RESTAURANT_PAGE_SIZE } from '../types';

type FeedArgs = Omit<RestaurantListParams, 'page' | 'size'> & {
  size?: number;
  userLatitude?: number;
  userLongitude?: number;
};

export function useRestaurantFeed(args: FeedArgs) {
  const [isFetching, setIsFetching] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsFetching(true);
    await new Promise(r => setTimeout(r, 800));
    setIsFetching(false);
  }, []);

  const processedItems = [...MOCK_RESTAURANTS]
    .filter(r => {
      const matchCuisine = !args.cuisineType || (r.cuisineTypes || []).includes(args.cuisineType);
      const matchSearch = !args.search || (r.name || '').toLowerCase().includes(args.search.toLowerCase());
      return matchCuisine && matchSearch;
    })
    .sort((a, b) => {
      if (args.sort === 'nearby') {
        const lat = args.userLatitude ?? 12.9716;
        const lng = args.userLongitude ?? 77.5946;
        const distA = Math.hypot((Number(a.latitude) || 12.9716) - lat, (Number(a.longitude) || 77.5946) - lng);
        const distB = Math.hypot((Number(b.latitude) || 12.9716) - lat, (Number(b.longitude) || 77.5946) - lng);
        return distA - distB;
      }
      if (args.sort === 'createdAt') return b.id.localeCompare(a.id);
      return (b.avgRating || 0) - (a.avgRating || 0);
    });

  return {
    items: processedItems,
    isLoading: false,
    isFetching,
    isError: false,
    error: null,
    refetch: onRefresh,
    onLoadMore: () => { },
    hasMore: false,
  };
}
