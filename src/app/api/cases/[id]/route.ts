import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/constants/firebase/config';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';
import { CaseUpdateSchema } from '@/lib/schemas';
import { writeAudit } from '@/lib/audit';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    const ref = doc(collection(db, COLLECTIONS.CASES), params.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, item: snap.data() });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const parsed = CaseUpdateSchema.parse(body);
        const ref = doc(collection(db, COLLECTIONS.CASES), params.id);

        const updates: any = { ...parsed, updatedAt: new Date() };
        await updateDoc(ref, updates);

        await writeAudit({
            actorId: body?.actorId ?? 'system',
            action: parsed.status ? 'CASE_STATUS_UPDATE' : 'CASE_UPDATE',
            entityType: 'case',
            entityId: params.id,
            details: parsed,
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message ?? 'Invalid payload' }, { status: 400 });
    }
}