'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAll } from '@/lib/utils/firebase/general';

import LoadingComponent from '@/components/exports/LoadingComponent';
import DashboardStats from '@/models/dashboard_stats';

// Public-specific components
import PublicHeader from '@/components/exports/PublicHeader';
import PublicOverviewCards from '@/components/exports/PublicOverviewCards';
import PublicCaseSearch from '@/components/exports/PublicCaseSearch';

export default function PublicDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    pendingHearings: 0,
    totalUsers: 0,
    documentsProcessed: 0,
    aiQueriesHandled: 0,
    parliamentUpdates: 0,
    systemHealth: 95
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const userRole = localStorage.getItem('userRole');
      if (userRole !== 'public') {
        router.push('/login');
      }
    };
    checkAuth();
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load public-accessible data from Firebase
      const cases = await getAll('cases').catch(() => []);

      // Only show public cases (non-confidential)
      const publicCases = cases.filter((c: any) => !c.isConfidential);
      const activeCases = publicCases.filter((c: any) => c.status === 'active').length;

      setStats({
        totalCases: publicCases.length,
        activeCases,
        pendingHearings: 0, // Not shown to public
        totalUsers: 0, // Not relevant for public
        documentsProcessed: 0, // Not relevant for public
        aiQueriesHandled: 0, // Not relevant for public
        parliamentUpdates: 0, // Not relevant for public
        systemHealth: 95
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadDashboardData();
  };

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <PublicHeader onRefresh={refreshData} />

      {/* Public Overview Cards */}
      <PublicOverviewCards stats={stats} />

      {/* Public Case Search */}
      <PublicCaseSearch router={router} />
    </div>
  );
}