// lib/middleware/requireRole.ts
import { authenticateRequest } from './auth';
import { NextRequest } from 'next/server';
import { User } from '@/models';

interface AuthCheckResult {
  authorized: boolean;
  user?: User;
  message?: string;
}

export async function requireRole(request: NextRequest, allowedRoles: string[]): Promise<AuthCheckResult> {
  console.log('Checking role for:', allowedRoles);
  
  const { user, error } = await authenticateRequest(request);
  
  if (error || !user) {
    console.log('Authentication failed:', error);
    return { authorized: false, message: error || 'Authentication failed' };
  }
  
  // Normalize role
  const userRole = user.profile?.adminType ?? user.role;
  console.log('User role:', userRole);
  
  if (allowedRoles.includes(userRole)) {
    console.log('Role check passed');
    return { authorized: true, user };
  } else {
    console.log('Role check failed');
    return { authorized: false, message: 'Insufficient permissions' };
  }
}
