import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/constants/firebase/config';
import { COLLECTIONS } from '../../../../lib/constants/firebase/collections';

export const dynamic = 'force-dynamic';

function dayKey(d: Date) {
    return d.toISOString().slice(0, 10);
}

export async function GET() {
    try {
        const casesSnap = await getDocs(collection(db, COLLECTIONS.CASES));
        const hearingsSnap = await getDocs(collection(db, COLLECTIONS.HEARINGS));
        const cases = casesSnap.docs.map((d) => d.data() as any);
        const hearings = hearingsSnap.docs.map((d) => d.data() as any);

        const map: Record<string, {
            casesCreated: number;
            casesClosed: number;
            hearingsScheduled: number
        }> = {};

        for (const c of cases) {
            if (c.createdAt) {
                const createdDate = c.createdAt.seconds ?
                    new Date(c.createdAt.seconds * 1000) :
                    new Date(c.createdAt);
                const k = dayKey(createdDate);
                map[k] ??= { casesCreated: 0, casesClosed: 0, hearingsScheduled: 0 };
                map[k].casesCreated++;
            }

            if (c.status === 'closed' && c.updatedAt) {
                const updatedDate = c.updatedAt.seconds ?
                    new Date(c.updatedAt.seconds * 1000) :
                    new Date(c.updatedAt);
                const k = dayKey(updatedDate);
                map[k] ??= { casesCreated: 0, casesClosed: 0, hearingsScheduled: 0 };
                map[k].casesClosed++;
            }
        }

        for (const h of hearings) {
            if (h.date) {
                const hearingDate = h.date.seconds ?
                    new Date(h.date.seconds * 1000) :
                    new Date(h.date);
                const k = dayKey(hearingDate);
                map[k] ??= { casesCreated: 0, casesClosed: 0, hearingsScheduled: 0 };
                map[k].hearingsScheduled++;
            }
        }

        const points = Object.entries(map)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, v]) => ({ date, ...v }));

        return NextResponse.json({ success: true, points });
    } catch (err: any) {
        console.error('Error generating trends report:', err);
        return NextResponse.json({ success: false, error: 'Failed to generate trends report' }, { status: 500 });
    }
}