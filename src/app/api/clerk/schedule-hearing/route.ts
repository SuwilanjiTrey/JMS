//app/api/clerk/schedule-hearing/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db, COLLECTIONS } from '@/lib/constants/firebase/config';
import { doc, updateDoc, serverTimestamp, addDoc, collection, getDoc } from 'firebase/firestore';
import { requireRole } from '@/lib/middleware/requireRole';
import { emitNotification } from '@/lib/notifications';
import { createAuditLog } from '@/lib/audit';
import { createCalendarEvent } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check user permissions
    const roleCheck = await requireRole(request, {
      allowedRoles: ['clerk', 'court-clerk', 'admin'],
    });

    if (roleCheck.error) {
      return roleCheck.error;
    }

    const user = roleCheck.user;
    const body = await request.json();
    const { caseId, date, time, courtroom, judgeId, notes } = body;

    // Validate input
    if (!caseId || !date || !time || !courtroom) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get case reference
    const caseRef = doc(db, COLLECTIONS.CASES, caseId);
    const caseDoc = await getDoc(caseRef);

    if (!caseDoc.exists()) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    const caseData = caseDoc.data();
    
    // Create hearing document
    const hearingData = {
      caseId,
      date: new Date(date),
      time,
      courtroom,
      judgeId,
      notes: notes || '',
      scheduledBy: user.id,
      scheduledAt: serverTimestamp(),
      status: 'scheduled',
    };

    const hearingRef = await addDoc(collection(db, COLLECTIONS.HEARINGS), hearingData);
    
    // Create calendar event
    const startTime = new Date(`${date}T${time}`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Assume 1 hour duration

    await createCalendarEvent({
      title: `Hearing for ${caseData.title}`,
      description: notes || `Hearing for case ${caseData.caseNumber}`,
      courtId: caseData.courtId,
      judgeId,
      caseId,
      startTime,
      endTime,
      location: courtroom,
      eventType: 'hearing',
    });

    // Update case with hearing reference
    await updateDoc(caseRef, {
      hearingId: hearingRef.id,
      updatedAt: serverTimestamp(),
    });

    // Create audit log
    await createAuditLog({
      action: 'schedule_hearing',
      userId: user.id,
      targetId: caseId,
      targetType: 'case',
      details: {
        caseId,
        hearingId: hearingRef.id,
        date,
        time,
        courtroom,
        judgeId,
        notes: notes || '',
      },
    });

    // Emit notification
    await emitNotification({
      type: 'hearing_scheduled',
      recipientIds: [caseData.plaintiffId, caseData.defendantId, judgeId],
      title: 'Hearing Scheduled',
      message: `A hearing has been scheduled for case ${caseData.caseNumber}`,
      data: {
        caseId,
        hearingId: hearingRef.id,
        date,
        time,
        courtroom,
      },
    });

    return NextResponse.json({
      ok: true,
      caseId,
      hearingId: hearingRef.id,
    });
  } catch (error) {
    console.error('Error scheduling hearing:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
