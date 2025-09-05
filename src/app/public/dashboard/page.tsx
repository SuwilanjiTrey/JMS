// app/public/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gavel, 
  Search, 
  FileText, 
  Calendar, 
  Upload, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { getPublicCases } from '@/lib/utils/public';
import DashboardStats from '@/models/dashboard_stats';

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
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load public cases
      const { cases } = await getPublicCases();
      const activeCases = cases.filter((c: any) => c.status === 'active').length;
      
      setStats({
        totalCases: cases.length,
        activeCases,
        pendingHearings: 0, // Not shown to public
        totalUsers: 0, // Not relevant for public
        documentsProcessed: 0, // Not relevant for public
        aiQueriesHandled: 0, // Not relevant for public
        parliamentUpdates: 0, // Not relevant for public
        systemHealth: 95
      });
      
      // Get recent cases (last 5)
      setRecentCases(cases.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadDashboardData();
  };

  const formatDate = (date: any) => {
    return date.toLocaleDateString('en-ZM', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Public Dashboard</h1>
          <p className="text-gray-600">Judicial Management System - Republic of Zambia</p>
        </div>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Cases</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCases}</div>
            <p className="text-xs text-muted-foreground">
              Available for public view
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCases}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/public/search/cases')}>
          <CardHeader className="text-center">
            <Search className="h-8 w-8 mx-auto text-orange-600" />
            <CardTitle className="text-lg">Search Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Find cases by number, parties, or keywords
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/public/efile')}>
          <CardHeader className="text-center">
            <Upload className="h-8 w-8 mx-auto text-orange-600" />
            <CardTitle className="text-lg">File a Case</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Submit a new case to the court system
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/public/judgments')}>
          <CardHeader className="text-center">
            <FileText className="h-8 w-8 mx-auto text-orange-600" />
            <CardTitle className="text-lg">Judgments</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Browse and download published judgments
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/public/cause-list')}>
          <CardHeader className="text-center">
            <Calendar className="h-8 w-8 mx-auto text-orange-600" />
            <CardTitle className="text-lg">Cause List</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              View scheduled court hearings
            </CardDescription>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Cases */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Cases</CardTitle>
              <CardDescription>
                Recently added public cases
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/public/search/cases')}
            >
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentCases.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No cases found</h3>
              <p className="text-gray-500 mt-1">
                There are no public cases available
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCases.map(caseItem => (
                <div key={caseItem.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <h4 className="font-medium">{caseItem.title}</h4>
                    <p className="text-sm text-gray-500">
                      {caseItem.caseNumber} • {formatDate(caseItem.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{caseItem.type}</Badge>
                    <Badge variant="outline">{caseItem.status}</Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push(`/public/cases/${caseItem.id}`)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
