// app/api/registrar/allocate-case/route.ts
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

    const { caseId, judgeId } = await request.json();

    if (!caseId || !judgeId) {
      return NextResponse.json({ error: 'Case ID and judge ID are required' }, { status: 400 });
    }

    // Get case reference
    const caseRef = doc(db, COLLECTIONS.CASES, caseId);
    const caseDoc = await getDoc(caseRef);

    if (!caseDoc.exists()) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const caseData = caseDoc.data();
    
    // Get judge reference
    const judgeRef = doc(db, COLLECTIONS.USERS, judgeId);
    const judgeDoc = await getDoc(judgeRef);

    if (!judgeDoc.exists()) {
      return NextResponse.json({ error: 'Judge not found' }, { status: 404 });
    }

    // Update case with assigned judge
    await updateDoc(caseRef, {
      assignedTo: judgeId,
      updatedAt: serverTimestamp(),
    });

    // Update judge's assigned cases
    const judgeData = judgeDoc.data();
    const assignedCases = judgeData.profile?.assignedCases || [];
    
    if (!assignedCases.some((ref: any) => ref.id === caseId)) {
      await updateDoc(judgeRef, {
        'profile.assignedCases': [...assignedCases, caseRef],
        updatedAt: serverTimestamp(),
      });
    }

    // Create audit log
    await createAuditLog({
      userId: user.uid,
      action: 'allocate_case',
      targetId: caseId,
      targetType: 'case',
      details: {
        judgeId,
        previousAssignedTo: caseData.assignedTo,
        newAssignedTo: judgeId,
      },
    });

    // Emit notification to judge
    await emitNotification({
      recipientIds: [judgeId],
      title: 'New Case Assigned',
      message: `Case ${caseData.caseNumber} has been assigned to you.`,
      type: 'case_assigned',
      relatedId: caseId,
      relatedType: 'case',
    });

    return NextResponse.json({
      success: true,
      message: 'Case allocated successfully',
      caseId,
      judgeId,
    });
  } catch (error) {
    console.error('Error allocating case:', error);
    return NextResponse.json(
      { error: 'Failed to allocate case' },
      { status: 500 }
    );
  }
}
