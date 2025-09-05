// src/models/index.ts

// Export everything from existing models
export * from './Role';
export * from './User';
export * from './Case';

// Export Document model
export * from './Document';

export type UserRole = 'admin' | 'judge' | 'lawyer' | 'public';

export type CourtType = 
  | 'small-claims' 
  | 'specialized-tribunals' 
  | 'local-courts' 
  | 'subordinate-magistrate' 
  | 'high-court' 
  | 'constitutional-court' 
  | 'supreme-court';

export interface UserProfile {
  firstName: string;
  lastName: string;
  // Judge specific fields
  courtType?: CourtType;
  courtLocation?: string;
  judgeLevel?: CourtType;
  // Lawyer specific fields
  lawFirmName?: string;
  lawFirmId?: string;
  barNumber?: string;
  specialization?: string[];
  // Admin specific fields
  adminType?: 'super-admin' | CourtType | 'law-firm-admin';
  managedCourts?: CourtType[];
  phone?: string;
  address?: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLoginAt?: Date;
  profile?: UserProfile;
}

export interface UserCreationData {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  profile?: UserProfile;
}

export interface UserUpdateData {
  displayName?: string;
  photoURL?: string;
  isActive?: boolean;
  profile?: Partial<UserProfile>;
}



// Existing User types
export type UserRole = 'admin' | 'judge' | 'lawyer';

export type CourtType = 
  | 'small-claims'
  | 'specialized-tribunal'
  | 'local-court'
  | 'subordinate-magistrate'
  | 'high-court'
  | 'constitutional-court'
  | 'supreme-court';



export interface UserProfile {
  // Common fields
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  
  // Judge-specific fields
  courtType?: CourtType;
  courtLocation?: string;
  judgeType?: string;
  judgeLevel?: CourtType;
  appointmentDate?: string;
  
  // Lawyer-specific fields
  lawFirmName?: string;
  lawFirmId?: string;
  barNumber?: string;
  specializations?: string[];
  

 
  // Admin specific fields
  adminType?: 'super-admin' | CourtType | 'law-firm-admin';
  managedCourts?: CourtType[];
  phone?: string;
  address?: string;
  permissions?: string[];
}


// Law Firm related types
export interface LawFirm {
  id: string;
  name: string;
  lawyers: string[];
  administrators: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  description?: string;
  website?: string;
  address?: string;
  phoneNumber?: string;
}

export interface LawFirmStats {
  firm: LawFirm;
  totalLawyers: number;
  totalCases: number;
  activeCases: number;
  pendingCases: number;
  closedCases: number;
  lawyers: LawyerProfile[];
  cases: Case[];
}

export interface LawyerProfile {
  id: string;
  email: string;
  displayName: string;
  role: string;
  photoURL?: string;
  profile?: {
    lawFirmName?: string;
    lawFirmId?: string;
    barNumber?: string;
    specializations?: string[];
    phoneNumber?: string;
  };
}

// Court related types
export interface Court {
  id: string;
  type: CourtType;
  name: string;
  location: string;
  judges: string[];
  administrators: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  jurisdiction?: string;
  address?: string;
  phoneNumber?: string;
}

// Case related types
export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  type: string;
  status: 'pending' | 'active' | 'closed' | 'dismissed';
  filingDate: Date;
  plaintiff: {
    name: string;
    lawyerId?: string;
    contact?: string;
  };
  defendant: {
    name: string;
    lawyerId?: string;
    contact?: string;
  };
  judgeId?: string;
  courtId?: string;
  description?: string;
  documents?: string[];
  hearings?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Hearing related types
export interface Hearing {
  id: string;
  caseId: string;
  date: Date;
  time: string;
  courtroom?: string;
  judgeId: string;
  type: 'initial' | 'preliminary' | 'trial' | 'sentencing' | 'appeal';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'postponed';
  notes?: string;
  attendees?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Document related types
export interface Document {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  caseId?: string;
  tags?: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// System Alert types
export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: string;
  isRead?: boolean;
  userId?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Dashboard Stats types
export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  pendingHearings: number;
  totalUsers: number;
  documentsProcessed: number;
  aiQueriesHandled: number;
  parliamentUpdates: number;
  systemHealth: number;
}

// Enhanced Dashboard Stats for Lawyers
export interface LawyerDashboardStats extends DashboardStats {
  firmTotalCases: number;
  firmActiveCases: number;
  firmTotalLawyers: number;
  firmColleagues: LawyerProfile[];
}

// Parliament Updates types
export interface ParliamentUpdate {
  id: string;
  title: string;
  type: 'bill' | 'amendment' | 'regulation' | 'policy';
  summary: string;
  status: 'proposed' | 'under-review' | 'passed' | 'rejected';
  affectedAreas: string[];
  publishedDate: Date;
  effectiveDate?: Date;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}

// AI Query types
export interface AIQuery {
  id: string;
  userId: string;
  query: string;
  response: string;
  category: 'case-research' | 'legal-advice' | 'document-analysis' | 'general';
  timestamp: Date;
  satisfaction?: number;
  followUp?: boolean;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'case-update' | 'hearing-reminder' | 'document-shared' | 'system-alert';
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  createdAt: Date;
  readAt?: Date;
}

// Court level mapping for UI display
export const courtTypes = [
  { value: 'small-claims', label: 'Small Claims Court', level: 1 },
  { value: 'specialized-tribunal', label: 'Specialized Tribunal', level: 2 },
  { value: 'local-court', label: 'Local Court', level: 3 },
  { value: 'subordinate-magistrate', label: 'Subordinate/Magistrate Court', level: 4 },
  { value: 'high-court', label: 'High Court', level: 5 },
  { value: 'constitutional-court', label: 'Constitutional Court', level: 6 },
  { value: 'supreme-court', label: 'Supreme Court', level: 7 }
] as const;

// Legal specializations
export const legalSpecializations = [
  'Civil Law',
  'Criminal Law',
  'Family Law',
  'Commercial Law',
  'Constitutional Law',
  'Labor Law',
  'Tax Law',
  'Administrative Law',
  'Environmental Law',
  'Intellectual Property Law',
  'Human Rights Law',
  'Corporate Law'
] as const;

export type LegalSpecialization = typeof legalSpecializations[number];
