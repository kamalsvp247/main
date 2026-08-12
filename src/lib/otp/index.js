import { getDb } from '@/lib/db/index.js';
import { NextResponse } from 'next/server';
import { auditLog } from '@/lib/audit/index.js';

const DAKBOX_API_URL = process.env.DAKBOX_API_URL || 'https://dakbox.net/api/v1';
const DAKBOX_API_KEY = process.env.DAKBOX_API_KEY || '';

export async function requestOTP({ phoneNumber, candidateName, requestId }) {
  const db = await getDb();
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
  db.data.otpRequests.push(otpRequest);
  await db.write();
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
      const data = await res.json();
      otpRequest.dakbox_request_id = data.request_id || data.id;
      otpRequest.status = data.success ? 'sent' : 'failed';
      await db.write();
    } catch (error) {
      otpRequest.status = 'failed';
      otpRequest.error = error.message;
      await db.write();
    }
  }
  await auditLog({
    action: 'otp.requested',
    resource_type: 'otp',
    resource_id: otpRequest.id,
    details: { phone_number: phoneNumber, candidate_name: candidateName }
  });
  return otpRequest;
}

export async function pollOTP(otpRequestId) {
  const db = await getDb();
  const otpRequest = db.data.otpRequests.find(o => o.id === otpRequestId);
  if (!otpRequest) return null;
  if (otpRequest.status === 'resolved') {
    return { ...otpRequest, otp_code: otpRequest.otp_code };
  }
  if (otpRequest.attempts >= otpRequest.max_attempts) {
    otpRequest.status = 'expired';
    await db.write();
    return { ...otpRequest, otp_code: null };
  }
  if (DAKBOX_API_KEY && otpRequest.dakbox_request_id) {
    try {
      const res = await fetch(`${DAKBOX_API_URL}/otp/poll/${otpRequest.dakbox_request_id}`, {
        headers: { 'Authorization': `Bearer ${DAKBOX_API_KEY}` }
      });
      const data = await res.json();
      if (data.otp_code || data.code) {
        otpRequest.otp_code = data.otp_code || data.code;
        otpRequest.status = 'resolved';
        otpRequest.resolved_at = new Date().toISOString();
        await db.write();
        await auditLog({
          action: 'otp.resolved',
          resource_type: 'otp',
          resource_id: otpRequest.id,
          details: { phone_number: otpRequest.phone_number }
        });
        return { ...otpRequest, otp_code: otpRequest.otp_code };
      }
    } catch (error) {
      console.error('[OTP] Poll error:', error.message);
    }
  }
  otpRequest.attempts += 1;
  await db.write();
  return { ...otpRequest, otp_code: null };
}

export async function getOTPRequest(id) {
  const db = await getDb();
  return db.data.otpRequests.find(o => o.id === id) || null;
}

export async function getAllOTPRequests(filters = {}) {
  const db = await getDb();
  let requests = db.data.otpRequests;
  if (filters.status) requests = requests.filter(r => r.status === filters.status);
  if (filters.phone_number) requests = requests.filter(r => r.phone_number === filters.phone_number);
  return requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function cancelOTPRequest(id) {
  const db = await getDb();
  const idx = db.data.otpRequests.findIndex(o => o.id === id);
  if (idx === -1) return false;
  db.data.otpRequests[idx].status = 'cancelled';
  await db.write();
  return true;
}
