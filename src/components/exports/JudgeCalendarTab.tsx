import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Calendar,
    Clock,
} from 'lucide-react';

const JudgeCalendarTab = ({ router, judgeId }: { router: any; judgeId: string }) => {
    const calendarCards = [
        {
            icon: Calendar,
            title: "My Schedule",
            description: "View and manage your hearing schedule",
            route: "/judge/calendar/schedule"
        },
        {
            icon: Clock,
            title: "Upcoming Hearings",
            description: "Today's and upcoming court sessions",
            route: "/judge/calendar/hearings"
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            {calendarCards.map((card, index) => (
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

export default JudgeCalendarTab;