import { UserManagementStudio } from '@/features/users/components/UserManagementStudio';

export const metadata = {
  title: 'Platform Users | Foodie Admin',
  description: 'Manage platform administrative users, role privileges, and staff directory',
};

export default function UsersPage() {
  return <UserManagementStudio />;
}
