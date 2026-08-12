import { ensureSupabase } from '@/lib/supabase/client.js';
import { NextResponse } from 'next/server';

const TABLE = 'otp_requests';

const DAKBOX_API_URL = process.env.DAKBOX_API_URL || 'https://dakbox.net/api/v1';
const DAKBOX_API_KEY = process.env.DAKBOX_API_KEY || '';

export async function requestOTP({ phoneNumber, candidateName, requestId }) {
  const supabase = await ensureSupabase();
  const otpRequest = {
    id: `otp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    phone_number: phoneNumber,
    candidate_name: candidateName || null,
    request_id: requestId || null,
    status: 'pending',
    otp_code: null,
    attempts: 0,
    max_attempts: 5,
    created_at: new Date().toISOString(),
    resolved_at: null
  };
  const { data, error } = await supabase.from(TABLE).insert(otpRequest).select().single();
  if (error) throw new Error(error.message);
  if (DAKBOX_API_KEY) {
    try {
      const res = await fetch(`${DAKBOX_API_URL}/otp/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DAKBOX_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone_number: phoneNumber, candidate_name: candidateName })
      });
      const result = await res.json();
      await supabase.from(TABLE).update({ dakbox_request_id: result.request_id || result.id, status: result.success ? 'sent' : 'failed' }).eq('id', data.id);
    } catch (err) {
      await supabase.from(TABLE).update({ status: 'failed', error: err.message }).eq('id', data.id);
    }
  }
  return data;
}

export async function pollOTP(otpRequestId) {
  const supabase = await ensureSupabase();
  const { data: otpRequest, error } = await supabase.from(TABLE).select('*').eq('id', otpRequestId).single();
  if (error || !otpRequest) return null;
  if (otpRequest.status === 'resolved') {
    return { ...otpRequest, otp_code: otpRequest.otp_code };
  }
  if (otpRequest.attempts >= otpRequest.max_attempts) {
    await supabase.from(TABLE).update({ status: 'expired' }).eq('id', otpRequestId);
    return { ...otpRequest, otp_code: null };
  }
  if (DAKBOX_API_KEY && otpRequest.dakbox_request_id) {
    try {
      const res = await fetch(`${DAKBOX_API_URL}/otp/poll/${otpRequest.dakbox_request_id}`, {
        headers: { 'Authorization': `Bearer ${DAKBOX_API_KEY}` }
      });
      const result = await res.json();
      if (result.otp_code || result.code) {
        await supabase.from(TABLE).update({ otp_code: result.otp_code || result.code, status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', otpRequestId);
        const updated = { ...otpRequest, otp_code: result.otp_code || result.code, status: 'resolved', resolved_at: new Date().toISOString() };
        return updated;
      }
    } catch (err) {
      console.error('[OTP] Poll error:', err.message);
    }
  }
  await supabase.from(TABLE).update({ attempts: otpRequest.attempts + 1 }).eq('id', otpRequestId);
  return { ...otpRequest, attempts: otpRequest.attempts + 1, otp_code: null };
}

export async function getOTPRequest(id) {
  const supabase = await ensureSupabase();
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function getAllOTPRequests(filters = {}) {
  const supabase = await ensureSupabase();
  let query = supabase.from(TABLE).select('*');
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.phone_number) query = query.eq('phone_number', filters.phone_number);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function cancelOTPRequest(id) {
  const supabase = await ensureSupabase();
  const { error } = await supabase.from(TABLE).update({ status: 'cancelled' }).eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}
