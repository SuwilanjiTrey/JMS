// app/api/registrar/compliance/[id]/route.ts
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
    
    // Get compliance item reference
    const complianceRef = doc(db, COLLECTIONS.COMPLIANCE, id);
    const complianceDoc = await getDoc(complianceRef);

    if (!complianceDoc.exists()) {
      return NextResponse.json({ error: 'Compliance item not found' }, { status: 404 });
    }

    const data = complianceDoc.data();
    
    return NextResponse.json({
      complianceItem: {
        id: complianceDoc.id,
        ...data,
        dueDate: data.dueDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching compliance item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance item' },
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
    const { title, caseId, caseNumber, description, dueDate, status } = await request.json();

    // Get compliance item reference
    const complianceRef = doc(db, COLLECTIONS.COMPLIANCE, id);
    const complianceDoc = await getDoc(complianceRef);

    if (!complianceDoc.exists()) {
      return NextResponse.json({ error: 'Compliance item not found' }, { status: 404 });
    }

    // Update compliance item
    await updateDoc(complianceRef, {
      title,
      caseId,
      caseNumber,
      description,
      dueDate: new Date(dueDate),
      status,
      updatedAt: serverTimestamp(),
    });
    
    return NextResponse.json({
      success: true,
      message: 'Compliance item updated successfully',
      complianceId: id,
    });
  } catch (error) {
    console.error('Error updating compliance item:', error);
    return NextResponse.json(
      { error: 'Failed to update compliance item' },
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
    
    // Get compliance item reference
    const complianceRef = doc(db, COLLECTIONS.COMPLIANCE, id);
    const complianceDoc = await getDoc(complianceRef);

    if (!complianceDoc.exists()) {
      return NextResponse.json({ error: 'Compliance item not found' }, { status: 404 });
    }

    // Delete compliance item
    await deleteDoc(complianceRef);
    
    return NextResponse.json({
      success: true,
      message: 'Compliance item deleted successfully',
      complianceId: id,
    });
  } catch (error) {
    console.error('Error deleting compliance item:', error);
    return NextResponse.json(
      { error: 'Failed to delete compliance item' },
      { status: 500 }
    );
  }
}
