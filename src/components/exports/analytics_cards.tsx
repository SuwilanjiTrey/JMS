import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Bot, FileText, Gavel, Calendar, Users, Workflow, Bell, Shield, Database, CheckCircle, BarChart3, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardStats from '@/models/dashboard_stats';
import { Progress } from '@/components/ui/progress';

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
            className="w-full bg-green-500 hover:bg-green-600 text-xs sm:text-sm"
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


export default AnalyticsCards;
