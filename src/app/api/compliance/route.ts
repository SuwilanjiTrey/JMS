// app/api/registrar/compliance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/constants/firebase/config';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy } from 'firebase/firestore';
import { requireRole } from '@/lib/middleware/requireRole';

export async function GET(request: NextRequest) {
  try {
    // Get user from authentication
    const user = await auth.getUser(request.headers.get('authorization')?.split('Bearer ')[1] || '');
    
    // Check role authorization
    const authCheck = requireRole(user, ['admin', 'court-admin', 'registrar', 'court-registrar']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.message }, { status: 403 });
    }

    // Get court information from user profile
    const courtType = user.profile?.courtType;
    const courtLocation = user.profile?.courtLocation;
    
    if (!courtType || !courtLocation) {
      return NextResponse.json({ error: 'Court information missing from profile' }, { status: 400 });
    }

    // Generate court ID
    const courtId = `${courtType}-${courtLocation.toLowerCase().replace(/\s+/g, '-')}`;

    // Query compliance items for this court
    const complianceRef = collection(db, COLLECTIONS.COMPLIANCE);
    const q = query(
      complianceRef,
      where('courtId', '==', courtId),
      orderBy('dueDate', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const complianceItems: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      complianceItems.push({
        id: doc.id,
        ...data,
        dueDate: data.dueDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });
    
    return NextResponse.json({ complianceItems });
  } catch (error) {
    console.error('Error fetching compliance items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from authentication
    const user = await auth.getUser(request.headers.get('authorization')?.split('Bearer ')[1] || '');
    
    // Check role authorization
    const authCheck = requireRole(user, ['admin', 'court-admin', 'registrar', 'court-registrar']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.message }, { status: 403 });
    }

    const { title, caseId, caseNumber, description, dueDate, status } = await request.json();

    if (!title || !caseId || !caseNumber || !description || !dueDate) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Get court information from user profile
    const courtType = user.profile?.courtType;
    const courtLocation = user.profile?.courtLocation;
    
    if (!courtType || !courtLocation) {
      return NextResponse.json({ error: 'Court information missing from profile' }, { status: 400 });
    }

    // Generate court ID
    const courtId = `${courtType}-${courtLocation.toLowerCase().replace(/\s+/g, '-')}`;

    // Create new compliance item
    const complianceRef = collection(db, COLLECTIONS.COMPLIANCE);
    const newComplianceItem = {
      title,
      caseId,
      caseNumber,
      description,
      dueDate: new Date(dueDate),
      courtId,
      status: status || 'pending',
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(complianceRef, newComplianceItem);
    
    return NextResponse.json({
      success: true,
      message: 'Compliance item created successfully',
      complianceId: docRef.id,
      complianceItem: {
        id: docRef.id,
        ...newComplianceItem,
        dueDate: new Date(dueDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error creating compliance item:', error);
    return NextResponse.json(
      { error: 'Failed to create compliance item' },
      { status: 500 }
    );
  }
}
