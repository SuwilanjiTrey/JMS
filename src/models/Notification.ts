export type RecipientType = 'judge' | 'lawyer' | 'party' | 'staff';
export interface Notification {
    id: string;
    recipientUserId: string;
    recipientType?: RecipientType;
    title: string;
    message: string;
    createdAt: Date;
    readAt?: Date;
    relatedEntity?: { type: 'case' | 'hearing' | 'document'; id: string };
}