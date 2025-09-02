import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/constants/firebase/config';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';
import { DocumentCreateSchema } from '@/lib/schemas';
import { newId } from '@/lib/ids';
import { writeAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = DocumentCreateSchema.parse(body);

        const id = newId();
        const now = new Date();

        const version = parsed.parentDocumentId ? ((await getDocs(query(collection(db, COLLECTIONS.DOCUMENTS), where('parentDocumentId', '==', parsed.parentDocumentId)))).size + 1) : 1;

        const item: any = {
            id,
            title: parsed.title,
            description: parsed.description ?? '',
            type: parsed.type,
            status: 'submitted',
            signatureStatus: 'unsigned',
            fileName: parsed.fileName,
            fileSize: parsed.fileSize,
            mimeType: parsed.mimeType,
            caseId: parsed.caseId,
            caseNumber: parsed.caseNumber,
            uploadedBy: body?.actorId ?? 'system',
            uploadedAt: now,
            lastModified: now,
            version,
            tags: parsed.tags ?? [],
            isPublic: parsed.isPublic ?? false,
            accessLevel: parsed.accessLevel ?? 'restricted',
            category: parsed.category ?? 'other',
            parentDocumentId: parsed.parentDocumentId,
        };

        await setDoc(doc(collection(db, COLLECTIONS.DOCUMENTS), id), item);
        await writeAudit({ actorId: body?.actorId ?? 'system', action: 'DOCUMENT_CREATE', entityType: 'document', entityId: id, details: { caseId: parsed.caseId, version } });

        return NextResponse.json({ success: true, id, version });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message ?? 'Invalid payload' }, { status: 400 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    const qBuilt = caseId ? query(collection(db, COLLECTIONS.DOCUMENTS), where('caseId', '==', caseId)) : query(collection(db, COLLECTIONS.DOCUMENTS));
    const snap = await getDocs(qBuilt);
    const items = snap.docs.map((d) => d.data());
    return NextResponse.json({ success: true, items });
}
