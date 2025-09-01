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
import AIAssistant from '@/components/AIAssistant';// This would be the AI assistant component
import { useParliamentUpdates } from '@/lib/parliamentIntegration';

import LoadingComponent from '@/components/exports/LoadingComponent';
import IntegrationsTab from '@/components/exports/IntegrationsTab';

import DashboardStats from '@/models/dashboard_stats';

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

// Header Component
const AdminHeader = ({ onRefresh }: { onRefresh: () => void }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zambia-black">
          Judiciary Management System
        </h1>
        <p className="text-sm sm:text-base text-zambia-black/70 mt-1">
          Comprehensive administrative control panel
        </p>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <Badge variant="outline" className="bg-green-700 text-white text-xs sm:text-sm">
          <span className="hidden sm:inline">System </span>Administrator
        </Badge>
      </div>
    </div>
  );
};

// System Alerts Component
const SystemAlerts = ({ alerts }: { alerts: SystemAlert[] }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Alert key={alert.id} className={
          alert.type === 'error' ? 'border-red-500' :
            alert.type === 'warning' ? 'border-yellow-500' :
              'border-blue-500'
        }>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <span className="text-sm">{alert.message}</span>
            <span className="text-xs text-muted-foreground">
              {alert.timestamp}
            </span>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

// Overview Cards Component
const OverviewCards = ({ stats }: { stats: DashboardStats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-zambia-green">
            Total Cases
          </CardTitle>
          <Gavel className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{stats.totalCases}</div>
          <p className="text-xs text-muted-foreground">
            {stats.activeCases} active cases
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-zambia-green">
            System Users
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            Across all roles
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-zambia-green">
            Pending Hearings
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{stats.pendingHearings}</div>
          <p className="text-xs text-muted-foreground">
            This week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-zambia-green">
            System Health
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{stats.systemHealth}%</div>
          <Progress value={stats.systemHealth} className="mt-2" />
        </CardContent>
      </Card>
    </div>
  );
};

// Analytics Cards Component
const AnalyticsCards = ({
  stats,
  onAIAssistantOpen
}: {
  stats: DashboardStats;
  onAIAssistantOpen: (query: string) => void;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-zambia-orange text-sm sm:text-base">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>AI Assistant</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">AI-powered legal assistance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold mb-2">{stats.aiQueriesHandled}</div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">Queries handled today</p>
          <Button
            className="w-full bg-zambia-green hover:bg-zambia-green/90 text-xs sm:text-sm"
            onClick={() => onAIAssistantOpen('')}
          >
            <Bot className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            <span className="hidden sm:inline">Summon </span>AI Assistant
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-zambia-orange text-sm sm:text-base">
            <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Parliament Integration</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Real-time legislative updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold mb-2">{stats.parliamentUpdates}</div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">New updates today</p>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm text-green-600">Connected</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-zambia-orange text-sm sm:text-base">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Document Processing</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Digital document management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold mb-2">{stats.documentsProcessed}</div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">Documents processed</p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span>E-filing Queue</span>
              <span>12 pending</span>
            </div>
            <Progress value={75} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Operations Tab Content Component
const OperationsTab = ({ router }: { router: any }) => {
  const operationCards = [
    {
      icon: Gavel,
      title: "Case Management",
      description: "Create, assign, and manage cases with automated workflows",
      route: "/admin/cases"
    },
    {
      icon: Calendar,
      title: "Court Scheduling",
      description: "Manage hearings, judges, and courtroom allocations",
      route: "/admin/calendar"
    },
    {
      icon: FileText,
      title: "Document Control",
      description: "E-filing, digital signatures, and document workflows",
      route: "/admin/documents"
    },
    {
      icon: Users,
      title: "User Management",
      description: "Manage users, roles, and access permissions",
      route: "/admin/users"
    },
    {
      icon: Workflow,
      title: "Workflow Automation",
      description: "Configure automated processes and notifications",
      route: "/admin/workflows"
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Manage system alerts and user notifications",
      route: "/admin/notifications"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
      {operationCards.map((card, index) => (
        <Card
          key={index}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push(card.route)}
        >
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