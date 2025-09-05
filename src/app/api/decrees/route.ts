// app/api/registrar/decrees/route.ts
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

    // Query decrees for this court
    const decreesRef = collection(db, COLLECTIONS.DECREES);
    const q = query(
      decreesRef,
      where('courtId', '==', courtId),
      orderBy('issuedDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const decrees: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      decrees.push({
        id: doc.id,
        ...data,
        issuedDate: data.issuedDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });
    
    return NextResponse.json({ decrees });
  } catch (error) {
    console.error('Error fetching decrees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch decrees' },
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

    const { title, caseId, caseNumber, description, issuedDate, judgeId, status } = await request.json();

    if (!title || !caseId || !caseNumber || !description || !issuedDate || !judgeId) {
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

    // Create new decree
    const decreesRef = collection(db, COLLECTIONS.DECREES);
    const newDecree = {
      title,
      caseId,
      caseNumber,
      description,
      issuedDate: new Date(issuedDate),
      judgeId,
      courtId,
      status: status || 'issued',
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(decreesRef, newDecree);
    
    return NextResponse.json({
      success: true,
      message: 'Decree created successfully',
      decreeId: docRef.id,
      decree: {
        id: docRef.id,
        ...newDecree,
        issuedDate: new Date(issuedDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error creating decree:', error);
    return NextResponse.json(
      { error: 'Failed to create decree' },
      { status: 500 }
    );
  }
}
