// app/registrars/dashboard/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser, getOrCreateCourt, getCasesByCourt } from '@/lib/auth';
import { FileText, Clock, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { Case } from '@/models';

interface DashboardStats {
  pendingFilings: number;
  verifiedFilings: number;
  rejectedFilings: number;
  summonsIssued: number;
}

export default function RegistrarDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    pendingFilings: 0,
    verifiedFilings: 0,
    rejectedFilings: 0,
    summonsIssued: 0,
  });

  useEffect(() => {
    const fetchUserAndStats = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        // Normalize role
        const userRole = currentUser.profile?.adminType ?? currentUser.role;
        
        // Check if user has appropriate role
        if (!['admin', 'court-admin', 'registrar', 'court-registrar'].includes(userRole)) {
          router.push('/unauthorized');
          return;
        }
        
        setUser(currentUser);
        
        // Get court information from user profile
        const courtType = currentUser.profile?.courtType;
        const courtLocation = currentUser.profile?.courtLocation;
        
        if (!courtType || !courtLocation) {
          setError('Your profile is missing court information. Please contact your system administrator.');
          setLoading(false);
          return;
        }
        
        // Get or create court
        const court = await getOrCreateCourt(courtType, courtLocation);
        const courtId = court.id;
        
        // Fetch cases for this court
        const cases = await getCasesByCourt(courtId);
        
        // Calculate stats based on case statuses
        const calculatedStats: DashboardStats = {
          pendingFilings: cases.filter((c: Case) => c.status === 'filed').length,
          verifiedFilings: cases.filter((c: Case) => c.status === 'verified').length,
          rejectedFilings: cases.filter((c: Case) => c.status === 'rejected').length,
          summonsIssued: cases.filter((c: Case) => c.status === 'summons').length,
        };
        
        setStats(calculatedStats);
      } catch (error) {
        console.error('Error fetching user or stats:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndStats();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-lg font-medium">Error</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <div className="mt-6">
                <Button onClick={() => router.push('/login')}>
                  Back to Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Registrar Dashboard</h1>
        <p className="text-gray-600">
          Welcome, {user?.displayName}. Manage case filings and issue summons.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Filings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingFilings}</div>
            <p className="text-xs text-muted-foreground">
              Cases awaiting verification
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Filings</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedFilings}</div>
            <p className="text-xs text-muted-foreground">
              Cases approved this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Filings</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejectedFilings}</div>
            <p className="text-xs text-muted-foreground">
              Cases rejected this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Summons Issued</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summonsIssued}</div>
            <p className="text-xs text-muted-foreground">
              Summons issued this month
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
  <CardHeader>
    <CardTitle>Quick Actions</CardTitle>
    <CardDescription>Common tasks for registrars</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <Button 
      className="w-full justify-start" 
      onClick={() => router.push('/registrars/cases')}
    >
      <FileText className="mr-2 h-4 w-4" />
      Review Pending Filings
    </Button>
    <Button 
      variant="outline" 
      className="w-full justify-start"
      onClick={() => router.push('/registrars/cases?filter=summons')}
    >
      <Clock className="mr-2 h-4 w-4" />
      Issue Summons
    </Button>
    <Button 
      variant="outline" 
      className="w-full justify-start"
      onClick={() => router.push('/registrars/calendar/functions')}
    >
      <Clock className="mr-2 h-4 w-4" />
      Manage Court Calendar
    </Button>
    <Button 
      variant="outline" 
      className="w-full justify-start"
      onClick={() => router.push('/registrars/decrees/functions')}
    >
      <FileText className="mr-2 h-4 w-4" />
      Manage Decrees
    </Button>
    <Button 
      variant="outline" 
      className="w-full justify-start"
      onClick={() => router.push('/registrars/compliance/functions')}
    >
      <CheckCircle className="mr-2 h-4 w-4" />
      Track Compliance
    </Button>
    <Button 
      variant="outline" 
      className="w-full justify-start"
      onClick={() => router.push('/registrars/allocation/functions')}
    >
      <Users className="mr-2 h-4 w-4" />
      Allocate Cases to Judges
    </Button>
  </CardContent>
</Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Verified filing', case: 'Case #12345', time: '2 hours ago' },
                { action: 'Issued summons', case: 'Case #12342', time: 'Yesterday' },
                { action: 'Rejected filing', case: 'Case #12338', time: '2 days ago' },
                { action: 'Verified filing', case: 'Case #12335', time: '3 days ago' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.case}</p>
                  </div>
                  <Badge variant="outline">{activity.time}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
