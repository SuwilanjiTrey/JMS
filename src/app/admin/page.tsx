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
  Settings,
  Workflow,
  Bell,
  RefreshCw
} from 'lucide-react';
import { getAll, getAllWhereEquals, getLimitedMany } from '@/lib/utils/firebase/general';

// Import our new components
import AIAssistant from '@/components/AIAssistant';// This would be the AI assistant component
import { ParliamentDashboard, useParliamentUpdates } from '@/lib/parliamentIntegration';

interface DashboardStats {
  totalCases: number;
  activeCases: number;
  pendingHearings: number;
  totalUsers: number;
  documentsProcessed: number;
  aiQueriesHandled: number;
  parliamentUpdates: number;
  systemHealth: number;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

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

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zambia-black">
            Judiciary Management System
          </h1>
          <p className="text-zambia-black/70">
            Comprehensive administrative control panel
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Badge variant="outline" className="bg-green-700 text-white">
            System Administrator
          </Badge>
        </div>
      </div>

      {/* System Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Alert key={alert.id} className={
              alert.type === 'error' ? 'border-red-500' :
              alert.type === 'warning' ? 'border-yellow-500' :
              'border-blue-500'
            }>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span>{alert.message}</span>
                <span className="text-sm text-muted-foreground">
                  {alert.timestamp}
                </span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zambia-green">
              Total Cases
            </CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCases}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCases} active cases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zambia-green">
              System Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Across all roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zambia-green">
              Pending Hearings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingHearings}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zambia-green">
              System Health
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemHealth}%</div>
            <Progress value={stats.systemHealth} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-zambia-orange">
              <Bot className="h-5 w-5" />
              <span>AI Assistant</span>
            </CardTitle>
            <CardDescription>AI-powered legal assistance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{stats.aiQueriesHandled}</div>
            <p className="text-sm text-muted-foreground mb-4">Queries handled today</p>
            <Button 
              className="w-full bg-zambia-green hover:bg-zambia-green/90"
              onClick={() => {
                setIsAIAssistantOpen(true);
                setAIQuery(''); // Clear any previous query
              }}
            >
              <Bot className="h-4 w-4 mr-2" />
              Summon AI Assistant
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-zambia-orange">
              <Globe className="h-5 w-5" />
              <span>Parliament Integration</span>
            </CardTitle>
            <CardDescription>Real-time legislative updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{stats.parliamentUpdates}</div>
            <p className="text-sm text-muted-foreground mb-4">New updates today</p>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600">Connected</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-zambia-orange">
              <FileText className="h-5 w-5" />
              <span>Document Processing</span>
            </CardTitle>
            <CardDescription>Digital document management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{stats.documentsProcessed}</div>
            <p className="text-sm text-muted-foreground mb-4">Documents processed</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>E-filing Queue</span>
                <span>12 pending</span>
              </div>
              <Progress value={75} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/admin/cases')}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zambia-orange">
                  <Gavel className="h-5 w-5" />
                  <span>Case Management</span>
                </CardTitle>
                <CardDescription>
                  Create, assign, and manage cases with automated workflows
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/admin/calendar')}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zambia-orange">
                  <Calendar className="h-5 w-5" />
                  <span>Court Scheduling</span>
                </CardTitle>
                <CardDescription>
                  Manage hearings, judges, and courtroom allocations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/admin/documents')}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zambia-orange">
                  <FileText className="h-5 w-5" />
                  <span>Document Control</span>
                </CardTitle>
                <CardDescription>
                  E-filing, digital signatures, and document workflows
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/admin/users')}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zambia-orange">
                  <Users className="h-5 w-5" />
                  <span>User Management</span>
                </CardTitle>
                <CardDescription>
                  Manage users, roles, and access permissions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/admin/workflows')}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zambia-orange">
                  <Workflow className="h-5 w-5" />
                  <span>Workflow Automation</span>
                </CardTitle>
                <CardDescription>
                  Configure automated processes and notifications
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/admin/notifications')}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zambia-orange">
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                </CardTitle>
                <CardDescription>
                  Manage system alerts and user notifications
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zambia-orange">
                  <Shield className="h-5 w-5" />
                  <span>Access Control</span>
                </CardTitle>
                <CardDescription>
                  Role-based permissions and security policies
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zambia-orange">
                  <Database className="h-5 w-5" />
                  <span>Audit Logs</span>
                </CardTitle>
                <CardDescription>
                  System activity tracking and compliance reporting
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zambia-orange">
                  <CheckCircle className="h-5 w-5" />
                  <span>Compliance</span>
                </CardTitle>
                <CardDescription>
                  Data protection and regulatory compliance
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zambia-orange">
                  <BarChart3 className="h-5 w-5" />
                  <span>Performance Metrics</span>
                </CardTitle>
                <CardDescription>
                  Judge efficiency and case processing analytics
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zambia-orange">
                  <Clock className="h-5 w-5" />
                  <span>Trend Analysis</span>
                </CardTitle>
                <CardDescription>
                  Historical data analysis and forecasting
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zambia-orange">
                  <FileText className="h-5 w-5" />
                  <span>Custom Reports</span>
                </CardTitle>
                <CardDescription>
                  Generate custom reports and data exports
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            {/* Parliament Integration Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zambia-orange">
                  <Globe className="h-5 w-5" />
                  <span>Parliament Integration</span>
                </CardTitle>
                <CardDescription>
                  Real-time legislative updates and impact analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ParliamentDashboard />
              </CardContent>
            </Card>

            {/* Other Integrations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-zambia-orange">
                    <Bot className="h-5 w-5" />
                    <span>AI Services</span>
                  </CardTitle>
                  <CardDescription>
                    Document analysis and legal research AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Service Status:</span>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600">Operational</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Queries Today:</span>
                      <span className="text-sm font-medium">{stats.aiQueriesHandled}</span>
                    </div>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        setAIQuery('Show me system performance metrics and insights');
                        setIsAIAssistantOpen(true);
                      }}
                    >
                      Launch AI Assistant
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-zambia-orange">
                    <Settings className="h-5 w-5" />
                    <span>Government e-Services</span>
                  </CardTitle>
                  <CardDescription>
                    Integration with national identity and civil services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Connection:</span>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-yellow-600">Pending Setup</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Integration with NRC, PACRA, and other government services
                    </div>
                    <Button className="w-full" variant="outline">
                      Configure Integration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
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