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
