import { UserRole } from './Role';

// Updated case statuses to reflect actual judicial process
export type CaseStatus = 'filed' | 'summons' | 'takes_off' | 'recording' | 'adjournment' | 'ruling' | 'appeal' | 'closed' | 'dismissed';
export type CasePriority = 'low' | 'medium' | 'high' | 'urgent';
export type CaseType = 'civil' | 'criminal' | 'family' | 'commercial' | 'constitutional' | 'other';

// New interface for case status history
export interface CaseStatusHistory {
  id: string;
  caseId: string;
  previousStatus?: CaseStatus;
  newStatus: CaseStatus;
  changedBy: string; // User ID
  changedAt: Date;
  reason?: string;
  notes?: string;
  documents?: string[]; // Document IDs related to status change
}

// Event types for case timeline
export type CaseEventType = 'status_change' | 'hearing' | 'document_upload' | 'ruling' | 'assignment' | 'note' | 'party_change' | 'process_stage';

// Unified case event for timeline
export interface CaseEvent {
  id: string;
  caseId: string;
  type: CaseEventType;
  title: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  relatedEntityId?: string; // ID of related hearing, document, etc.
  metadata?: {
    previousValue?: any;
    newValue?: any;
    [key: string]: any;
  };
}

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  type: CaseType;
  status: CaseStatus;
  priority: CasePriority;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  assignedTo?: string; // Judge ID
  plaintiffs: CaseParty[];
  defendants: CaseParty[];
  lawyers: CaseLawyer[];
  hearings: Hearing[];
  documents: CaseDocument[];
  rulings: Ruling[];
  tags: string[];
  estimatedDuration?: number; // in days
  actualDuration?: number; // in days
  nextHearingDate?: Date;

  // New fields for history tracking
  statusHistory: CaseStatusHistory[];
  timeline: CaseEvent[];
}

export interface CaseParty {
  id: string;
  name: string;
  type: 'individual' | 'organization';
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  representative?: string; // Lawyer ID
}

export interface CaseLawyer {
  id: string;
  userId: string; // User ID
  role: 'plaintiff' | 'defendant';
  assignedAt: Date;
  isActive: boolean;
}

export interface Hearing {
  id: string;
  caseId: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  judgeId: string;
  purpose: string;
  notes?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'postponed';
  outcome?: string;
}

export interface CaseDocument {
  id: string;
  caseId: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string; // User ID
  uploadedAt: Date;
  url: string;
  category: 'pleading' | 'evidence' | 'motion' | 'order' | 'correspondence' | 'other';
  isConfidential: boolean;
  description?: string;
  tags: string[];
}

export interface Ruling {
  id: string;
  caseId: string;
  judgeId: string;
  title: string;
  content: string;
  issuedAt: Date;
  effectiveDate?: Date;
  type: 'judgment' | 'order' | 'injunction' | 'dismissal' | 'other';
  status: 'draft' | 'issued' | 'appealed' | 'enforced';
  documents: string[]; // Document IDs
}

export interface CaseCreationData {
  title: string;
  description: string;
  type: CaseType;
  priority: CasePriority;
  plaintiffs: Omit<CaseParty, 'id'>[];
  defendants: Omit<CaseParty, 'id'>[];
  lawyers?: Omit<CaseLawyer, 'id' | 'assignedAt' | 'isActive'>[];
  estimatedDuration?: number;
  tags?: string[];
}

export interface CaseUpdateData {
  title?: string;
  description?: string;
  status?: CaseStatus;
  priority?: CasePriority;
  assignedTo?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  nextHearingDate?: Date;
  tags?: string[];
}

export interface CaseFilter {
  status?: CaseStatus;
  type?: CaseType;
  priority?: CasePriority;
  assignedTo?: string;
  createdBy?: string;
  search?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Updated status colors for new statuses
export const CASE_STATUS_COLORS: Record<CaseStatus, string> = {
  filed: 'bg-blue-100 text-blue-800',
  summons: 'bg-indigo-100 text-indigo-800',
  takes_off: 'bg-cyan-100 text-cyan-800',
  recording: 'bg-yellow-100 text-yellow-800',
  adjournment: 'bg-orange-100 text-orange-800',
  ruling: 'bg-purple-100 text-purple-800',
  appeal: 'bg-pink-100 text-pink-800',
  closed: 'bg-green-100 text-green-800',
  dismissed: 'bg-red-100 text-red-800'
};

// Updated status labels
export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  filed: 'Case Filed',
  summons: 'Summons Issued',
  takes_off: 'Case Takes Off',
  recording: 'Recording Stage',
  adjournment: 'Adjournment',
  ruling: 'Ruling',
  appeal: 'Appeal',
  closed: 'Closed',
  dismissed: 'Dismissed'
};

export const CASE_PRIORITY_COLORS: Record<CasePriority, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  civil: 'Civil',
  criminal: 'Criminal',
  family: 'Family',
  commercial: 'Commercial',
  constitutional: 'Constitutional',
  other: 'Other'
};
