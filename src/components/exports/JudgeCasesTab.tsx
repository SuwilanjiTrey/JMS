import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Gavel,
    FileText,
    Search,
    BookOpen,
} from 'lucide-react';

export const JudgeCasesTab = ({ router, judgeId }: { router: any; judgeId: string }) => {
    const caseCards = [
        {
            icon: Gavel,
            title: "Active Cases",
            description: "View and manage your currently assigned cases",
            route: "/judge/cases/active"
        },
        {
            icon: FileText,
            title: "Pending Rulings",
            description: "Cases awaiting your judicial decision",
            route: "/judge/cases/rulings"
        },
        {
            icon: Search,
            title: "Case Search",
            description: "Search and research case law and precedents",
            route: "/judge/cases/search"
        },
        {
            icon: BookOpen,
            title: "Case History",
            description: "Review your past cases and decisions",
            route: "/judge/cases/history"
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            {caseCards.map((card, index) => (
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

export default JudgeCasesTab;