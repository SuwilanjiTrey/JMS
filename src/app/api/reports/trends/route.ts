import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/constants/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';

function dayKey(d: Date) {
    return d.toISOString().slice(0, 10);
}

export async function GET() {
    const casesSnap = await getDocs(collection(db, COLLECTIONS.CASES));
    const hearingsSnap = await getDocs(collection(db, COLLECTIONS.HEARINGS));
    const cases = casesSnap.docs.map((d) => d.data() as any);
    const hearings = hearingsSnap.docs.map((d) => d.data() as any);

    const map: Record<string, { casesCreated: number; casesClosed: number; hearingsScheduled: number }> = {};

    for (const c of cases) {
        if (c.createdAt) {
            const k = dayKey(new Date(c.createdAt));
            map[k] ??= { casesCreated: 0, casesClosed: 0, hearingsScheduled: 0 };
            map[k].casesCreated++;
        }
        if (c.status === 'closed' && c.updatedAt) {
            const k = dayKey(new Date(c.updatedAt));
            map[k] ??= { casesCreated: 0, casesClosed: 0, hearingsScheduled: 0 };
            map[k].casesClosed++;
        }
    }

    for (const h of hearings) {
        if (h.date) {
            const k = dayKey(new Date(h.date));
            map[k] ??= { casesCreated: 0, casesClosed: 0, hearingsScheduled: 0 };
            map[k].hearingsScheduled++;
        }
    }

    const points = Object.entries(map)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v }));

    return NextResponse.json({ success: true, points });
}
