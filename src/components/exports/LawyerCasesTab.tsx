import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Gavel,
    FileText,
    Search,
    BookOpen,
} from 'lucide-react';


export const LawyerCasesTab = ({ router, lawyerId }: { router: any; lawyerId: string }) => {
    const caseCards = [
        {
            icon: Gavel,
            title: "Active Cases",
            description: "View and manage your current legal cases",
            route: "/lawyer/cases/active"
        },
        {
            icon: FileText,
            title: "Case Filings",
            description: "Create and submit new case documents",
            route: "/lawyer/cases/filings"
        },
        {
            icon: Search,
            title: "Case Research",
            description: "Search case law and legal precedents",
            route: "/lawyer/cases/research"
        },
        {
            icon: BookOpen,
            title: "Case History",
            description: "Review your past cases and outcomes",
            route: "/lawyer/cases/history"
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

export default LawyerCasesTab;