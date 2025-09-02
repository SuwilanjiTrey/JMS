import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../../lib/constants/firebase/config';
import { COLLECTIONS } from '../../../../../lib/constants/firebase/collections';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const qRef = query(
            collection(db, COLLECTIONS.AUDIT_LOGS),
            where('entityType', '==', 'case'),
            where('entityId', '==', params.id)
        );

        const snap = await getDocs(qRef);
        const items = snap.docs.map((d) => d.data());

        // Sort by timestamp client-side since Firestore ordering with where clauses can be limited
        items.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return NextResponse.json({ success: true, items });
    } catch (err: any) {
        console.error('Error fetching case history:', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch case history' }, { status: 500 });
    }
}