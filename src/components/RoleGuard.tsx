'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/models';
import { hasPermission } from '@/models';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  requiredPermission?: string;
  redirectTo?: string;
  fallback?: ReactNode;
}

export default function RoleGuard({
  children,
  allowedRoles,
  requiredPermission,
  redirectTo = '/login',
  fallback
}: RoleGuardProps) {
  const router = useRouter();

  useEffect(() => {
    const checkAccess = () => {
      // Get user role from localStorage (in real app, this would come from auth context)
      const userRole = localStorage.getItem('userRole') as UserRole | null;
      
      if (!userRole) {
        router.push(redirectTo);
        return;
      }

      // Check if user role is allowed
      if (!allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        const dashboardPath = getDashboardPath(userRole);
        router.push(dashboardPath);
        return;
      }

      // Check specific permission if required
      if (requiredPermission && !hasPermission(userRole, requiredPermission as any)) {
        // Redirect to unauthorized page or dashboard
        router.push('/unauthorized');
        return;
      }
    };

    checkAccess();
  }, [allowedRoles, requiredPermission, redirectTo, router]);

  const getDashboardPath = (role: UserRole): string => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'judge':
        return '/judges';
      case 'lawyer':
        return '/lawyers';
      case 'public':
        return '/public';
      default:
        return '/';
    }
  };

  // While checking access, show fallback or nothing
  const userRole = localStorage.getItem('userRole') as UserRole | null;
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    return fallback || <div className="p-4">Loading...</div>;
  }

  if (requiredPermission && !hasPermission(userRole, requiredPermission as any)) {
    return fallback || <div className="p-4">Access denied</div>;
  }

  return <>{children}</>;
}

// Higher-order component for role-based protection
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<RoleGuardProps, 'children'>
) {
  return function GuardedComponent(props: P) {
    return (
      <RoleGuard {...options}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}