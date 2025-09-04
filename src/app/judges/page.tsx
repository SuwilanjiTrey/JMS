'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AIAssistant from '@/components/AIAssistant';
import { useParliamentUpdates } from '@/lib/parliamentIntegration';
import LoadingComponent from '@/components/exports/LoadingComponent';
import { DashboardStats } from '@/models/dashboard_stats';
import SystemAlert from '@/models/system_alert';
import SystemAlerts from '@/components/exports/SystemAlerts';
import { useAuth } from '@/contexts/AuthContext'; // ← We'll use this!

// Judge-specific components
import JudgeHeader from '@/components/exports/JudgeHeader';
import JudgeOverviewCards from '@/components/exports/JudgeOverviewCards';
import JudgeAnalyticsCards from '@/components/exports/JudgeAnalyticsCards';
import { JudgeCasesTab } from '@/components/exports/JudgeCasesTab';
import JudgeCalendarTab from '@/components/exports/JudgeCalendarTab';
import JudgeDocumentsTab from '@/components/exports/JudgeDocumentsTab';

import { getAll } from '@/lib/utils/firebase/general'; // Adjust path if needed

export default function JudgeDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, userRole } = useAuth(); // ← Get real user from context
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

  const { updates: parliamentUpdates, loading: parliamentLoading } = useParliamentUpdates();

  // === STEP 1: Check Auth & Set Judge ID ===
  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish loading

    if (!user || userRole !== 'judge') {
      console.log('Redirecting: not logged in or not a judge');
      router.push('/login');
      return;
    }

    // ✅ Set judgeId from actual Firebase user
    setJudgeId(user.id);
  }, [user, userRole, authLoading, router]);

  // === STEP 2: Load Dashboard Data Once JudgeId Is Set ===
  useEffect(() => {
    if (!judgeId) {
      console.log('Waiting for judgeId...');
      return;
    }

    loadDashboardData();
  }, [judgeId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [cases, hearings, documents] = await Promise.all([
        getAll('cases').catch(() => []),
        getAll('hearings').catch(() => []),
        getAll('documents').catch(() => [])
      ]);

      // 🔍 Filter data for this judge
      const judgeCases = cases.filter((c: any) => c.assignedJudge === judgeId || c.judgeId === judgeId);
      const activeCases = judgeCases.filter((c: any) => c.status === 'active').length;

      const now = new Date();
      const judgeHearings = hearings.filter((h: any) =>
        h.judgeId === judgeId && new Date(h.date || h.startTime) > now
      );

      const judgeCaseIds = judgeCases.map((c: any) => c.id);
      const judgeDocuments = documents.filter((d: any) =>
        judgeCaseIds.includes(d.caseId)
      );

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const documentsProcessed = judgeDocuments.filter((d: any) => {
        const uploadDate = d.uploadedAt?.toDate ? d.uploadedAt.toDate() : new Date(d.uploadedAt);
        return uploadDate.getMonth() === currentMonth && uploadDate.getFullYear() === currentYear;
      }).length;

      const aiQueriesHandled = Math.floor(Math.random() * 20) + 10;

      setStats({
        totalCases: judgeCases.length,
        activeCases,
        pendingHearings: judgeHearings.length,
        totalUsers: 0,
        documentsProcessed,
        aiQueriesHandled,
        parliamentUpdates: parliamentUpdates?.length || 0,
        systemHealth: 95
      });

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
        },
        {
          id: '3',
          type: 'warning',
          message: `You have ${activeCases} active cases requiring attention`,
          timestamp: '30 minutes ago'
        }
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setStats(prev => ({
        ...prev,
        parliamentUpdates: parliamentUpdates?.length || 0
      }));
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

  // Show loading while auth or data loads
  if (authLoading || loading) {
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
          <JudgeCasesTab judgeId={judgeId} />
        </TabsContent>
        
        <TabsContent value="calendar" className="space-y-4">
          <JudgeCalendarTab judgeId={judgeId} />
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4">
          <JudgeDocumentsTab judgeId={judgeId} /> {/* Pass judgeId here too if needed */}
        </TabsContent>
      </Tabs>
      
      {/* AI Assistant Modal */}
      <AIAssistant 
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        initialQuery={aiQuery}
        userId={judgeId}
        userRole="judge"
      />
    </div>
  );
}
