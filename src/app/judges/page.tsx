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

// Judge-specific components
import JudgeHeader from '@/components/exports/JudgeHeader';
import JudgeOverviewCards from '@/components/exports/JudgeOverviewCards';
import JudgeAnalyticsCards from '@/components/exports/JudgeAnalyticsCards';
import JudgeCasesTab from '@/components/exports/JudgeCasesTab';
import JudgeCalendarTab from '@/components/exports/JudgeCalendarTab';
import JudgeDocumentsTab from '@/components/exports/JudgeDocumentsTab';

export default function JudgeDashboard() {
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
  const [judgeId, setJudgeId] = useState<string>('');

  // Use parliament updates hook
  const { updates: parliamentUpdates, loading: parliamentLoading } = useParliamentUpdates();

  useEffect(() => {
    const checkAuth = () => {
      const userRole = localStorage.getItem('userRole');
      const userId = localStorage.getItem('userId');
      if (userRole !== 'judge') {
        router.push('/login');
      }
      setJudgeId(userId || '');
    };
    checkAuth();
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load judge-specific data from Firebase
      const [cases, hearings] = await Promise.all([
        getAll('cases').catch(() => []),
        getAll('hearings').catch(() => [])
      ]);

      // Filter cases assigned to this judge
      const judgeCases = cases.filter((c: any) => c.assignedJudge === judgeId);
      const activeCases = judgeCases.filter((c: any) => c.status === 'active').length;
      
      // Filter hearings for this judge
      const judgeHearings = hearings.filter((h: any) => 
        h.judgeId === judgeId && new Date(h.date) > new Date());

      setStats({
        totalCases: judgeCases.length,
        activeCases,
        pendingHearings: judgeHearings.length,
        totalUsers: 0, // Not relevant for judges
        documentsProcessed: 156, // Judge-specific document count
        aiQueriesHandled: 34, // Judge's AI usage
        parliamentUpdates: parliamentUpdates?.length || 0,
        systemHealth: 95
      });

      // Judge-specific alerts
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
          message: 'Your hearing schedule is 90% full this week',
          timestamp: '1 hour ago'
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
      <JudgeHeader onRefresh={refreshData} />

      {/* System Alerts */}
      <SystemAlerts alerts={alerts} />

      {/* Judge Overview Cards */}
      <JudgeOverviewCards stats={stats} />

      {/* Judge Analytics Cards */}
      <JudgeAnalyticsCards 
        stats={stats} 
        onAIAssistantOpen={handleAIAssistantOpen}
      />

      {/* Judge Management Tabs */}
      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="cases" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            <span className="hidden sm:inline">My Cases</span>
            <span className="sm:hidden">Cases</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            <span className="hidden sm:inline">Calendar</span>
            <span className="sm:hidden">Cal</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            <span className="hidden sm:inline">Documents</span>
            <span className="sm:hidden">Docs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-4">
          <JudgeCasesTab router={router} judgeId={judgeId} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <JudgeCalendarTab router={router} judgeId={judgeId} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <JudgeDocumentsTab router={router} />
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