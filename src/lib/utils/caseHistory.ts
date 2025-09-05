// Case History Management Utilities
import {
    uploadData,
    setDetails,
    getAllWhereEquals,
    getOne
} from '@/lib/utils/firebase/general';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';
import type {
    CaseStatusHistory,
    CaseEvent,
    CaseEventType,
    CaseStatus,
    Case
} from '@/models/Case';

/**
 * Creates a new status history record when case status changes
 */
export async function createStatusHistory(
    caseId: string,
    previousStatus: CaseStatus | undefined,
    newStatus: CaseStatus,
    changedBy: string,
    reason?: string,
    notes?: string,
    documents?: string[]
): Promise<boolean> {
    try {
        const statusHistory: CaseStatusHistory = {
            id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            caseId,
            previousStatus,
            newStatus,
            changedBy,
            changedAt: new Date(),
            reason,
            notes,
            documents: documents || []
        };

        const success = await uploadData(COLLECTIONS.CASE_STATUS_HISTORY, statusHistory);

        if (success) {
            // Also create a timeline event
            await createTimelineEvent(
                caseId,
                'status_change',
                `Status changed to ${newStatus}`,
                `Case status updated from ${previousStatus || 'initial'} to ${newStatus}`,
                changedBy,
                {
                    previousStatus,
                    newStatus,
                    reason,
                    notes
                }
            );
        }

        return success;
    } catch (error) {
        console.error('Error creating status history:', error);
        return false;
    }
}

/**
 * Creates a new timeline event
 */
export async function createTimelineEvent(
    caseId: string,
    type: CaseEventType,
    title: string,
    description: string,
    createdBy: string,
    metadata?: { [key: string]: any },
    relatedEntityId?: string
): Promise<boolean> {
    try {
        const event: CaseEvent = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            caseId,
            type,
            title,
            description,
            createdAt: new Date(),
            createdBy,
            relatedEntityId,
            metadata: metadata || {}
        };

        return await uploadData(COLLECTIONS.CASE_EVENTS, event);
    } catch (error) {
        console.error('Error creating timeline event:', error);
        return false;
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use createStatusHistory instead
 */
export async function trackStatusChange(
    caseId: string,
    newStatus: string,
    userId: string,
    notes?: string,
    previousStatus?: string
): Promise<boolean> {
    return await createStatusHistory(
        caseId,
        previousStatus as CaseStatus,
        newStatus as CaseStatus,
        userId,
        undefined, // reason
        notes
    );
}

/**
 * Legacy function for tracking process stages
 * @deprecated Use createTimelineEvent instead
 */
export async function trackProcessStage(
    caseId: string,
    stage: string,
    userId: string,
    notes?: string,
    documents?: string[]
): Promise<boolean> {
    return await createTimelineEvent(
        caseId,
        'process_stage',
        `Process Stage: ${stage}`,
        notes || `Process stage ${stage} completed`,
        userId,
        {
            stage,
            documents: documents || []
        }
    );
}

/**
 * Gets complete case history (status changes + timeline events)
 */
export async function getCaseHistory(caseId: string): Promise<{
    statusHistory: CaseStatusHistory[];
    timeline: CaseEvent[];
    combined: Array<CaseStatusHistory | CaseEvent>;
}> {
    try {
        const [statusHistory, timeline] = await Promise.all([
            getAllWhereEquals(COLLECTIONS.CASE_STATUS_HISTORY, 'caseId', caseId),
            getAllWhereEquals(COLLECTIONS.CASE_EVENTS, 'caseId', caseId)
        ]);

        // Convert Firestore timestamps to Date objects
        const processedStatusHistory = statusHistory.map((item: any) => ({
            ...item,
            changedAt: item.changedAt?.toDate ? item.changedAt.toDate() : new Date(item.changedAt)
        })) as CaseStatusHistory[];

        const processedTimeline = timeline.map((item: any) => ({
            ...item,
            createdAt: item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt)
        })) as CaseEvent[];

        // Combine and sort by date
        const combined = [
            ...processedStatusHistory.map(item => ({ ...item, _type: 'status' as const })),
            ...processedTimeline.map(item => ({ ...item, _type: 'event' as const }))
        ].sort((a, b) => {
            const dateA = 'changedAt' in a ? a.changedAt : a.createdAt;
            const dateB = 'changedAt' in b ? b.changedAt : b.createdAt;
            return dateB.getTime() - dateA.getTime();
        });

        return {
            statusHistory: processedStatusHistory,
            timeline: processedTimeline,
            combined
        };
    } catch (error) {
        console.error('Error getting case history:', error);
        return {
            statusHistory: [],
            timeline: [],
            combined: []
        };
    }
}

/**
 * Creates timeline events for common case actions
 */
export const CaseHistoryHelpers = {
    // When a hearing is scheduled
    async onHearingScheduled(
        caseId: string,
        hearingId: string,
        hearingDate: Date,
        purpose: string,
        scheduledBy: string
    ) {
        return await createTimelineEvent(
            caseId,
            'hearing',
            'Hearing Scheduled',
            `${purpose} hearing scheduled for ${hearingDate.toLocaleDateString()}`,
            scheduledBy,
            {
                hearingId,
                hearingDate: hearingDate.toISOString(),
                purpose,
                type: 'scheduled'
            },
            hearingId
        );
    },

    // When a document is uploaded
    async onDocumentUploaded(
        caseId: string,
        documentId: string,
        documentName: string,
        documentType: string,
        uploadedBy: string
    ) {
        return await createTimelineEvent(
            caseId,
            'document_upload',
            'Document Uploaded',
            `${documentType} document "${documentName}" was uploaded`,
            uploadedBy,
            {
                documentId,
                documentName,
                documentType
            },
            documentId
        );
    },

    // When a ruling is made
    async onRulingIssued(
        caseId: string,
        rulingId: string,
        rulingTitle: string,
        rulingType: string,
        judgeId: string
    ) {
        return await createTimelineEvent(
            caseId,
            'ruling',
            'Ruling Issued',
            `${rulingType} ruling "${rulingTitle}" was issued`,
            judgeId,
            {
                rulingId,
                rulingTitle,
                rulingType
            },
            rulingId
        );
    },

    // When case is assigned to a judge
    async onCaseAssigned(
        caseId: string,
        judgeName: string,
        assignedBy: string
    ) {
        return await createTimelineEvent(
            caseId,
            'assignment',
            'Judge Assigned',
            `Case assigned to ${judgeName}`,
            assignedBy,
            {
                assignedTo: judgeName,
                assignmentType: 'judge'
            }
        );
    },

    // When parties are added/modified
    async onPartyChange(
        caseId: string,
        changeType: 'added' | 'removed' | 'modified',
        partyName: string,
        partyType: 'plaintiff' | 'defendant',
        changedBy: string
    ) {
        return await createTimelineEvent(
            caseId,
            'party_change',
            `${partyType.charAt(0).toUpperCase() + partyType.slice(1)} ${changeType}`,
            `${partyType} "${partyName}" was ${changeType}`,
            changedBy,
            {
                changeType,
                partyName,
                partyType
            }
        );
    },

    // When a note is added
    async onNoteAdded(
        caseId: string,
        noteTitle: string,
        noteContent: string,
        addedBy: string,
        priority?: 'low' | 'medium' | 'high'
    ) {
        return await createTimelineEvent(
            caseId,
            'note',
            noteTitle,
            noteContent,
            addedBy,
            {
                priority: priority || 'medium',
                noteType: 'general'
            }
        );
    }
};

/**
 * Enhanced case status update with history tracking
 */
export async function updateCaseStatusWithHistory(
    caseId: string,
    currentStatus: CaseStatus,
    newStatus: CaseStatus,
    changedBy: string,
    reason?: string,
    notes?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // First get the current case data
        const caseData = await getOne(caseId, COLLECTIONS.CASES);

        if (!caseData) {
            return { success: false, error: 'Case not found' };
        }

        const updatedCase = {
            ...caseData,
            status: newStatus,
            updatedAt: new Date()
        };

        const updateResult = await setDetails(updatedCase, COLLECTIONS.CASES, caseId);

        if (!updateResult.success) {
            return { success: false, error: updateResult.error };
        }

        // Create status history record
        const historySuccess = await createStatusHistory(
            caseId,
            currentStatus,
            newStatus,
            changedBy,
            reason,
            notes
        );

        if (!historySuccess) {
            console.warn('Failed to create status history record');
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating case status with history:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Get case timeline for display (simplified events)
 */
export async function getCaseTimeline(caseId: string): Promise<Array<{
    id: string;
    type: CaseEventType;
    title: string;
    description: string;
    date: Date;
    createdBy: string;
    metadata?: { [key: string]: any };
}>> {
    try {
        const { combined } = await getCaseHistory(caseId);

        return combined.map(item => {
            if ('changedAt' in item) {
                // Status history item
                return {
                    id: item.id,
                    type: 'status_change' as CaseEventType,
                    title: `Status changed to ${item.newStatus}`,
                    description: `Case status updated from ${item.previousStatus || 'initial'} to ${item.newStatus}`,
                    date: item.changedAt,
                    createdBy: item.changedBy,
                    metadata: {
                        previousStatus: item.previousStatus,
                        newStatus: item.newStatus,
                        reason: item.reason,
                        notes: item.notes
                    }
                };
            } else {
                // Timeline event item
                return {
                    id: item.id,
                    type: item.type,
                    title: item.title,
                    description: item.description,
                    date: item.createdAt,
                    createdBy: item.createdBy,
                    metadata: item.metadata
                };
            }
        });
    } catch (error) {
        console.error('Error getting case timeline:', error);
        return [];
    }
}

/**
 * Generate case history report
 */
export async function generateCaseHistoryReport(caseId: string): Promise<{
    summary: {
        totalEvents: number;
        statusChanges: number;
        hearings: number;
        documentsUploaded: number;
        rulings: number;
        durationDays: number;
    };
    timeline: Array<{
        date: string;
        events: Array<{
            type: string;
            title: string;
            description: string;
            createdBy: string;
        }>;
    }>;
}> {
    try {
        const { statusHistory, timeline } = await getCaseHistory(caseId);

        const allEvents = [
            ...statusHistory.map(item => ({ ...item, _type: 'status', date: item.changedAt })),
            ...timeline.map(item => ({ ...item, _type: 'event', date: item.createdAt }))
        ].sort((a, b) => a.date.getTime() - b.date.getTime());

        const summary = {
            totalEvents: allEvents.length,
            statusChanges: statusHistory.length,
            hearings: timeline.filter(e => e.type === 'hearing').length,
            documentsUploaded: timeline.filter(e => e.type === 'document_upload').length,
            rulings: timeline.filter(e => e.type === 'ruling').length,
            durationDays: allEvents.length > 0
                ? Math.ceil((new Date().getTime() - allEvents[0].date.getTime()) / (1000 * 60 * 60 * 24))
                : 0
        };

        // Group events by date
        const timelineByDate: { [key: string]: Array<any> } = {};
        allEvents.forEach(event => {
            const dateKey = event.date.toDateString();
            if (!timelineByDate[dateKey]) {
                timelineByDate[dateKey] = [];
            }
            timelineByDate[dateKey].push(event);
        });

        const timelineData = Object.entries(timelineByDate).map(([date, events]) => ({
            date,
            events: events.map(event => ({
                type: event._type === 'status' ? 'Status Change' : event.type,
                title: event._type === 'status'
                    ? `Status changed to ${event.newStatus}`
                    : event.title,
                description: event._type === 'status'
                    ? `Changed from ${event.previousStatus || 'initial'} to ${event.newStatus}`
                    : event.description,
                createdBy: event._type === 'status' ? event.changedBy : event.createdBy
            }))
        }));

        return {
            summary,
            timeline: timelineData
        };
    } catch (error) {
        console.error('Error generating case history report:', error);
        return {
            summary: {
                totalEvents: 0,
                statusChanges: 0,
                hearings: 0,
                documentsUploaded: 0,
                rulings: 0,
                durationDays: 0
            },
            timeline: []
        };
    }
}