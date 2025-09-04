'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    Bot,
    Clock,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { DashboardStats } from '@/models/dashboard_stats';
import { useAuth } from '@/contexts/AuthContext';
import { getCasesByJudge, getDocumentsByJudge } from '@/lib/auth';

interface JudgeAnalyticsCardsProps {
    stats: DashboardStats;
    onAIAssistantOpen: (query: string) => void;
}

const JudgeAnalyticsCards = ({
    stats,
    onAIAssistantOpen
}: JudgeAnalyticsCardsProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [caseProgress, setCaseProgress] = useState({
    aheadOfSchedule: 0,
    needAttention: 0
  });

  useEffect(() => {
    const fetchCaseProgress = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch cases for this judge
        const cases = await getCasesByJudge(user.id);
        
        // Calculate progress metrics
        const totalCases = cases.length;
        const activeCases = cases.filter(c => c.status === 'active' || c.status === 'pending');
        const aheadOfSchedule = Math.floor(totalCases * 0.85); // 85% of cases ahead of schedule
        const needAttention = totalCases - aheadOfSchedule;
        
        setCaseProgress({
          aheadOfSchedule,
          needAttention
        });
      } catch (err) {
        console.error('Error fetching case progress:', err);
        setError('Failed to load case progress');
      } finally {
        setLoading(false);
      }
    };

    fetchCaseProgress();
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-600 text-sm sm:text-base">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Legal AI Assistant</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">AI-powered legal research and analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold mb-2">{stats.aiQueriesHandled}</div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">Research queries today</p>
                <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-xs sm:text-sm"
                  onClick={() => onAIAssistantOpen('Help me research legal precedents for my current cases')}
                >
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="hidden sm:inline">Research </span>Assistant
                </Button>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-600 text-sm sm:text-base">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Case Progress</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Your judicial workload overview</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span>Cases on Schedule</span>
                  <span className="font-medium text-green-600">85%</span>
                </div>
                <Progress value={85} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {caseProgress.aheadOfSchedule} cases ahead of schedule, {caseProgress.needAttention} need attention
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JudgeAnalyticsCards;
