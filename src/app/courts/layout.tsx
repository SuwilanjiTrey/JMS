'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import RoleGuard from '@/components/RoleGuard';
import { UserRole } from '@/models';

export default function CourtsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userRole, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // FIXED: Added admin roles that should also have access to courts
  const allowedRoles: UserRole[] = [
    // Admin roles - they should have access to all sections
    'admin',
    'super-admin',
    
    
    // Court-specific roles
    'judge',
    'court-admin',
    'supreme-court',
    'constitutional-court',
    'high-court',
    'subordinate-magistrate',
    'local-courts',
    'specialized-tribunals',
    'small-claims',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zambia-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-gray-50">
        <Navbar 
          userRole={userRole}
          userName={user?.displayName}
          userAvatar={user?.photoURL}
        />
        
        <div className="flex">
          <Sidebar 
            userRole={userRole as UserRole}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
          
          <div className="flex-1 lg:ml-0">
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
