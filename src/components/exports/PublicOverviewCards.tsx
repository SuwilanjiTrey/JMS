import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Gavel,
    Eye,
} from 'lucide-react';
import DashboardStats from '@/models/dashboard_stats';


export const PublicOverviewCards = ({ stats }: { stats: DashboardStats }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-zambia-green">
                        Public Cases
                    </CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{stats.totalCases}</div>
                    <p className="text-xs text-muted-foreground">
                        Available for public view
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-zambia-green">
                        Active Cases
                    </CardTitle>
                    <Gavel className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{stats.activeCases}</div>
                    <p className="text-xs text-muted-foreground">
                        Currently in progress
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
