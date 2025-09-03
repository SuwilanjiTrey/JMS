import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/constants/firebase/config';
import { COLLECTIONS } from '../../../lib/constants/firebase/collections';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const entityType = searchParams.get('entityType');
        const entityId = searchParams.get('entityId');
        const actorId = searchParams.get('actorId');

        const constraints: any[] = [];
        if (entityType) constraints.push(where('entityType', '==', entityType));
        if (entityId) constraints.push(where('entityId', '==', entityId));
        if (actorId) constraints.push(where('actorId', '==', actorId));

        const qBuilt = constraints.length ?
            query(collection(db, COLLECTIONS.AUDIT_LOGS), ...constraints) :
            query(collection(db, COLLECTIONS.AUDIT_LOGS));

        const snap = await getDocs(qBuilt);
        const items = snap.docs.map((d) => d.data());

        // Sort by timestamp (most recent first)
        items.sort((a: any, b: any) => {
            const aTime = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
            const bTime = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
            return bTime - aTime;
        });

        return NextResponse.json({ success: true, items });
    } catch (err: any) {
        console.error('Error fetching audit logs:', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch audit logs' }, { status: 500 });
    }
}