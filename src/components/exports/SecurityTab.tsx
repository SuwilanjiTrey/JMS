import { Shield, Database, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Security Tab Content Component
const SecurityTab = () => {
  const securityCards = [
    {
      icon: Shield,
      title: "Access Control",
      description: "Role-based permissions and security policies"
    },
    {
      icon: Database,
      title: "Audit Logs",
      description: "System activity tracking and compliance reporting"
    },
    {
      icon: CheckCircle,
      title: "Compliance",
      description: "Data protection and regulatory compliance"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
      {securityCards.map((card, index) => (
        <Card key={index}>
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

export default  SecurityTab;