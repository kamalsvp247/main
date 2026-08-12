import { NextResponse } from 'next/server';
import { login } from '@/lib/svp-playwright';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { action, payload } = await request.json();
    
    switch (action) {
      case 'login':
        return NextResponse.json({ success: true, data: await login() });
      
      case 'reschedule':
        const { sessionId, newDate, categoryId, testCenterId, examSessionId, cityName, languageCode } = payload;
        const { rescheduleViaAPI } = await import('@/lib/svp-playwright.js');
        const result = await rescheduleViaAPI(sessionId, newDate, categoryId, testCenterId, examSessionId, cityName, languageCode);
        return NextResponse.json(result);
      
      case 'cancel':
        const { sessionId: cancelId, reason } = payload;
        const { cancelViaAPI } = await import('@/lib/svp-playwright.js');
        const cancelResult = await cancelViaAPI(cancelId, reason);
        return NextResponse.json(cancelResult);
      
      case 'rebook':
        const rebookData = payload;
        const { rebookViaAPI } = await import('@/lib/svp-playwright.js');
        const rebookResult = await rebookViaAPI(rebookData);
        return NextResponse.json(rebookResult);
      
      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[backend] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
