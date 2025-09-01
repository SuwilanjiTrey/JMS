import { BarChart3, Clock, FileText } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Analytics Tab Content Component
const AnalyticsTab = () => {
  const analyticsCards = [
    {
      icon: BarChart3,
      title: "Performance Metrics",
      description: "Judge efficiency and case processing analytics"
    },
    {
      icon: Clock,
      title: "Trend Analysis",
      description: "Historical data analysis and forecasting"
    },
    {
      icon: FileText,
      title: "Custom Reports",
      description: "Generate custom reports and data exports"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
      {analyticsCards.map((card, index) => (
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

export default AnalyticsTab;