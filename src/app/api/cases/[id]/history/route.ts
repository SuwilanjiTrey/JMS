import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/constants/firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    const qRef = query(
        collection(db, COLLECTIONS.AUDIT_LOGS),
        where('entityType', '==', 'case'),
        where('entityId', '==', params.id)
    );
    const snap = await getDocs(qRef);
    const items = snap.docs.map((d) => d.data());
    // optionally sort by timestamp client-side if needed
    items.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return NextResponse.json({ success: true, items });
}
