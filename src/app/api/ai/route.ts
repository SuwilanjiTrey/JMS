//route.ts
import { NextResponse } from "next/server";
import { queryAI } from "@/lib/aiServices";   // you named it queryAI

export async function POST(req: Request) {
  try {
    const { query, context } = await req.json();

    const result = await queryAI(query, context);

    return NextResponse.json({ text: result });  // ✅ always JSON
  } catch (err: any) {
    console.error("AI API error:", err);
    return NextResponse.json(
      { error: "AI request failed", details: err.message || String(err) },
      { status: 500 }
    );
  }
}
