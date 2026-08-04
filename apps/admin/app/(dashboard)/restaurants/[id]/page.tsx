import { RestaurantDetailsPage } from '@/features/restaurants/pages/RestaurantDetailsPage';

type Props = {
  params: Promise<{ id: string }>;
};

/** AdminRestaurantDetails — `/restaurants/[id]` (P2-ADM-03). */
export default async function AdminRestaurantDetailsRoute({ params }: Props) {
  const { id } = await params;
  return <RestaurantDetailsPage restaurantId={id} />;
}
