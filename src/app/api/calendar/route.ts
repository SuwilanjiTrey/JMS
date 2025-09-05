// app/api/registrar/calendar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/constants/firebase/config';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy } from 'firebase/firestore';
import { requireRole } from '@/lib/middleware/requireRole';

export async function GET(request: NextRequest) {
  try {
    console.log('Calendar API GET called');
    
    // Check role authorization
    const authCheck = await requireRole(request, ['admin', 'court-admin', 'registrar', 'court-registrar', 'clerk', 'court-clerk']);
    if (!authCheck.authorized) {
      console.log('Authorization failed:', authCheck.message);
      return NextResponse.json({ error: authCheck.message }, { status: 403 });
    }

    const user = authCheck.user!;
    console.log('User authenticated:', user.id);
    
    // Get court information from user profile
    const courtType = user.profile?.courtType;
    const courtLocation = user.profile?.courtLocation;
    
    if (!courtType || !courtLocation) {
      console.log('Missing court information');
      return NextResponse.json({ error: 'Court information missing from profile' }, { status: 400 });
    }

    // Generate court ID
    const courtId = `${courtType}-${courtLocation.toLowerCase().replace(/\s+/g, '-')}`;
    console.log('Court ID:', courtId);

    // Query calendar events for this court
    const eventsRef = collection(db, COLLECTIONS.CALENDAR_EVENTS);
    const q = query(
      eventsRef,
      where('courtId', '==', courtId),
      orderBy('startTime', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const events: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });
    
    console.log('Found events:', events.length);
    
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error in calendar API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Calendar API POST called');
    
    // Check role authorization
    const authCheck = await requireRole(request, ['admin', 'court-admin', 'registrar', 'court-registrar', 'clerk', 'court-clerk']);
    if (!authCheck.authorized) {
      console.log('Authorization failed:', authCheck.message);
      return NextResponse.json({ error: authCheck.message }, { status: 403 });
    }

    const user = authCheck.user!;
    console.log('User authenticated:', user.id);
    
    const { title, description, startTime, endTime, location, eventType, caseId, judgeId } = await request.json();

    if (!title || !description || !startTime || !endTime || !location || !eventType) {
      console.log('Missing required fields');
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Get court information from user profile
    const courtType = user.profile?.courtType;
    const courtLocation = user.profile?.courtLocation;
    
    if (!courtType || !courtLocation) {
      console.log('Missing court information');
      return NextResponse.json({ error: 'Court information missing from profile' }, { status: 400 });
    }

    // Generate court ID
    const courtId = `${courtType}-${courtLocation.toLowerCase().replace(/\s+/g, '-')}`;
    console.log('Court ID:', courtId);

    // Create new calendar event
    const eventsRef = collection(db, COLLECTIONS.CALENDAR_EVENTS);
    const newEvent = {
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location,
      eventType,
      courtId,
      caseId: caseId || null,
      judgeId: judgeId || null,
      createdBy: user.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(eventsRef, newEvent);
    console.log('Event created with ID:', docRef.id);
    
    return NextResponse.json({
      success: true,
      message: 'Event created successfully',
      eventId: docRef.id,
      event: {
        id: docRef.id,
        ...newEvent,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error in calendar POST API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}
