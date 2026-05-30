import { NextResponse } from 'next/server';
import { retell } from '@/lib/retell';
import { formatInTimeZone } from 'date-fns-tz';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const fromNumber =
      body.data?.payload?.from?.phone_number ||
      body.data?.from?.phone_number ||
      body.from_number;

    if (!fromNumber) {
      return NextResponse.json(
        { error: 'Caller number not found' },
        { status: 400 }
      );
    }

    // Return Telnyx TeXML Reject command immediately
    const rejectXml = `<?xml version="1.0" encoding="UTF-8"?><Response><Reject reason="busy"/></Response>`;

    // Determine UK time
    const now = new Date();
    const hour = parseInt(formatInTimeZone(now, 'Europe/London', 'H'), 10);

    const triggerRetellCall = async () => {
      try {
        await retell.call.createPhoneCall({
          from_number: process.env.RETELL_FROM_NUMBER!,
          to_number: fromNumber,
          override_agent_id: process.env.RETELL_AGENT_ID!,
        });
      } catch (err) {
        console.error('Retell outbound call failed:', err);
      }
    };

    if (hour < 17) {
      // Non-blocking 60-second delay
      // Note: In serverless environments, ensure your execution limit exceeds 60s
      setTimeout(triggerRetellCall, 60000);
    } else {
      triggerRetellCall();
    }

    return new NextResponse(rejectXml, {
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (err) {
    console.error('Telnyx webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
