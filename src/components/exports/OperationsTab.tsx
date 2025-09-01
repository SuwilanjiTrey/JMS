import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gavel, Users, Calendar, FileText, Workflow, Bell } from 'lucide-react';

// Operations Tab Content Component
const OperationsTab = ({ router }: { router: any }) => {
    const operationCards = [
        {
            icon: Gavel,
            title: "Case Management",
            description: "Create, assign, and manage cases with automated workflows",
            route: "/admin/cases"
        },
        {
            icon: Calendar,
            title: "Court Scheduling",
            description: "Manage hearings, judges, and courtroom allocations",
            route: "/admin/calendar"
        },
        {
            icon: FileText,
            title: "Document Control",
            description: "E-filing, digital signatures, and document workflows",
            route: "/admin/documents"
        },
        {
            icon: Users,
            title: "User Management",
            description: "Manage users, roles, and access permissions",
            route: "/admin/users"
        },
        {
            icon: Workflow,
            title: "Workflow Automation",
            description: "Configure automated processes and notifications",
            route: "/admin/workflows"
        },
        {
            icon: Bell,
            title: "Notifications",
            description: "Manage system alerts and user notifications",
            route: "/admin/notifications"
        }
    ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
      {operationCards.map((card, index) => (
        <Card
          key={index}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push(card.route)}
        >
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-zambia-orange text-sm sm:text-base">
              <card.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>{card.title}</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {card.description}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

export default OperationsTab;