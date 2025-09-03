import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/constants/firebase/config';
import { COLLECTIONS } from '../../../../lib/constants/firebase/collections';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const snap = await getDocs(collection(db, COLLECTIONS.CASES));
        const rows = snap.docs.map((d) => d.data());

        const byStatus: Record<string, number> = {};
        for (const r of rows) {
            const s = (r as any).status ?? 'unknown';
            byStatus[s] = (byStatus[s] ?? 0) + 1;
        }

        const report = Object.entries(byStatus).map(([status, total]) => ({ status, total }));

        return NextResponse.json({ success: true, report });
    } catch (err: any) {
        console.error('Error generating caseload report:', err);
        return NextResponse.json({ success: false, error: 'Failed to generate caseload report' }, { status: 500 });
    }
}