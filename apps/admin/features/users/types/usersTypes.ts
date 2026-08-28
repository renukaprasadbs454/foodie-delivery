import type { AdminRole } from 'foodie-shared-web';

export type UserAccountStatus = 'ACTIVE' | 'SUSPENDED';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: AdminRole;
  accountStatus: UserAccountStatus;
  joinedDate: string;
  lastActive: string;
  department: string;
  avatarUrl?: string;
}

export function formatRoleBadge(role: AdminRole): { label: string; color: string; bg: string; border: string } {
  switch (role) {
    case 'SUPER_ADMIN':
      return { label: 'SUPER ADMIN', color: '#7C3AED', bg: '#F3E8FF', border: '#D8B4FE' };
    case 'OPS':
      return { label: 'OPERATIONS', color: '#047857', bg: '#D1FAE5', border: '#6EE7B7' };
    case 'FINANCE':
      return { label: 'FINANCE', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' };
    case 'SUPPORT':
      return { label: 'SUPPORT DESK', color: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD' };
    default:
      return { label: role, color: '#475569', bg: '#F1F5F9', border: '#CBD5E1' };
  }
}

export function formatStatusBadge(status: UserAccountStatus): { label: string; color: string; bg: string } {
  return status === 'ACTIVE'
    ? { label: '● Active', color: '#166534', bg: '#DCFCE7' }
    : { label: '○ Suspended', color: '#DC2626', bg: '#FEE2E2' };
}
