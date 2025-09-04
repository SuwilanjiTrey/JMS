'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { getCurrentUser } from '@/lib/auth';
import { getLawFirmStats } from '@/lib/utils/firebase/lawfirm';
import { RefreshCw, Users, Scale, FileText, TrendingUp, AlertCircle } from 'lucide-react';

interface LawFirmDashboardState {
  firm: any;
  totalLawyers: number;
  totalCases: number;
  activeCases: number;
  pendingCases: number;
  closedCases: number;
  lawyers: any[];
  cases: any[];
}

export default function EnhancedLawFirmDashboard() {
  const router = useRouter();
  const [firmData, setFirmData] = useState<LawFirmDashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const user = await getCurrentUser();
        console.log('Current user:', user); // Debug log
        
        /*if (!user) {
          console.log('No user found, redirecting to login');
          router.push('/login');
          return;
        }*/
        
        if (!['lawyer', 'law-firm-admin'].includes(user.role)) {
		  setError(`Access denied. Current role: ${user.role}`);
		  setLoading(false);
		  return;
		}

        setCurrentUser(user);
        console.log('User profile:', user.profile); // Debug log

        // Check for law firm association
        let lawFirmId = user.profile?.lawFirmId;
        
        // If no lawFirmId, try to derive from lawFirmName for demo users
        if (!lawFirmId && user.profile?.lawFirmName) {
          lawFirmId = user.profile.lawFirmName.toLowerCase().replace(/\s+/g, '-');
          console.log('Derived lawFirmId from name:', lawFirmId);
        }
        
        if (!lawFirmId) {
          console.log('No law firm association found');
          setError('No law firm association found for this user. Please contact administrator.');
          setLoading(false);
          return;
        }

        await loadFirmData(lawFirmId);
      } catch (err) {
        console.error('Error initializing dashboard:', err);
        setError('Failed to load law firm data: ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [router]);

  const loadFirmData = async (lawFirmId: string) => {
    try {
      console.log('Loading firm data for ID:', lawFirmId);
      const stats = await getLawFirmStats(lawFirmId);
      console.log('Loaded firm stats:', stats);
      setFirmData(stats);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error loading firm data:', err);
      setError('Failed to load law firm statistics: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleRefresh = () => {
    if (currentUser?.profile?.lawFirmId) {
      setLoading(true);
      setError(null);
      loadFirmData(currentUser.profile.lawFirmId).finally(() => setLoading(false));
    } else if (currentUser?.profile?.lawFirmName) {
      const derivedId = currentUser.profile.lawFirmName.toLowerCase().replace(/\s+/g, '-');
      setLoading(true);
      setError(null);
      loadFirmData(derivedId).finally(() => setLoading(false));
    }
  };

  const isUserFirmAdmin = () => {
    return currentUser?.role === 'law-firm-admin' || 
           firmData?.firm?.administrators?.includes(currentUser?.id);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading law firm dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
        {/* Debug info */}
        {currentUser && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify({ 
                  userRole: currentUser.role,
                  userProfile: currentUser.profile,
                  lawFirmId: currentUser.profile?.lawFirmId,
                  lawFirmName: currentUser.profile?.lawFirmName
                }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (!firmData) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No law firm data available. This might be because:
            <ul className="list-disc list-inside mt-2">
              <li>The law firm doesn't exist in the database</li>
              <li>There are no lawyers associated with this firm</li>
              <li>Database connection issues</li>
            </ul>
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zambia-black">
            {firmData.firm.name}
          </h1>
          <p className="text-zambia-black/70">
            Law Firm Dashboard • {firmData.totalLawyers} Lawyers
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isUserFirmAdmin() && (
            <Badge variant="outline" className="bg-zambia-green text-white">
              Firm Administrator
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lawyers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zambia-green">
              {firmData.totalLawyers}
            </div>
            <p className="text-xs text-muted-foreground">
              Including {firmData.firm.administrators?.length || 0} admin(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zambia-green">
              {firmData.totalCases}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all lawyers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {firmData.activeCases}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {firmData.pendingCases}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting action
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="lawyers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="lawyers" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            <span className="hidden sm:inline">Firm Lawyers</span>
            <span className="sm:hidden">Lawyers</span>
          </TabsTrigger>
          <TabsTrigger value="cases" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            <span className="hidden sm:inline">Firm Cases</span>
            <span className="sm:hidden">Cases</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lawyers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Law Firm Lawyers</CardTitle>
              <CardDescription>
                All lawyers associated with {firmData.firm.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {firmData.lawyers.map((lawyer) => (
                  <div 
                    key={lawyer.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={lawyer.photoURL} />
                        <AvatarFallback>
                          {lawyer.displayName?.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{lawyer.displayName}</h3>
                        <p className="text-sm text-muted-foreground">{lawyer.email}</p>
                        {lawyer.profile?.barNumber && (
                          <p className="text-xs text-muted-foreground">
                            Bar #: {lawyer.profile.barNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {firmData.firm.administrators?.includes(lawyer.id) && (
                        <Badge variant="secondary">Admin</Badge>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/lawyers/profile/${lawyer.id}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                ))}
                {firmData.lawyers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No lawyers found for this law firm.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Firm Cases Overview</CardTitle>
              <CardDescription>
                Cases involving lawyers from {firmData.firm.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {firmData.cases.slice(0, 10).map((case_) => (
                  <div 
                    key={case_.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium">
                        {case_.title || `Case #${case_.caseNumber}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {case_.plaintiff?.name} vs {case_.defendant?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Filed: {new Date(case_.filingDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          case_.status === 'active' ? 'default' : 
                          case_.status === 'pending' ? 'secondary' : 'outline'
                        }
                      >
                        {case_.status}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/admin/cases/${case_.id}`)}
                      >
                        View Case
                      </Button>
                    </div>
                  </div>
                ))}
                
                {firmData.cases.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No cases found for this law firm.
                  </div>
                )}
                
                {firmData.cases.length > 10 && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/admin/cases')}
                    >
                      View All Cases ({firmData.cases.length})
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Case Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Active</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ 
                            width: `${firmData.totalCases > 0 ? (firmData.activeCases / firmData.totalCases) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{firmData.activeCases}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pending</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ 
                            width: `${firmData.totalCases > 0 ? (firmData.pendingCases / firmData.totalCases) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{firmData.pendingCases}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Closed</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-500 h-2 rounded-full" 
                          style={{ 
                            width: `${firmData.totalCases > 0 ? (firmData.closedCases / firmData.totalCases) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{firmData.closedCases}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Firm Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Cases per Lawyer</span>
                    <span className="font-medium">
                      {firmData.totalLawyers > 0 ? 
                        Math.round(firmData.totalCases / firmData.totalLawyers * 100) / 100 : 0
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Case Ratio</span>
                    <span className="font-medium">
                      {firmData.totalCases > 0 ? 
                        Math.round((firmData.activeCases / firmData.totalCases) * 100) : 0
                      }%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Lawyers</span>
                    <span className="font-medium">{firmData.totalLawyers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
