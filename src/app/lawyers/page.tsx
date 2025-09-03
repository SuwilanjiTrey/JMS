'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAll } from '@/lib/utils/firebase/general';
import { getCurrentUser } from '@/lib/auth';
import { getLawFirmById, getLawyersByFirmId } from '@/lib/utils/firebase/lawfirm';

// Import existing components
import AIAssistant from '@/components/AIAssistant';
import { useParliamentUpdates } from '@/lib/parliamentIntegration';
import LoadingComponent from '@/components/exports/LoadingComponent';
import DashboardStats from '@/models/dashboard_stats';
import SystemAlert from '@/models/system_alert';
import SystemAlerts from '@/components/exports/SystemAlerts';
import LawyerCasesTab from '@/components/exports/LawyerCasesTab';
import LawyerDocumentsTab from '@/components/exports/LawyerDocumentsTab';

import { Building2, Users, Scale, FileText, RefreshCw, ExternalLink } from 'lucide-react';

interface LawyerDashboardState extends DashboardStats {
  // Firm-specific stats
  firmTotalCases: number;
  firmActiveCases: number;
  firmTotalLawyers: number;
  firmColleagues: any[];
}

export default function EnhancedLawyerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<LawyerDashboardState>({
    totalCases: 0,
    activeCases: 0,
    pendingHearings: 0,
    totalUsers: 0,
    documentsProcessed: 0,
    aiQueriesHandled: 0,
    parliamentUpdates: 0,
    systemHealth: 95,
    // Firm stats
    firmTotalCases: 0,
    firmActiveCases: 0,
    firmTotalLawyers: 0,
    firmColleagues: []
  });
  
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [aiQuery, setAIQuery] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lawFirm, setLawFirm] = useState<any>(null);

  // Use parliament updates hook
  const { updates: parliamentUpdates, loading: parliamentLoading } = useParliamentUpdates();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'lawyer') {
          router.push('/login');
          return;
        }
        setCurrentUser(user);
        await loadDashboardData(user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  const loadDashboardData = async (user: any) => {
    try {
      setLoading(true);

      // Load lawyer's law firm info
      let firmData = null;
      let colleagues: any[] = [];
      
      if (user.profile?.lawFirmId) {
        firmData = await getLawFirmById(user.profile.lawFirmId);
        if (firmData) {
          setLawFirm(firmData);
          colleagues = await getLawyersByFirmId(user.profile.lawFirmId);
          colleagues = colleagues.filter(c => c.id !== user.id); // Exclude current user
        }
      }

      // Load individual lawyer data from Firebase
      const [cases, hearings] = await Promise.all([
        getAll('cases').catch(() => []),
        getAll('hearings').catch(() => [])
      ]);

      // Filter cases where this lawyer is involved
      const lawyerCases = cases.filter((c: any) =>
        c.plaintiff?.lawyerId === user.id || c.defendant?.lawyerId === user.id);
      const activeCases = lawyerCases.filter((c: any) => c.status === 'active').length;

      // Filter hearings for this lawyer's cases
      const lawyerHearings = hearings.filter((h: any) =>
        lawyerCases.some((c: any) => c.id === h.caseId) && new Date(h.date) > new Date());

      // Calculate firm-wide stats if law firm exists
      let firmStats = {
        firmTotalCases: 0,
        firmActiveCases: 0,
        firmTotalLawyers: 0,
        firmColleagues: colleagues
      };

      if (firmData) {
        const firmLawyerIds = [...colleagues.map(c => c.id), user.id];
        const firmCases = cases.filter((c: any) =>
          firmLawyerIds.includes(c.plaintiff?.lawyerId) || 
          firmLawyerIds.includes(c.defendant?.lawyerId)
        );
        
        firmStats = {
          firmTotalCases: firmCases.length,
          firmActiveCases: firmCases.filter((c: any) => c.status === 'active').length,
          firmTotalLawyers: firmLawyerIds.length,
          firmColleagues: colleagues
        };
      }

      setStats({
        totalCases: lawyerCases.length,
        activeCases,
        pendingHearings: lawyerHearings.length,
        totalUsers: 0, // Not relevant for lawyers
        documentsProcessed: 89, // Lawyer-specific document count
        aiQueriesHandled: 23, // Lawyer's AI usage
        parliamentUpdates: parliamentUpdates?.length || 0,
        systemHealth: 95,
        ...firmStats
      });

      // Enhanced alerts with firm context
      const lawyerAlerts: SystemAlert[] = [
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
      ];

      if (firmData && colleagues.length > 0) {
        lawyerAlerts.push({
          id: '3',
          type: 'info',
          message: `${colleagues.length} colleagues from ${firmData.name} are online`,
          timestamp: '1 hour ago'
        });
      }

      setAlerts(lawyerAlerts);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    if (currentUser) {
      loadDashboardData(currentUser);
    }
  };

  const handleAIAssistantOpen = (query: string) => {
    setAIQuery(query);
    setIsAIAssistantOpen(true);
  };

  const navigateToFirmDashboard = () => {
    router.push('/lawfirm');
  };

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Enhanced Header with Firm Context */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zambia-black">
            Lawyer Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-zambia-black/70">
              Welcome, {currentUser?.displayName}
            </p>
            {lawFirm && (
              <>
                <span className="text-zambia-black/50">•</span>
                <Button
                  variant="link"
                  className="p-0 h-auto text-zambia-green hover:text-zambia-green/80"
                  onClick={navigateToFirmDashboard}
                >
                  <Building2 className="h-4 w-4 mr-1" />
                  {lawFirm.name}
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Lawyer
          </Badge>
          {lawFirm && lawFirm.administrators?.includes(currentUser?.id) && (
            <Badge variant="outline" className="bg-zambia-green text-white">
              Firm Admin
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Alerts */}
      <SystemAlerts alerts={alerts} />

      {/* Lawyer Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Cases</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zambia-green">
              {stats.totalCases}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCases} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Hearings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingHearings}
            </div>
            <p className="text-xs text-muted-foreground">
              Scheduled hearings
            </p>
          </CardContent>
        </Card>

        {/* Firm Context Cards */}
        {lawFirm && (
          <>
            <Card className="border-zambia-green/20 bg-zambia-green/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Firm Cases</CardTitle>
                <Building2 className="h-4 w-4 text-zambia-green" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zambia-green">
                  {stats.firmTotalCases}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.firmActiveCases} active firm-wide
                </p>
              </CardContent>
            </Card>

            <Card className="border-zambia-green/20 bg-zambia-green/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Colleagues</CardTitle>
                <Users className="h-4 w-4 text-zambia-green" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zambia-green">
                  {stats.firmColleagues.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  At {lawFirm.name}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Fill remaining slots if no firm */}
        {!lawFirm && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zambia-green">
                  {stats.documentsProcessed}
                </div>
                <p className="text-xs text-muted-foreground">
                  Processed this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Queries</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zambia-green">
                  {stats.aiQueriesHandled}
                </div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Law Firm Context Section */}
      {lawFirm && stats.firmColleagues.length > 0 && (
        <Card className="border-zambia-green/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-zambia-green" />
              {lawFirm.name} - Colleagues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.firmColleagues.slice(0, 6).map((colleague) => (
                <div 
                  key={colleague.id} 
                  className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                >
                  <div className="h-8 w-8 rounded-full bg-zambia-green/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-zambia-green">
                      {colleague.displayName?.split(' ').map((n: string) => n[0]).join('') || 'UN'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {colleague.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {colleague.profile?.specializations?.[0] || 'General Practice'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {stats.firmColleagues.length > 6 && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={navigateToFirmDashboard}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View All Colleagues ({stats.firmColleagues.length})
                </Button>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={navigateToFirmDashboard}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Go to {lawFirm.name} Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Firm Association Alert */}
      {!lawFirm && (
        <Alert>
          <Building2 className="h-4 w-4" />
          <AlertDescription>
            You're not currently associated with a law firm. Contact your administrator to join a firm and unlock collaborative features.
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Case Success Rate</span>
                <span className="font-medium">87%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg. Case Duration</span>
                <span className="font-medium">4.2 months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Documents Processed</span>
                <span className="font-medium">{stats.documentsProcessed}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {lawFirm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Firm Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">My Cases vs Firm Avg</span>
                  <span className="font-medium">
                    {stats.totalCases} vs {Math.round(stats.firmTotalCases / stats.firmTotalLawyers)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active Case Ratio</span>
                  <span className="font-medium">
                    {Math.round((stats.activeCases / stats.totalCases) * 100) || 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Firm Contribution</span>
                  <span className="font-medium">
                    {Math.round((stats.totalCases / stats.firmTotalCases) * 100) || 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Queries This Month</span>
                <span className="font-medium">{stats.aiQueriesHandled}</span>
              </div>
              <Button 
                className="w-full" 
                onClick={() => handleAIAssistantOpen('Help me with case research')}
              >
                Open AI Assistant
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
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
          <LawyerCasesTab router={router} lawyerId={currentUser?.id || ''} />
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
