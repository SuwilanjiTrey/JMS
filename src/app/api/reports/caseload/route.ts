import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/constants/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';

export async function GET() {
    const snap = await getDocs(collection(db, COLLECTIONS.CASES));
    const rows = snap.docs.map((d) => d.data());
    const byStatus: Record<string, number> = {};
    for (const r of rows) {
        const s = (r as any).status ?? 'unknown';
        byStatus[s] = (byStatus[s] ?? 0) + 1;
    }
    const report = Object.entries(byStatus).map(([status, total]) => ({ status, total }));
    return NextResponse.json({ success: true, report });
}
