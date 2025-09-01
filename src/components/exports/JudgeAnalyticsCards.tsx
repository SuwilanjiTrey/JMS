import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    Bot,
    Clock,
} from 'lucide-react';
import DashboardStats from '@/models/dashboard_stats';

const JudgeAnalyticsCards = ({
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
                        <span>Legal AI Assistant</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">AI-powered legal research and analysis</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-xl sm:text-2xl font-bold mb-2">{stats.aiQueriesHandled}</div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4">Research queries today</p>
                    <Button
                        className="w-full bg-green-500 hover:bg-green-600 text-xs sm:text-sm"
                        onClick={() => onAIAssistantOpen('Help me research legal precedents for my current cases')}
                    >
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        <span className="hidden sm:inline">Research </span>Assistant
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-zambia-orange text-sm sm:text-base">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Case Progress</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Your judicial workload overview</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs sm:text-sm">
                            <span>Cases on Schedule</span>
                            <span className="font-medium text-green-600">85%</span>
                        </div>
                        <Progress value={85} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                            12 cases ahead of schedule, 3 need attention
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default JudgeAnalyticsCards;
