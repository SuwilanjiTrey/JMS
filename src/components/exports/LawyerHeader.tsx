import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    RefreshCw,
} from 'lucide-react';


const LawyerHeader = ({ onRefresh }: { onRefresh: () => void }) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-zambia-black">
                    Lawyer Dashboard
                </h1>
                <p className="text-sm sm:text-base text-zambia-black/70 mt-1">
                    Manage your cases and legal practice
                </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    className="flex items-center space-x-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Badge variant="outline" className="bg-purple-700 text-white text-xs sm:text-sm">
                    <span className="hidden sm:inline">Legal </span>Counsel
                </Badge>
            </div>
        </div>
    );
};


export default LawyerHeader;