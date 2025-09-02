import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../lib/constants/firebase/config';
import { COLLECTIONS } from '../../../lib/constants/firebase/collections';
import { HearingCreateSchema } from '../../../lib/schemas';
import { newId } from '../../../lib/ids';
import { writeAudit } from '../../../lib/audit';
import { sendNotification } from '../../../lib/notify';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = HearingCreateSchema.parse(body);

        const id = newId();
        const hearing: any = {
            id,
            caseId: parsed.caseId,
            date: new Date(parsed.date),
            startTime: parsed.startTime,
            endTime: parsed.endTime,
            location: parsed.location,
            judgeId: parsed.judgeId,
            purpose: parsed.purpose,
            status: 'scheduled',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await setDoc(doc(collection(db, COLLECTIONS.HEARINGS), id), hearing);

        // Update case.nextHearingDate
        await updateDoc(doc(collection(db, COLLECTIONS.CASES), parsed.caseId), {
            nextHearingDate: new Date(parsed.date),
            updatedAt: new Date()
        });

        // Create calendar event
        const calId = newId();
        await setDoc(doc(collection(db, COLLECTIONS.CALENDAR), calId), {
            id: calId,
            caseId: parsed.caseId,
            hearingId: id,
            judgeId: parsed.judgeId,
            title: `Hearing`,
            start: new Date(`${parsed.date}`),
            end: new Date(`${parsed.date}`),
            location: parsed.location,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Send notifications
        await sendNotification({
            recipientUserId: parsed.judgeId,
            title: 'Hearing Assigned',
            message: `You have a hearing scheduled for case ${parsed.caseId} on ${new Date(parsed.date).toDateString()}.`,
            relatedEntity: { type: 'hearing', id },
        });

        await writeAudit({
            actorId: body?.actorId ?? 'system',
            action: 'HEARING_CREATE',
            entityType: 'hearing',
            entityId: id,
            details: hearing
        });

        return NextResponse.json({ success: true, id });
    } catch (err: any) {
        console.error('Error creating hearing:', err);
        return NextResponse.json({ success: false, error: err?.message ?? 'Invalid payload' }, { status: 400 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const caseId = searchParams.get('caseId');
        const judgeId = searchParams.get('judgeId');
        const date = searchParams.get('date'); // YYYY-MM-DD

        const constraints: any[] = [];
        if (caseId) constraints.push(where('caseId', '==', caseId));
        if (judgeId) constraints.push(where('judgeId', '==', judgeId));
        if (date) {
            const targetDate = new Date(date);
            constraints.push(where('date', '>=', targetDate));
            const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
            constraints.push(where('date', '<', nextDay));
        }

        const qBuilt = constraints.length ? query(collection(db, COLLECTIONS.HEARINGS), ...constraints) : query(collection(db, COLLECTIONS.HEARINGS));
        const snap = await getDocs(qBuilt);
        const items = snap.docs.map((d) => d.data());

        return NextResponse.json({ success: true, items });
    } catch (err: any) {
        console.error('Error fetching hearings:', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch hearings' }, { status: 500 });
    }
}