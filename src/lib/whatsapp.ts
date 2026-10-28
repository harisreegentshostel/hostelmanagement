import type { ResidentRecord } from '../types/auth';
import { getDayOrdinal } from './fees';

/**
 * Sanitizes phone number for WhatsApp wa.me links.
 * Normalizes Indian 10-digit numbers to international +91 prefix.
 */
export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `91${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Formats due date into a natural short string like "10th Oct".
 */
export function formatDueDateForReminder(dateStr?: string | null, dueDay?: number | null): string {
  if (dateStr) {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        const monthIndex = parseInt(parts[1], 10) - 1;
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        const monthStr = monthNames[monthIndex] || '';
        return `${getDayOrdinal(day)} ${monthStr}`.trim();
      }
    } catch {}
  }

  if (dueDay && dueDay >= 1 && dueDay <= 31) {
    return `${getDayOrdinal(dueDay)} of this month`;
  }

  return '5th of this month';
}

/**
 * Standard fee reminder message text:
 * "Dear Rahul, your monthly hostel fee of ₹5,000 for Harisree Hostel is due on 10th Oct. Current total due: ₹5,000. Please pay at reception or via UPI."
 */
export function generateFeeReminderMessage(
  resident: ResidentRecord,
  customDueDate?: string
): string {
  const dueDate = customDueDate || formatDueDateForReminder(resident.next_fee_payment_date, resident.fee_due_day);
  const monthlyFee = Number(resident.monthly_fee || 0).toLocaleString();
  const pending = Number(resident.pending || 0).toLocaleString();

  if (Number(resident.pending || 0) <= 0) {
    return `Dear ${resident.name}, your hostel fee for Harisree Hostel is cleared. Current balance: ₹0. Thank you for your payment!`;
  }

  return `Dear ${resident.name}, your monthly hostel fee of ₹${monthlyFee} for Harisree Hostel is due on ${dueDate}. Current total due: ₹${pending}. Please pay at reception or via UPI.`;
}

/**
 * Builds a direct wa.me link with encoded message.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = formatWhatsAppPhone(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * 1-Click trigger: Opens WhatsApp Web or mobile app in a new tab with the pre-formatted reminder.
 */
export function trigger1ClickWhatsAppReminder(resident: ResidentRecord): void {
  const phone = resident.mobile_no;
  const message = generateFeeReminderMessage(resident);
  const url = buildWhatsAppLink(phone, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}
