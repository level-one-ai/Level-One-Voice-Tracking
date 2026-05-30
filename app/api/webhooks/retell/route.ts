import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.event !== 'call_analyzed') {
      return NextResponse.json({ status: 'event_ignored' });
    }

    const data = body.data || {};

    const record = {
      call_id: data.call_id,
      transcript: data.transcript,
      recording_url: data.recording_url,
      call_status: data.call_status,
      sentiment: data.sentiment,
      duration: data.duration,
      name: data.llm_variables?.Name || '',
      email: data.llm_variables?.Email || '',
      businessType: data.llm_variables?.['Business Type'] || '',
      aiObjective: data.llm_variables?.['AI Objective'] || '',
      implementationType: data.llm_variables?.['Implementation Type'] || '',
      timestamp: new Date().toISOString(),
      createdAt: new Date(),
    };

    // Persist to Firestore
    await db.collection('calls').add(record);

    // Forward to Make.com
    if (process.env.MAKE_WEBHOOK_URL) {
      await fetch(process.env.MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
    }

    return NextResponse.json({ status: 'processed' });
  } catch (err) {
    console.error('Retell webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
