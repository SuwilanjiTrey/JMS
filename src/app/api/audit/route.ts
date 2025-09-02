import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/constants/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const actorId = searchParams.get('actorId');

    const constraints: any[] = [];
    if (entityType) constraints.push(where('entityType', '==', entityType));
    if (entityId) constraints.push(where('entityId', '==', entityId));
    if (actorId) constraints.push(where('actorId', '==', actorId));

    const qBuilt = constraints.length ? query(collection(db, COLLECTIONS.AUDIT_LOGS), ...constraints) : query(collection(db, COLLECTIONS.AUDIT_LOGS));
    const snap = await getDocs(qBuilt);
    const items = snap.docs.map((d) => d.data());
    items.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return NextResponse.json({ success: true, items });
}
