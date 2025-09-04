'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Gavel,
    Calendar,
    FileText,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { DashboardStats } from '@/models/dashboard_stats';
import { useAuth } from '@/contexts/AuthContext';
import { getCasesByJudge, getCalendarEventsByJudge, getDocumentsByJudge } from '@/lib/auth';

interface JudgeOverviewCardsProps {
    stats: DashboardStats;
}

const JudgeOverviewCards = ({ stats }: JudgeOverviewCardsProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [realStats, setRealStats] = useState<DashboardStats>(stats);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch cases for this judge
        const cases = await getCasesByJudge(user.id);
        const totalCases = cases.length;
        const activeCases = cases.filter(c => c.status === 'active' || c.status === 'pending').length;
        
        // Fetch calendar events for this judge
        const events = await getCalendarEventsByJudge(user.id);
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        
        const pendingHearings = events.filter(event => {
          const eventDate = new Date(event.startTime);
          return eventDate >= now && eventDate < endOfWeek;
        }).length;
        
        // Fetch documents for this judge
        const documents = await getDocumentsByJudge(user.id);
        const currentMonth = new Date().getMonth();
        const documentsProcessed = documents.filter(doc => {
          const docMonth = new Date(doc.uploadedAt).getMonth();
          return docMonth === currentMonth;
        }).length;
        
        // Mock AI queries handled (since we don't have this in our schema yet)
        const aiQueriesHandled = Math.floor(Math.random() * 10) + 1;
        
        setRealStats({
          totalCases,
          activeCases,
          pendingHearings,
          documentsProcessed,
          aiQueriesHandled
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-600">
              My Cases
            </CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold">{realStats.totalCases}</div>
                <p className="text-xs text-muted-foreground">
                  {realStats.activeCases} active cases
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-600">
              Pending Hearings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold">{realStats.pendingHearings}</div>
                <p className="text-xs text-muted-foreground">
                  This week
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-600">
              Documents Reviewed
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold">{realStats.documentsProcessed}</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JudgeOverviewCards;
