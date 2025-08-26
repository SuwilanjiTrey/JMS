'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import RoleGuard from '@/components/RoleGuard';
import { UserRole } from '@/models';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userRole, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    <RoleGuard allowedRoles={['admin']}>
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