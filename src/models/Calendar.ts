export interface CalendarEvent {
    id: string;
    caseId: string;
    hearingId: string;
    judgeId: string;
    title: string; // e.g., "Hearing: State vs Mulenga"
    start: Date; // Date + time
    end: Date;
    location: string;
    createdAt: Date;
    updatedAt: Date;
}