'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/models';

export default function Home() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && userRole) {
        // Redirect to appropriate dashboard based on role
        const dashboardPath = getDashboardPath(userRole);
        router.push(dashboardPath);
      } else {
        // Redirect to login if not authenticated
        router.push('/login');
      }
    }
  }, [user, userRole, loading, router]);

  const getDashboardPath = (role: UserRole): string => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'law-firm-admin':
      	return '/lawfirm';
      case 'judge':
        return '/judges';
        
      case 'chief-registry-magistrate':				//court admin
      	return '/judge-admin';
      case 'lawyer':
        return '/lawyers';
      case 'public':
        return '/public';
      default:
        return '/';
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zambia-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Judicial Management System...</p>
        </div>
      </div>
    );
  }

  // This will redirect immediately, so we don't need to render anything
  return null;
}
