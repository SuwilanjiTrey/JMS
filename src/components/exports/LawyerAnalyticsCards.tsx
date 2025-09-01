import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    Bot,
    Scale
} from 'lucide-react';
import DashboardStats from '@/models/dashboard_stats';


const LawyerAnalyticsCards = ({
    stats,
    onAIAssistantOpen
}: {
    stats: DashboardStats;
    onAIAssistantOpen: (query: string) => void;
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-zambia-orange text-sm sm:text-base">
                        <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Legal Research AI</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">AI-powered case research and document analysis</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-xl sm:text-2xl font-bold mb-2">{stats.aiQueriesHandled}</div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4">Research queries today</p>
                    <Button
                        className="w-full bg-zambia-green hover:bg-zambia-green/90 text-xs sm:text-sm"
                        onClick={() => onAIAssistantOpen('Help me research case law and precedents for my legal arguments')}
                    >
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        <span className="hidden sm:inline">Legal </span>Research AI
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-zambia-orange text-sm sm:text-base">
                        <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Case Performance</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Your legal practice metrics</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs sm:text-sm">
                            <span>Win Rate</span>
                            <span className="font-medium text-green-600">78%</span>
                        </div>
                        <Progress value={78} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                            Based on last 20 concluded cases
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default LawyerAnalyticsCards;