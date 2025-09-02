import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../../lib/constants/firebase/config';
import { COLLECTIONS } from '../../../../../lib/constants/firebase/collections';
import { DocumentSignSchema } from '../../../../../lib/schemas';
import { writeAudit } from '../../../../../lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = DocumentSignSchema.parse(body);
    const ref = doc(collection(db, COLLECTIONS.DOCUMENTS), params.id);
    const snap = await getDoc(ref);
    
    if (!snap.exists()) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    await updateDoc(ref, {
      signatureStatus: 'digitally_signed',
      digitalSignature: { 
        signedBy: parsed.signedBy, 
        signedAt: new Date(), 
        signatureHash: parsed.signatureHash 
      },
      status: 'approved',
      lastModified: new Date(),
    });

    await writeAudit({ 
      actorId: parsed.signedBy, 
      action: 'DOCUMENT_SIGN', 
      entityType: 'document', 
      entityId: params.id, 
      details: { signatureHash: parsed.signatureHash } 
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error signing document:', err);
    return NextResponse.json({ success: false, error: err?.message ?? 'Invalid payload' }, { status: 400 });
  }
}