import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/constants/firebase/config';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/src/lib/constants/collections';
import { HearingUpdateSchema } from '@/src/lib/schemas';
import { writeAudit } from '@/src/lib/audit';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const parsed = HearingUpdateSchema.parse(body);
        const ref = doc(collection(db, COLLECTIONS.HEARINGS), params.id);

        const updates: any = { ...parsed, updatedAt: new Date() };
        if (parsed.date) {
            // also update case.nextHearingDate
            const hearingSnap = await getDoc(ref);
            if (hearingSnap.exists()) {
                const caseId = (hearingSnap.data() as any).caseId;
                await updateDoc(doc(collection(db, COLLECTIONS.CASES), caseId), { nextHearingDate: new Date(parsed.date) });
            }
        }

        await updateDoc(ref, updates);
        await writeAudit({ actorId: body?.actorId ?? 'system', action: 'HEARING_UPDATE', entityType: 'hearing', entityId: params.id, details: parsed });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message ?? 'Invalid payload' }, { status: 400 });
    }
}
