import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    FileText,
    Bot,
    Upload,
} from 'lucide-react';


const LawyerDocumentsTab = ({ router }: { router: any }) => {
    const documentCards = [
        {
            icon: FileText,
            title: "Case Documents",
            description: "Access documents for your cases",
            route: "/lawyer/documents/cases"
        },
        {
            icon: Upload,
            title: "File Documents",
            description: "Upload briefs, motions, and legal documents",
            route: "/lawyer/documents/upload"
        },
        {
            icon: Bot,
            title: "Document Analysis",
            description: "AI-powered document review and summarization",
            route: "/lawyer/documents/analysis"
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {documentCards.map((card, index) => (
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

export default LawyerDocumentsTab;