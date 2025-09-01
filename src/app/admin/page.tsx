'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  FileText,
  Users,
  Gavel,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Bot,
  Globe,
  Shield,
  BarChart3,
  Workflow,
  Bell,
  RefreshCw
} from 'lucide-react';
import { getAll } from '@/lib/utils/firebase/general';

// Import our new components
import AIAssistant from '@/components/AIAssistant'; // This would be the AI assistant component
import { useParliamentUpdates } from '@/lib/parliamentIntegration';

import LoadingComponent from '@/components/exports/LoadingComponent';
import IntegrationsTab from '@/components/exports/IntegrationsTab';
import DashboardStats from '@/models/dashboard_stats';
import AdminHeader from '@/components/exports/AdminHeader';
import SystemAlerts from '@/components/exports/SystemAlerts';
import SystemAlert from '@/models/system_alert';
import OverviewCards from '@/components/exports/OverviewCards';
import AnalyticsCards from '@/components/exports/analytics_cards';
import OperationsTab from '@/components/exports/OperationsTab';


// Security Tab Content Component
const SecurityTab = () => {
  const securityCards = [
    {
      icon: Shield,
      title: "Access Control",
      description: "Role-based permissions and security policies"
    },
    {
      icon: Database,
      title: "Audit Logs",
      description: "System activity tracking and compliance reporting"
    },
    {
      icon: CheckCircle,
      title: "Compliance",
      description: "Data protection and regulatory compliance"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
      {securityCards.map((card, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-zambia-orange text-sm sm:text-base">
              <card.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>{card.title}</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {card.description}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

// Analytics Tab Content Component
const AnalyticsTab = () => {
  const analyticsCards = [
    {
      icon: BarChart3,
      title: "Performance Metrics",
      description: "Judge efficiency and case processing analytics"
    },
    {
      icon: Clock,
      title: "Trend Analysis",
      description: "Historical data analysis and forecasting"
    },
    {
      icon: FileText,
      title: "Custom Reports",
      description: "Generate custom reports and data exports"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
      {analyticsCards.map((card, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-zambia-orange text-sm sm:text-base">
              <card.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>{card.title}</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {card.description}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};



// Main Component
export default function EnhancedAdminPage() {
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

  // Use parliament updates hook
  const { updates: parliamentUpdates, loading: parliamentLoading } = useParliamentUpdates();

  useEffect(() => {
    const checkAuth = () => {
      const userRole = localStorage.getItem('userRole');
      if (userRole !== 'admin') {
        router.push('/login');
      }
    };
    checkAuth();
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load real-time data from Firebase
      const [cases, users, hearings] = await Promise.all([
        getAll('cases').catch(() => []),
        getAll('users').catch(() => []),
        getAll('hearings').catch(() => [])
      ]);

      const activeCases = cases.filter((c: any) => c.status === 'active').length;
      const pendingHearings = hearings.filter((h: any) =>
        new Date(h.date) > new Date()).length;

      setStats({
        totalCases: cases.length,
        activeCases,
        pendingHearings,
        totalUsers: users.length,
        documentsProcessed: 342, // This would come from documents collection
        aiQueriesHandled: 89, // This would come from AI logs
        parliamentUpdates: parliamentUpdates?.length || 0, // Real parliament data
        systemHealth: 95
      });

      // Mock alerts - replace with real alert system
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
          message: 'High case load detected for Judge Smith',
          timestamp: '4 hours ago'
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
      <AdminHeader onRefresh={refreshData} />

      {/* System Alerts */}
      <SystemAlerts alerts={alerts} />

      {/* System Overview Cards */}
      <OverviewCards stats={stats} />

      {/* Advanced Analytics Cards */}
      <AnalyticsCards
        stats={stats}
        onAIAssistantOpen={handleAIAssistantOpen}
      />

      {/* Management Tabs */}
      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="operations" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            <span className="hidden sm:inline">Operations</span>
            <span className="sm:hidden">Ops</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            <span className="hidden sm:inline">Security</span>
            <span className="sm:hidden">Sec</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Data</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            <span className="hidden sm:inline">Integrations</span>
            <span className="sm:hidden">Int</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <OperationsTab router={router} />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsTab />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <IntegrationsTab
            stats={stats}
            onAIAssistantOpen={handleAIAssistantOpen}
          />
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