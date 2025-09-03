export type AuditAction =
  | 'CASE_CREATE'
  | 'CASE_UPDATE'
  | 'CASE_STATUS_UPDATE'
  | 'HEARING_CREATE'
  | 'HEARING_UPDATE'
  | 'DOCUMENT_CREATE'
  | 'DOCUMENT_UPDATE'
  | 'DOCUMENT_SIGN'
  | 'DOCUMENT_SEAL'
  | 'NOTIFICATION_SEND';

export interface AuditLog {
  id: string;
  actorId: string; // User ID performing the action
  action: AuditAction;
  entityType: 'case' | 'hearing' | 'document' | 'user' | 'system';
  entityId: string;
  timestamp: Date;
  details?: Record<string, any>; // change set, metadata
  ip?: string;
  userAgent?: string;
}