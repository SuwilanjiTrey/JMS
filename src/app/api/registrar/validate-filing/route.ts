// app/api/registrar/validate-filing/route.ts
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

    const { caseId, status, reasons } = await request.json();

    if (!caseId || !status) {
      return NextResponse.json({ error: 'Case ID and status are required' }, { status: 400 });
    }

    if (!['verified', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
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
      status: status === 'verified' ? 'verified' : 'rejected',
      updatedAt: serverTimestamp(),
    });

    // Add to status history
    const statusHistoryRef = doc(db, COLLECTIONS.CASE_STATUS_HISTORY, `${caseId}_${Date.now()}`);
    await updateDoc(statusHistoryRef, {
      caseId,
      previousStatus: caseData.status,
      newStatus: status === 'verified' ? 'verified' : 'rejected',
      changedBy: user.uid,
      changedAt: serverTimestamp(),
      status: status === 'verified' ? 'verified' : 'rejected',
      reason: reasons || '',
    });

    // Create audit log
    await createAuditLog({
      userId: user.uid,
      action: status === 'verified' ? 'verify_filing' : 'reject_filing',
      targetId: caseId,
      targetType: 'case',
      details: {
        previousStatus: caseData.status,
        newStatus: status === 'verified' ? 'verified' : 'rejected',
        reasons: reasons || '',
      },
    });

    // Emit notification
    await emitNotification({
      recipientIds: [caseData.createdBy],
      title: `Case ${status === 'verified' ? 'Verified' : 'Rejected'}`,
      message: `Your case ${caseData.caseNumber} has been ${status === 'verified' ? 'verified' : 'rejected'}.`,
      type: 'case_update',
      relatedId: caseId,
      relatedType: 'case',
    });

    return NextResponse.json({
      success: true,
      message: `Case ${status === 'verified' ? 'verified' : 'rejected'} successfully`,
      caseId,
      newStatus: status === 'verified' ? 'verified' : 'rejected',
    });
  } catch (error) {
    console.error('Error validating filing:', error);
    return NextResponse.json(
      { error: 'Failed to validate filing' },
      { status: 500 }
    );
  }
}
