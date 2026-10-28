import { supabase } from './supabase';
import type { ResidentRecord, FeeTransaction } from '../types/auth';

/**
 * Returns today's local date string formatted as YYYY-MM-DD.
 */
export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Clamps day of month to valid days in given year/month.
 * E.g., day 31 in November (30 days) becomes November 30.
 */
export function clampDayOfMonth(year: number, monthIndex: number, targetDay: number): string {
  const normalizedYear = year + Math.floor(monthIndex / 12);
  const normalizedMonthIndex = ((monthIndex % 12) + 12) % 12;
  const maxDays = new Date(normalizedYear, normalizedMonthIndex + 1, 0).getDate();
  const validDay = Math.min(Math.max(1, targetDay), maxDays);
  const m = String(normalizedMonthIndex + 1).padStart(2, '0');
  const d = String(validDay).padStart(2, '0');
  return `${normalizedYear}-${m}-${d}`;
}

/**
 * Advances a date by 1 month, preserving the resident's fixed due day.
 * If targetDay is not provided, extracts day from currentDateStr.
 */
export function advanceOneMonth(currentDateStr: string, fixedDay?: number | null): string {
  try {
    const parts = currentDateStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const year = parts[0];
      const monthIndex = parts[1] - 1; // 0-indexed
      const targetDay = fixedDay && fixedDay >= 1 && fixedDay <= 31 ? fixedDay : parts[2];

      const nextMonthIndex = (monthIndex + 1) % 12;
      const nextYear = monthIndex === 11 ? year + 1 : year;

      return clampDayOfMonth(nextYear, nextMonthIndex, targetDay);
    }
  } catch {}

  const d = new Date(currentDateStr);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

/**
 * Formats a date into a human readable string (e.g. "10 Oct 2026").
 */
export function formatReadableDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (year && month && day) {
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {}
  return dateStr;
}

/**
 * Returns ordinal string for a day (e.g. 1st, 2nd, 3rd, 10th).
 */
export function getDayOrdinal(day: number): string {
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

/**
 * Calculates how many days a resident's fee has been pending past their due date.
 * Returns 0 if there are no pending fees or if the due date has not arrived yet.
 */
export function calculatePendingDays(resident: ResidentRecord): number {
  const pending = Number(resident.pending || 0);
  if (pending <= 0) return 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. If next_fee_payment_date is in the past or today, calculate days from it
  if (resident.next_fee_payment_date) {
    const parts = resident.next_fee_payment_date.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const targetDate = new Date(year, month, day);

      if (targetDate <= today) {
        const diffMs = today.getTime() - targetDate.getTime();
        return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }
    }
  }

  // 2. Determine fixed due day of the month
  let dueDay = resident.fee_due_day;
  if (!dueDay || dueDay < 1 || dueDay > 31) {
    if (resident.next_fee_payment_date) {
      const parts = resident.next_fee_payment_date.split('-');
      if (parts[2]) {
        dueDay = parseInt(parts[2], 10);
      }
    }
  }
  if (!dueDay || dueDay < 1 || dueDay > 31) {
    dueDay = 5; // Default 5th of every month
  }

  // 3. Find the most recent due date that has already arrived
  let mostRecentDueDate: Date;
  if (today.getDate() >= dueDay) {
    // Due date was earlier this month (e.g., today 28th, due 5th -> 23 days)
    mostRecentDueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
  } else {
    // Due date was in the previous month
    mostRecentDueDate = new Date(today.getFullYear(), today.getMonth() - 1, dueDay);
  }

  const diffMs = today.getTime() - mostRecentDueDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  return diffDays;
}

/**
 * Core Automation Engine:
 * Processes all residents whose fixed due date has arrived (next_fee_payment_date <= today).
 * Automatically accumulates: Total Due = Existing Pending Fees + Current Month's Monthly Fee.
 * Advances next_fee_payment_date to the next fixed monthly cycle.
 * Logs each transaction in fee_transactions to guarantee idempotency and preserve audit history.
 */
export async function processAllMonthlyFees(): Promise<{
  updatedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let updatedCount = 0;

  // 1. Try Supabase RPC first if configured
  try {
    const { data: rpcCount, error: rpcError } = await supabase.rpc('process_all_monthly_fees');
    if (!rpcError && typeof rpcCount === 'number') {
      return { updatedCount: rpcCount, errors: [] };
    }
  } catch {
    // Fall back to client-side automated processing
  }

  // 2. Client-side fallback with Supabase REST queries
  try {
    const todayStr = getTodayDateStr();

    // Fetch all active residents
    const { data: residents, error: fetchErr } = await supabase
      .from('residents')
      .select('*');

    if (fetchErr || !residents) {
      return { updatedCount: 0, errors: [fetchErr?.message || 'Failed to fetch residents'] };
    }

    for (const resident of residents as ResidentRecord[]) {
      const monthlyFee = Number(resident.monthly_fee || 0);
      if (monthlyFee <= 0) continue;

      let nextDue = resident.next_fee_payment_date;

      // Extract or determine fixed due day
      let fixedDay = resident.fee_due_day;
      if (!fixedDay || fixedDay < 1 || fixedDay > 31) {
        if (nextDue) {
          const parts = nextDue.split('-');
          fixedDay = parts[2] ? parseInt(parts[2], 10) : 5;
        } else {
          fixedDay = 5;
        }
      }

      // If next_fee_payment_date is missing, initialize it from joining_date or today
      if (!nextDue) {
        const baseDate = resident.joining_date || todayStr;
        nextDue = advanceOneMonth(baseDate, fixedDay);
      }

      let currentPending = Number(resident.pending || 0);
      let appliedForResident = false;
      let lastApplied = resident.last_fee_applied_date || null;

      // Fetch existing fee transaction billing dates for this resident to guarantee idempotency
      let existingBillingDates: Set<string> = new Set();
      try {
        const { data: txData } = await supabase
          .from('fee_transactions')
          .select('billing_date')
          .eq('resident_id', resident.id)
          .eq('type', 'MONTHLY_FEE');

        if (txData) {
          existingBillingDates = new Set(txData.map((t) => t.billing_date).filter(Boolean));
        }
      } catch {
        // Table may not exist yet or no transactions
      }

      // Process any due dates that have arrived up to today
      while (nextDue && nextDue <= todayStr) {
        const billingCycleDate = nextDue;

        // Skip if already billed for this exact cycle date
        if (!existingBillingDates.has(billingCycleDate)) {
          const balanceBefore = currentPending;
          currentPending = currentPending + monthlyFee;
          const balanceAfter = currentPending;

          const monthName = new Date(billingCycleDate).toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric',
          });

          // Insert transaction ledger record
          try {
            await supabase.from('fee_transactions').insert([
              {
                resident_id: resident.id,
                type: 'MONTHLY_FEE',
                amount: monthlyFee,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                billing_date: billingCycleDate,
                description: `Monthly hostel fee added for ${monthName}`,
                created_at: new Date().toISOString(),
              },
            ]);
          } catch (txErr: any) {
            console.warn('Could not insert fee_transaction record:', txErr);
          }

          existingBillingDates.add(billingCycleDate);
          lastApplied = billingCycleDate;
          appliedForResident = true;
        }

        // Advance to next month's fixed due date
        nextDue = advanceOneMonth(nextDue, fixedDay);
      }

      // Update resident record if fee was applied or due date advanced
      if (appliedForResident || nextDue !== resident.next_fee_payment_date) {
        const updatePayload: Record<string, any> = {
          pending: currentPending,
          next_fee_payment_date: nextDue,
          fee_due_day: fixedDay,
          last_fee_applied_date: lastApplied,
          updated_at: new Date().toISOString(),
        };

        const { error: updateErr } = await supabase
          .from('residents')
          .update(updatePayload)
          .eq('id', resident.id);

        if (updateErr) {
          // If columns fee_due_day or last_fee_applied_date are missing in DB, retry with pending and next_fee_payment_date
          if (
            updateErr.message.includes('fee_due_day') ||
            updateErr.message.includes('last_fee_applied_date')
          ) {
            delete updatePayload.fee_due_day;
            delete updatePayload.last_fee_applied_date;
            await supabase
              .from('residents')
              .update(updatePayload)
              .eq('id', resident.id);
          } else {
            errors.push(`Resident ${resident.name}: ${updateErr.message}`);
          }
        } else {
          updatedCount++;
        }
      }
    }
  } catch (err: any) {
    errors.push(err.message || 'Error processing monthly fees');
  }

  return { updatedCount, errors };
}

/**
 * Records a resident fee payment, deducts the paid amount from the pending balance,
 * and saves a receipt transaction record in fee_transactions.
 */
export async function recordResidentPayment(params: {
  residentId: string;
  amount: number;
  paymentMethod: 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'CARD';
  description?: string;
  receiptNo?: string;
  paymentDate?: string;
}): Promise<{
  success: boolean;
  newBalance: number;
  receiptNo: string;
  error?: string;
}> {
  const { residentId, amount, paymentMethod, description, paymentDate } = params;

  if (amount <= 0) {
    return { success: false, newBalance: 0, receiptNo: '', error: 'Payment amount must be greater than 0' };
  }

  try {
    // 1. Fetch current pending balance
    const { data: resident, error: fetchErr } = await supabase
      .from('residents')
      .select('name, pending, admission_no')
      .eq('id', residentId)
      .single();

    if (fetchErr || !resident) {
      return { success: false, newBalance: 0, receiptNo: '', error: 'Resident not found' };
    }

    const currentPending = Number(resident.pending || 0);
    const newBalance = Math.max(0, currentPending - amount);
    const generatedReceipt =
      params.receiptNo?.trim() ||
      `HAR-${resident.admission_no}-${Date.now().toString().slice(-5)}`;

    // 2. Insert transaction ledger record
    try {
      await supabase.from('fee_transactions').insert([
        {
          resident_id: residentId,
          type: 'PAYMENT',
          amount: amount,
          balance_before: currentPending,
          balance_after: newBalance,
          payment_method: paymentMethod,
          receipt_no: generatedReceipt,
          description: description?.trim() || `Payment received via ${paymentMethod}`,
          created_at: paymentDate ? `${paymentDate}T12:00:00Z` : new Date().toISOString(),
        },
      ]);
    } catch (txErr: any) {
      console.warn('Note: fee_transactions table insert skipped or unavailable:', txErr?.message);
    }

    // 3. Update resident pending balance
    const { error: updateErr } = await supabase
      .from('residents')
      .update({
        pending: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', residentId);

    if (updateErr) {
      return { success: false, newBalance: currentPending, receiptNo: '', error: updateErr.message };
    }

    return {
      success: true,
      newBalance,
      receiptNo: generatedReceipt,
    };
  } catch (err: any) {
    return { success: false, newBalance: 0, receiptNo: '', error: err.message || 'Payment processing failed' };
  }
}

/**
 * Fetches all fee and payment transactions for a given resident.
 */
export async function fetchResidentFeeTransactions(
  residentId: string
): Promise<{ data: FeeTransaction[]; error?: string }> {
  if (!residentId || typeof residentId !== 'string' || !residentId.trim()) {
    return { data: [] };
  }

  try {
    const { data, error } = await supabase
      .from('fee_transactions')
      .select('*')
      .eq('resident_id', residentId.trim())
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist yet (42P01) or invalid UUID syntax (22P02), return empty list gracefully
      if (error.code === '42P01' || error.code === '22P02' || error.message.includes('fee_transactions') || error.message.includes('uuid')) {
        return { data: [] };
      }
      return { data: [], error: error.message };
    }

    return { data: (data as FeeTransaction[]) || [] };
  } catch (err: any) {
    return { data: [], error: err.message };
  }
}
