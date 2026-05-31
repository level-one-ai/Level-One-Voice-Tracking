import { NextRequest, NextResponse } from "next/server";
import { getRetellClient } from "@/lib/retell";

interface RetellVoice {
  voice_id?: string;
  voice_name?: string;
  provider?: string;
  gender?: string;
  accent?: string;
  age?: string;
  preview_audio_url?: string;
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const client = getRetellClient();
    const raw = await client.voice.list();
    const voices = (raw as unknown as RetellVoice[]).map((v) => ({
      voice_id: v.voice_id ?? "",
      voice_name: v.voice_name ?? "",
      provider: v.provider ?? "",
      gender: v.gender ?? "",
      accent: v.accent ?? "",
      age: v.age ?? "",
      preview_audio_url: v.preview_audio_url ?? "",
    }));
    return NextResponse.json({ voices }, { status: 200 });
  } catch (err) {
    console.error("[Retell] Failed to list voices:", err);
    return NextResponse.json({ error: "Failed to fetch voices" }, { status: 500 });
  }
}
