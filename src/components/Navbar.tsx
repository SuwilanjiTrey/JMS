'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  LogOut, 
  User,
  Gavel,
  FileText,
  Calendar
} from 'lucide-react';
import { UserRole } from '@/models';

interface NavbarProps {
  userRole?: UserRole;
  userName?: string;
  userAvatar?: string;
}

export default function Navbar({ userRole, userName, userAvatar }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-zambia-orange text-white';
      case 'judge':
        return 'bg-zambia-green text-white';
      case 'lawyer':
        return 'bg-blue-100 text-blue-800';
      case 'public':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDashboardPath = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'judge':
        return '/judges';
      case 'lawyer':
        return '/lawyers';
      case 'public':
        return '/public';
      default:
        return '/';
    }
  };

  const handleLogout = () => {
    // This will be replaced with actual logout logic
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href={userRole ? getDashboardPath(userRole) : '/'} className="flex items-center">
              <Gavel className="h-8 w-8 text-zambia-orange mr-2" />
              <span className="text-xl font-bold text-zambia-black">JMS Zambia</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {userRole && (
            <div className="hidden md:flex items-center space-x-4">
              <Link 
                href={getDashboardPath(userRole)}
                className="text-gray-700 hover:text-zambia-orange px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              
              {userRole !== 'public' && (
                <Link 
                  href={`${getDashboardPath(userRole)}/cases`}
                  className="text-gray-700 hover:text-zambia-orange px-3 py-2 rounded-md text-sm font-medium"
                >
                  Cases
                </Link>
              )}
              
              {(userRole === 'admin' || userRole === 'judge') && (
                <Link 
                  href={`${getDashboardPath(userRole)}/calendar`}
                  className="text-gray-700 hover:text-zambia-orange px-3 py-2 rounded-md text-sm font-medium"
                >
                  Calendar
                </Link>
              )}
              
              {userRole === 'admin' && (
                <Link 
                  href="/admin/users"
                  className="text-gray-700 hover:text-zambia-orange px-3 py-2 rounded-md text-sm font-medium"
                >
                  Users
                </Link>
              )}
              
              {userRole === 'lawyer' && (
                <Link 
                  href="/lawyers/documents"
                  className="text-gray-700 hover:text-zambia-orange px-3 py-2 rounded-md text-sm font-medium"
                >
                  Documents
                </Link>
              )}
              
              {userRole === 'public' && (
                <Link 
                  href="/public/search"
                  className="text-gray-700 hover:text-zambia-orange px-3 py-2 rounded-md text-sm font-medium"
                >
                  Search
                </Link>
              )}
            </div>
          )}

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>

            {/* User Menu */}
            {userRole && userName && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userAvatar} alt={userName} />
                      <AvatarFallback>
                        {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">{userName}</div>
                      <Badge className={getRoleBadgeColor(userRole)}>
                        {userRole}
                      </Badge>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile menu button */}
            {userRole && (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && userRole && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            <Link
              href={getDashboardPath(userRole)}
              className="text-gray-700 hover:text-zambia-orange block px-3 py-2 rounded-md text-base font-medium"
            >
              Dashboard
            </Link>
            
            {userRole !== 'public' && (
              <Link
                href={`${getDashboardPath(userRole)}/cases`}
                className="text-gray-700 hover:text-zambia-orange block px-3 py-2 rounded-md text-base font-medium"
              >
                Cases
              </Link>
            )}
            
            {(userRole === 'admin' || userRole === 'judge') && (
              <Link
                href={`${getDashboardPath(userRole)}/calendar`}
                className="text-gray-700 hover:text-zambia-orange block px-3 py-2 rounded-md text-base font-medium"
              >
                Calendar
              </Link>
            )}
            
            {userRole === 'admin' && (
              <Link
                href="/admin/users"
                className="text-gray-700 hover:text-zambia-orange block px-3 py-2 rounded-md text-base font-medium"
              >
                Users
              </Link>
            )}
            
            {userRole === 'lawyer' && (
              <Link
                href="/lawyers/documents"
                className="text-gray-700 hover:text-zambia-orange block px-3 py-2 rounded-md text-base font-medium"
              >
                Documents
              </Link>
            )}
            
            {userRole === 'public' && (
              <Link
                href="/public/search"
                className="text-gray-700 hover:text-zambia-orange block px-3 py-2 rounded-md text-base font-medium"
              >
                Search
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}