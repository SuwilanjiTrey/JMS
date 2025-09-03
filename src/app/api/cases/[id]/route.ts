import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../lib/constants/firebase/config';
import { COLLECTIONS } from '../../../../lib/constants/firebase/collections';
import { CaseUpdateSchema } from '../../../../lib/schemas';
import { writeAudit } from '../../../../lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const ref = doc(collection(db, COLLECTIONS.CASES), params.id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, item: snap.data() });
    } catch (err: any) {
        console.error('Error fetching case:', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch case' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const parsed = CaseUpdateSchema.parse(body);
        const ref = doc(collection(db, COLLECTIONS.CASES), params.id);

        const updates: any = { ...parsed, updatedAt: new Date() };

        // Convert nextHearingDate string to Date if provided
        if (parsed.nextHearingDate) {
            updates.nextHearingDate = new Date(parsed.nextHearingDate);
        }

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
        console.error('Error updating case:', err);
        return NextResponse.json({ success: false, error: err?.message ?? 'Invalid payload' }, { status: 400 });
    }
}