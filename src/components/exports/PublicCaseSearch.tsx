import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Search,
    Eye,
} from 'lucide-react';

const PublicCaseSearch = ({ router }: { router: any }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zambia-orange text-sm sm:text-base">
                    <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Case Search</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                    Search public court records and case information
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                    <Card
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => router.push('/public/search/cases')}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2 text-zambia-orange text-sm sm:text-base">
                                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span>Search Cases</span>
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Find cases by number, parties, or keywords
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => router.push('/public/browse/cases')}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2 text-zambia-orange text-sm sm:text-base">
                                <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span>Browse Cases</span>
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Browse public cases by category or date
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );
};

export default PublicCaseSearch;