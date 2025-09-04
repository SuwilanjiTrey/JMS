// In your lib/utils/caseHistory.ts file:
import { uploadData } from './firebase/general';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';
import type { CaseStatusHistory } from '@/models';

export async function trackStatusChange(
    caseId: string,
    newStatus: string,
    userId: string,
    notes?: string,
    previousStatus?: string
): Promise<boolean> {
    const statusHistory: CaseStatusHistory = {
        id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        caseId,
        status: newStatus as any,
        changedBy: userId,
        changedAt: new Date(),
        notes,
        previousStatus: previousStatus as any
    };

    return await uploadData(COLLECTIONS.CASE_STATUS_HISTORY, statusHistory);
}

export async function trackProcessStage(
    caseId: string,
    stage: string,
    userId: string,
    notes?: string,
    documents?: string[]
): Promise<boolean> {
    const processStage = {
        id: `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        caseId,
        stage: stage as any,
        date: new Date(),
        completedBy: userId,
        notes,
        documents
    };

    return await uploadData(COLLECTIONS.CASE_PROCESS_STAGES, processStage);
}