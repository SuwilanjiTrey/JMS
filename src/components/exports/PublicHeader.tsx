// components/exports/PublicHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Search, 
  FileText, 
  Calendar, 
  Upload, 
  User,
  LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/auth';

interface PublicHeaderProps {
  onRefresh?: () => void;
}

const PublicHeader = ({ onRefresh }: PublicHeaderProps) => {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-600">Judicial Management System</h1>
        <p className="text-gray-600">Republic of Zambia - Public Portal</p>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          onClick={() => router.push('/public/dashboard')}
        >
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => router.push('/public/search/cases')}
        >
          <Search className="mr-2 h-4 w-4" />
          Search Cases
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => router.push('/public/efile')}
        >
          <Upload className="mr-2 h-4 w-4" />
          File Case
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => router.push('/public/judgments')}
        >
          <FileText className="mr-2 h-4 w-4" />
          Judgments
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => router.push('/public/cause-list')}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Cause List
        </Button>
        
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
        )}
        
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default PublicHeader;
