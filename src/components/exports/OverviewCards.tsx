import DashboardStats from "@/models/dashboard_stats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gavel, Users, Calendar, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Overview Cards Component
const OverviewCards = ({ stats }: { stats: DashboardStats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-zambia-green">
            Total Cases
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
            System Users
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            Across all roles
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-zambia-green">
            System Health
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{stats.systemHealth}%</div>
          <Progress value={stats.systemHealth} className="mt-2" />
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewCards;