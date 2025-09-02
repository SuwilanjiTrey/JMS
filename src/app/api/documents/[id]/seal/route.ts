import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/constants/firebase/config';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';
import { DocumentSealSchema } from '@/lib/schemas';
import { writeAudit } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = DocumentSealSchema.parse(body);
    const ref = doc(collection(db, COLLECTIONS.DOCUMENTS), params.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });

    await updateDoc(ref, {
      status: 'sealed',
      signatureStatus: 'sealed',
      seal: { sealedBy: parsed.sealedBy, sealedAt: new Date(), sealType: parsed.sealType },
      lastModified: new Date(),
    });

    await writeAudit({ actorId: parsed.sealedBy, action: 'DOCUMENT_SEAL', entityType: 'document', entityId: params.id, details: { sealType: parsed.sealType } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? 'Invalid payload' }, { status: 400 });
  }
}
