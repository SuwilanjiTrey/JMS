'use client';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    RefreshCw,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCasesByJudge, getCalendarEventsByJudge } from '@/lib/auth';

interface JudgeHeaderProps {
    onRefresh: () => void;
}

const JudgeHeader = ({ onRefresh }: JudgeHeaderProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Call the onRefresh function passed from parent
      onRefresh();
      
      // Also refresh any data needed for the header if necessary
      // For example, you might want to refresh the user's data
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zambia-black">
            Judge Dashboard
        </h1>
        <p className="text-sm sm:text-base text-zambia-black/70 mt-1">
            Manage your cases, hearings, and judicial workflows
        </p>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <Badge variant="outline" className="bg-blue-700 text-white text-xs sm:text-sm">
          <span className="hidden sm:inline">Honorable </span>Judge
        </Badge>
      </div>
      
      {error && (
        <div className="mt-2 text-red-600 text-sm flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

export default JudgeHeader;
