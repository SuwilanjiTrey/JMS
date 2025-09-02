import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/constants/firebase/config';
import { COLLECTIONS } from '../../../../lib/constants/firebase/collections';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const casesSnap = await getDocs(collection(db, COLLECTIONS.CASES));
        const cases = casesSnap.docs.map((d) => d.data() as any);

        const map: Record<string, {
            total: number;
            closed: number;
            totalResolutionDays: number;
            countClosed: number
        }> = {};

        for (const c of cases) {
            const judgeId = c.assignedTo ?? 'unassigned';
            const created = c.createdAt ? new Date(c.createdAt.seconds ? c.createdAt.seconds * 1000 : c.createdAt) : undefined;
            const closed = c.status === 'closed';

            if (!map[judgeId]) {
                map[judgeId] = { total: 0, closed: 0, totalResolutionDays: 0, countClosed: 0 };
            }
            map[judgeId].total++;

            if (closed && created && c.updatedAt) {
                const end = new Date(c.updatedAt.seconds ? c.updatedAt.seconds * 1000 : c.updatedAt);
                const days = Math.max(1, Math.round((end.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
                map[judgeId].closed++;
                map[judgeId].totalResolutionDays += days;
                map[judgeId].countClosed++;
            }
        }

        const metrics = Object.entries(map).map(([judgeId, v]) => ({
            judgeId,
            totalCases: v.total,
            casesClosed: v.closed,
            avgResolutionDays: v.countClosed ? Math.round(v.totalResolutionDays / v.countClosed) : undefined,
        }));

        return NextResponse.json({ success: true, metrics });
    } catch (err: any) {
        console.error('Error generating performance report:', err);
        return NextResponse.json({ success: false, error: 'Failed to generate performance report' }, { status: 500 });
    }
}