import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Gavel,
    Calendar,
    FileText,
} from 'lucide-react';
import DashboardStats from '@/models/dashboard_stats';

const JudgeOverviewCards = ({ stats }: { stats: DashboardStats }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-zambia-green">
                        My Cases
                    </CardTitle>
                    <Gavel className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{stats.totalCases}</div>
                    <p className="text-xs text-muted-foreground">
                        {stats.activeCases} active cases
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-zambia-green">
                        Pending Hearings
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{stats.pendingHearings}</div>
                    <p className="text-xs text-muted-foreground">
                        This week
                    </p>
                </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-zambia-green">
                        Documents Reviewed
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{stats.documentsProcessed}</div>
                    <p className="text-xs text-muted-foreground">
                        This month
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default JudgeOverviewCards;