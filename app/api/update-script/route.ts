import { NextResponse } from 'next/server';
import { retell } from '@/lib/retell';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (authHeader !== `Bearer ${process.env.UPDATE_SCRIPT_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { new_script } = await request.json();

    if (!new_script || typeof new_script !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid new_script' },
        { status: 400 }
      );
    }

    // Update Retell LLM engine system prompt
    // Verify exact method signature against your installed retell-sdk version
    await retell.llm.update({
      llm_id: process.env.RETELL_LLM_ID!,
      general_prompt: new_script,
    });

    return NextResponse.json({ status: 'prompt_updated' });
  } catch (err) {
    console.error('Update script error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
