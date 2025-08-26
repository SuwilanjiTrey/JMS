import { UserRole } from './Role';

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

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  specialization?: string; // For lawyers and judges
  courtId?: string; // For judges
  licenseNumber?: string; // For lawyers
  bio?: string;
}

export interface UserCreationData {
  email: string;
  displayName: string;
  role: UserRole;
  password: string;
  profile?: Omit<UserProfile, 'firstName' | 'lastName'> & {
    firstName: string;
    lastName: string;
  };
}

export interface UserUpdateData {
  displayName?: string;
  role?: UserRole;
  isActive?: boolean;
  profile?: Partial<UserProfile>;
}

export interface UserFilter {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}