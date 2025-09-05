// app/api/registrar/calendar/[id]/route.ts
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
    const authCheck = requireRole(user, ['admin', 'court-admin', 'registrar', 'court-registrar', 'clerk', 'court-clerk']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.message }, { status: 403 });
    }

    const { id } = params;
    
    // Get event reference
    const eventRef = doc(db, COLLECTIONS.CALENDAR_EVENTS, id);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const data = eventDoc.data();
    
    return NextResponse.json({
      event: {
        id: eventDoc.id,
        ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user from authentication
    const user = await auth.getUser(request.headers.get('authorization')?.split('Bearer ')[1] || '');
    
    // Check role authorization
    const authCheck = requireRole(user, ['admin', 'court-admin', 'registrar', 'court-registrar', 'clerk', 'court-clerk']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.message }, { status: 403 });
    }

    const { id } = params;
    const { title, description, startTime, endTime, location, eventType, caseId, judgeId } = await request.json();

    // Get event reference
    const eventRef = doc(db, COLLECTIONS.CALENDAR_EVENTS, id);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Update event
    await updateDoc(eventRef, {
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location,
      eventType,
      caseId: caseId || null,
      judgeId: judgeId || null,
      updatedAt: serverTimestamp(),
    });
    
    return NextResponse.json({
      success: true,
      message: 'Event updated successfully',
      eventId: id,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user from authentication
    const user = await auth.getUser(request.headers.get('authorization')?.split('Bearer ')[1] || '');
    
    // Check role authorization
    const authCheck = requireRole(user, ['admin', 'court-admin', 'registrar', 'court-registrar', 'clerk', 'court-clerk']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.message }, { status: 403 });
    }

    const { id } = params;
    
    // Get event reference
    const eventRef = doc(db, COLLECTIONS.CALENDAR_EVENTS, id);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Delete event
    await deleteDoc(eventRef);
    
    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
      eventId: id,
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
