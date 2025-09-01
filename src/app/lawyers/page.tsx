'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAll } from '@/lib/utils/firebase/general';

// Import our new components
import AIAssistant from '@/components/AIAssistant';
import { useParliamentUpdates } from '@/lib/parliamentIntegration';

import LoadingComponent from '@/components/exports/LoadingComponent';
import DashboardStats from '@/models/dashboard_stats';
import SystemAlert from '@/models/system_alert';
import SystemAlerts from '@/components/exports/SystemAlerts';

// Lawyer-specific components
import LawyerHeader from '@/components/exports/LawyerHeader';
import LawyerOverviewCards from '@/components/exports/LawyerOverviewCards';
import LawyerAnalyticsCards from '@/components/exports/LawyerAnalyticsCards';
import LawyerCasesTab from '@/components/exports/LawyerCasesTab';
import LawyerDocumentsTab from '@/components/exports/LawyerDocumentsTab';

export default function LawyerDashboard() {
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
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [aiQuery, setAIQuery] = useState<string>('');
  const [lawyerId, setLawyerId] = useState<string>('');

  // Use parliament updates hook
  const { updates: parliamentUpdates, loading: parliamentLoading } = useParliamentUpdates();

  useEffect(() => {
    const checkAuth = () => {
      const userRole = localStorage.getItem('userRole');
      const userId = localStorage.getItem('userId');
      if (userRole !== 'lawyer') {
        router.push('/login');
      }
      setLawyerId(userId || '');
    };
    checkAuth();
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load lawyer-specific data from Firebase
      const [cases, hearings] = await Promise.all([
        getAll('cases').catch(() => []),
        getAll('hearings').catch(() => [])
      ]);

      // Filter cases where this lawyer is involved
      const lawyerCases = cases.filter((c: any) =>
        c.plaintiff?.lawyerId === lawyerId || c.defendant?.lawyerId === lawyerId);
      const activeCases = lawyerCases.filter((c: any) => c.status === 'active').length;

      // Filter hearings for this lawyer's cases
      const lawyerHearings = hearings.filter((h: any) =>
        lawyerCases.some((c: any) => c.id === h.caseId) && new Date(h.date) > new Date());

      setStats({
        totalCases: lawyerCases.length,
        activeCases,
        pendingHearings: lawyerHearings.length,
        totalUsers: 0, // Not relevant for lawyers
        documentsProcessed: 89, // Lawyer-specific document count
        aiQueriesHandled: 23, // Lawyer's AI usage
        parliamentUpdates: parliamentUpdates?.length || 0,
        systemHealth: 95
      });

      // Lawyer-specific alerts
      setAlerts([
        {
          id: '1',
          type: 'info',
          message: 'New parliament bill affects criminal procedure laws',
          timestamp: '2 hours ago'
        },
        {
          id: '2',
          type: 'warning',
          message: 'Deadline approaching for Case #2024-001 filing',
          timestamp: '30 minutes ago'
        }
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadDashboardData();
  };

  const handleAIAssistantOpen = (query: string) => {
    setAIQuery(query);
    setIsAIAssistantOpen(true);
  };

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <LawyerHeader onRefresh={refreshData} />

      {/* System Alerts */}
      <SystemAlerts alerts={alerts} />

      {/* Lawyer Overview Cards */}
      <LawyerOverviewCards stats={stats} />

      {/* Lawyer Analytics Cards */}
      <LawyerAnalyticsCards
        stats={stats}
        onAIAssistantOpen={handleAIAssistantOpen}
      />

      {/* Lawyer Management Tabs */}
      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="cases" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            <span className="hidden sm:inline">My Cases</span>
            <span className="sm:hidden">Cases</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            <span className="hidden sm:inline">Documents</span>
            <span className="sm:hidden">Docs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-4">
          <LawyerCasesTab router={router} lawyerId={lawyerId} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <LawyerDocumentsTab router={router} />
        </TabsContent>

      </Tabs>

      {/* AI Assistant Modal */}
      <AIAssistant
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        initialQuery={aiQuery}
      />
    </div>
  );
}