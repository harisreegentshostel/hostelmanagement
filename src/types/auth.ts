import type { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'kitchen_staff' | 'resident';

export interface ResidentRecord {
  id: string;
  admission_no: number;
  name: string;
  id_proof_url: string | null;
  room_no: string;
  bed_no: string;
  caution_deposit: number;
  monthly_fee: number;
  pending: number;
  joining_date: string;
  next_fee_payment_date?: string | null;
  fee_due_day?: number | null;
  last_fee_applied_date?: string | null;
  mobile_no: string;
  email: string;
  meals_per_day?: number | null;
  created_at: string;
  updated_at?: string;
}

export type FeeTransactionType = 'MONTHLY_FEE' | 'PAYMENT' | 'INITIAL_PENDING' | 'ADJUSTMENT';

export interface FeeTransaction {
  id: string;
  resident_id: string;
  type: FeeTransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string | null;
  billing_date?: string | null;
  payment_method?: string | null;
  receipt_no?: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  avatarUrl?: string;
  resident?: ResidentRecord;
}

/**
 * Resolves the role strictly from Supabase app_metadata (tamper-proof).
 * user_metadata is client-writable in Supabase and CANNOT elevate to admin or staff.
 */
export function resolveUserRole(user: User | null): UserRole {
  if (!user) return 'resident';

  // 1. Authoritative check: ONLY app_metadata can grant staff or admin privileges
  const appRole = user.app_metadata?.role;
  if (appRole) {
    const normalized = String(appRole).toLowerCase().trim();
    if (normalized === 'admin') return 'admin';
    if (normalized === 'kitchen_staff' || normalized === 'kitchen' || normalized === 'staff') {
      return 'kitchen_staff';
    }
  }

  // 2. Fallback check for designated staff accounts
  const userEmail = (user.email || '').toLowerCase().trim();
  if (userEmail === 'admin@harisreehostel.com' || userEmail === 'harisreehostel@admin.com') return 'admin';
  if (userEmail === 'kitchen@harisreehostel.com' || userEmail === 'harisreehostel@staff.com') return 'kitchen_staff';

  // 3. All other accounts are strictly resident level
  return 'resident';
}

export function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'kitchen_staff':
      return '/kitchen';
    case 'resident':
      return '/resident';
    default:
      return '/login';
  }
}
