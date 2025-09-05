// app/api/registrar/issue-summons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/constants/firebase/config';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { requireRole } from '@/lib/middleware/requireRole';
import { createAuditLog } from '@/lib/audit';
import { emitNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    // Get user from authentication
    const user = await auth.getUser(request.headers.get('authorization')?.split('Bearer ')[1] || '');
    
    // Check role authorization
    const authCheck = requireRole(user, ['admin', 'court-admin', 'registrar', 'court-registrar']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.message }, { status: 403 });
    }

    const { caseId, summonsDate, notes } = await request.json();

    if (!caseId || !summonsDate) {
      return NextResponse.json({ error: 'Case ID and summons date are required' }, { status: 400 });
    }

    // Get case reference
    const caseRef = doc(db, COLLECTIONS.CASES, caseId);
    const caseDoc = await getDoc(caseRef);

    if (!caseDoc.exists()) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const caseData = caseDoc.data();
    
    // Update case status
    await updateDoc(caseRef, {
      status: 'summons',
      updatedAt: serverTimestamp(),
    });

    // Add to status history
    const statusHistoryRef = doc(db, COLLECTIONS.CASE_STATUS_HISTORY, `${caseId}_${Date.now()}`);
    await updateDoc(statusHistoryRef, {
      caseId,
      previousStatus: caseData.status,
      newStatus: 'summons',
      changedBy: user.uid,
      changedAt: serverTimestamp(),
      status: 'summons',
      notes: notes || '',
    });

    // Create audit log
    await createAuditLog({
      userId: user.uid,
      action: 'issue_summons',
      targetId: caseId,
      targetType: 'case',
      details: {
        previousStatus: caseData.status,
        newStatus: 'summons',
        summonsDate,
        notes: notes || '',
      },
    });

    // Emit notification to all parties involved
    const recipientIds = [
      caseData.createdBy,
      ...(caseData.plaintiffs?.map((p: any) => p.representative) || []),
      ...(caseData.defendants?.map((d: any) => d.representative) || []),
    ].filter(Boolean);

    await emitNotification({
      recipientIds,
      title: 'Summons Issued',
      message: `A summons has been issued for case ${caseData.caseNumber}.`,
      type: 'summons_issued',
      relatedId: caseId,
      relatedType: 'case',
    });

    return NextResponse.json({
      success: true,
      message: 'Summons issued successfully',
      caseId,
      newStatus: 'summons',
    });
  } catch (error) {
    console.error('Error issuing summons:', error);
    return NextResponse.json(
      { error: 'Failed to issue summons' },
      { status: 500 }
    );
  }
}
