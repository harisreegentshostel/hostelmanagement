import { supabase } from './supabase';

/**
 * Checks if an email is registered by an admin in the public.residents table.
 * Uses RPC if available in the database, with a direct query fallback.
 */
export async function checkIfResidentRegistered(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  // 1. Try secure RPC function (SECURITY DEFINER)
  try {
    const { data, error } = await supabase.rpc('check_resident_email', {
      lookup_email: normalized,
    });
    if (!error && typeof data === 'boolean') {
      return data;
    }
  } catch (err) {
    console.warn('RPC check_resident_email not available, checking residents table:', err);
  }

  // 2. Direct fallback query against public.residents
  try {
    const { data, error } = await supabase
      .from('residents')
      .select('id')
      .ilike('email', normalized)
      .limit(1);

    if (!error && data && data.length > 0) {
      return true;
    }
  } catch (err) {
    console.error('Error verifying resident email:', err);
  }

  return false;
}

/**
 * Sends a Supabase Auth Magic Link strictly to an admin-registered resident email.
 * If the email is NOT in public.residents, it rejects the request without sending an email.
 */
export async function sendResidentMagicLink(
  email: string,
  residentName?: string
): Promise<{ success: boolean; error: string | null }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  // Strict check: Only admin-registered residents can receive a magic link
  const isRegistered = await checkIfResidentRegistered(normalized);
  if (!isRegistered) {
    return {
      success: false,
      error: `Access Denied: The email "${normalized}" is not registered in the hostel resident database. Only residents registered by the admin can receive a login magic link.`,
    };
  }

  try {
    const redirectUrl = `${window.location.origin}/resident`;
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          role: 'resident',
          ...(residentName ? { name: residentName } : {}),
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to dispatch magic link.' };
  }
}
