import { OrderDetailsPage } from '@/features/orders/pages/OrderDetailsPage';

type Props = {
  params: Promise<{ id: string }>;
};

/** Admin order detail + override — `/orders/[id]` (P2-ADM-04). */
export default async function AdminOrderDetailsRoute({ params }: Props) {
  const { id } = await params;
  return <OrderDetailsPage orderId={id} />;
}
