// app/api/registrar/decrees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/constants/firebase/config';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';
import { doc, getDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { requireRole } from '@/lib/middleware/requireRole';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user from authentication
    const user = await auth.getUser(request.headers.get('authorization')?.split('Bearer ')[1] || '');
    
    // Check role authorization
    const authCheck = requireRole(user, ['admin', 'court-admin', 'registrar', 'court-registrar']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.message }, { status: 403 });
    }

    const { id } = params;
    
    // Get decree reference
    const decreeRef = doc(db, COLLECTIONS.DECREES, id);
    const decreeDoc = await getDoc(decreeRef);

    if (!decreeDoc.exists()) {
      return NextResponse.json({ error: 'Decree not found' }, { status: 404 });
    }

    const data = decreeDoc.data();
    
    return NextResponse.json({
      decree: {
        id: decreeDoc.id,
        ...data,
        issuedDate: data.issuedDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching decree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch decree' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user from authentication
    const user = await auth.getUser(request.headers.get('authorization')?.split('Bearer ')[1] || '');
    
    // Check role authorization
    const authCheck = requireRole(user, ['admin', 'court-admin', 'registrar', 'court-registrar']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.message }, { status: 403 });
    }

    const { id } = params;
    const { title, caseId, caseNumber, description, issuedDate, judgeId, status } = await request.json();

    // Get decree reference
    const decreeRef = doc(db, COLLECTIONS.DECREES, id);
    const decreeDoc = await getDoc(decreeRef);

    if (!decreeDoc.exists()) {
      return NextResponse.json({ error: 'Decree not found' }, { status: 404 });
    }

    // Update decree
    await updateDoc(decreeRef, {
      title,
      caseId,
      caseNumber,
      description,
      issuedDate: new Date(issuedDate),
      judgeId,
      status,
      updatedAt: serverTimestamp(),
    });
    
    return NextResponse.json({
      success: true,
      message: 'Decree updated successfully',
      decreeId: id,
    });
  } catch (error) {
    console.error('Error updating decree:', error);
    return NextResponse.json(
      { error: 'Failed to update decree' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user from authentication
    const user = await auth.getUser(request.headers.get('authorization')?.split('Bearer ')[1] || '');
    
    // Check role authorization
    const authCheck = requireRole(user, ['admin', 'court-admin', 'registrar', 'court-registrar']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.message }, { status: 403 });
    }

    const { id } = params;
    
    // Get decree reference
    const decreeRef = doc(db, COLLECTIONS.DECREES, id);
    const decreeDoc = await getDoc(decreeRef);

    if (!decreeDoc.exists()) {
      return NextResponse.json({ error: 'Decree not found' }, { status: 404 });
    }

    // Delete decree
    await deleteDoc(decreeRef);
    
    return NextResponse.json({
      success: true,
      message: 'Decree deleted successfully',
      decreeId: id,
    });
  } catch (error) {
    console.error('Error deleting decree:', error);
    return NextResponse.json(
      { error: 'Failed to delete decree' },
      { status: 500 }
    );
  }
}
