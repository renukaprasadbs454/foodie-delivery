import { CustomerManagementStudio } from '@/features/customers/components/CustomerManagementStudio';

export const metadata = {
  title: 'Customers & Support | Foodie Admin',
  description: 'Manage customer accounts, lifetime value, security blocks, and support tickets',
};

export default function CustomersPage() {
  return <CustomerManagementStudio />;
}
