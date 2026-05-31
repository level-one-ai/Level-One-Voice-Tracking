import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import { CallRecord } from "@/lib/types";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const db = getDb();
    const snapshot = await db.collection("calls").orderBy("created_at", "desc").limit(200).get();
    const calls: CallRecord[] = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<CallRecord, "id">) }));
    return NextResponse.json({ calls }, { status: 200 });
  } catch (err) {
    console.error("[Firestore] Failed to fetch calls:", err);
    return NextResponse.json({ error: "Failed to fetch calls" }, { status: 500 });
  }
}
