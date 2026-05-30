import { NextResponse } from 'next/server';
import { retell } from '@/lib/retell';

export async function GET() {
  try {
    // Verify exact method signature against your installed retell-sdk version
    const llm = await retell.llm.retrieve(process.env.RETELL_LLM_ID!);
    return NextResponse.json({ prompt: llm.general_prompt || '' });
  } catch (err) {
    return NextResponse.json({ prompt: '' }, { status: 500 });
  }
}
