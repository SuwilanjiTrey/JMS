import DashboardStats from "@/models/dashboard_stats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Bot, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParliamentDashboard } from '@/lib/parliamentIntegration';

// Integrations Tab Content Component
const IntegrationsTab = ({
  stats,
  onAIAssistantOpen
}: {
  stats: DashboardStats;
  onAIAssistantOpen: (query: string) => void;
}) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Parliament Integration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-zambia-orange text-sm sm:text-base">
            <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Parliament Integration</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Real-time legislative updates and impact analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ParliamentDashboard />
        </CardContent>
      </Card>

      {/* Other Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-zambia-orange text-sm sm:text-base">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>AI Services</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Document analysis and legal research AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm">Service Status:</span>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-green-600">Operational</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm">Queries Today:</span>
                <span className="text-xs sm:text-sm font-medium">{stats.aiQueriesHandled}</span>
              </div>
              <Button
                className="w-full text-xs sm:text-sm"
                variant="outline"
                onClick={() => onAIAssistantOpen('Show me system performance metrics and insights')}
              >
                Launch AI Assistant
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-zambia-orange text-sm sm:text-base">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Government e-Services</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Integration with national identity and civil services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm">Connection:</span>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-yellow-600">Pending Setup</span>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Integration with NRC, PACRA, and other government services
              </div>
              <Button className="w-full text-xs sm:text-sm" variant="outline">
                Configure Integration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IntegrationsTab;