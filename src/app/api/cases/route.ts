import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/constants/firebase/config';
import { collection, doc, getDocs, query, setDoc, where, orderBy, limit as qLimit } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';
import { CaseCreateSchema } from '@/lib/schemas';
import { nextCaseNumber } from '@/lib/case-number';
import { newId } from '@/lib/ids';
import { writeAudit } from '@/lib/audit';


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = CaseCreateSchema.parse(body);


        const { caseNumber } = await nextCaseNumber(parsed.typePrefix ?? 'GEN', parsed.courtCode ?? 'LUS-HC');
        const id = newId();


        const now = new Date();
        const payload: any = {
            id,
            caseNumber,
            title: parsed.title,
            description: parsed.description,
            type: parsed.type,
            status: 'active',
            priority: parsed.priority,
            createdAt: now,
            updatedAt: now,
            createdBy: (body?.actorId ?? 'system'),
            plaintiffs: (parsed.plaintiffs || []).map((p, i) => ({ id: newId(), ...p })),
            defendants: (parsed.defendants || []).map((d) => ({ id: newId(), ...d })),
            lawyers: (parsed.lawyers || []).map((l) => ({ id: newId(), assignedAt: now, isActive: true, ...l })),
            hearings: [],
            documents: [],
            rulings: [],
            tags: parsed.tags || [],
        };


        await setDoc(doc(collection(db, COLLECTIONS.CASES), id), payload);
        await writeAudit({
            actorId: body?.actorId ?? 'system',
            action: 'CASE_CREATE',
            entityType: 'case',
            entityId: id,
            details: { caseNumber },
        });


        return NextResponse.json({ success: true, id, caseNumber });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message ?? 'Invalid payload' }, { status: 400 });
    }
}


export async function GET(req: NextRequest) {
    // Basic filters: status, type, assignedTo, search (title)
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search');


    let qRef = collection(db, COLLECTIONS.CASES);
    const constraints: any[] = [];
    if (status) constraints.push(where('status', '==', status));
    if (type) constraints.push(where('type', '==', type));
    if (assignedTo) constraints.push(where('assignedTo', '==', assignedTo));
    // NOTE: Firestore text search requires an index or external search; this uses exact where filters only.


}