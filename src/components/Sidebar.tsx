'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Users, 
  Search, 
  Settings,
  Gavel,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { UserRole } from '@/models';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: SidebarItem[];
}

export default function Sidebar({ userRole, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const getSidebarItems = (role: UserRole): SidebarItem[] => {
    const baseItems: SidebarItem[] = [
      {
        name: 'Dashboard',
        href: role === 'admin' ? '/admin' : role === 'judge' ? '/judges' : role === 'lawyer' ? '/lawyers' : '/public',
        icon: LayoutDashboard
      }
    ];

    if (role !== 'public') {
      baseItems.push({
        name: 'Cases',
        href: role === 'admin' ? '/admin/cases' : role === 'judge' ? '/judges/cases' : '/lawyers/cases',
        icon: FileText
      });
    }

    if (role === 'admin' || role === 'judge') {
      baseItems.push({
        name: 'Calendar',
        href: role === 'admin' ? '/admin/calendar' : '/judges/calendar',
        icon: Calendar
      });
    }

    if (role === 'admin') {
      baseItems.push({
        name: 'Users',
        href: '/admin/users',
        icon: Users
      });
    }

    if (role === 'lawyer') {
      baseItems.push({
        name: 'Documents',
        href: '/lawyers/documents',
        icon: FileText
      });
    }

    if (role === 'public') {
      baseItems.push({
        name: 'Search Cases',
        href: '/public/cases',
        icon: Search
      });
      baseItems.push({
        name: 'Advanced Search',
        href: '/public/search',
        icon: Search,
        badge: 'New'
      });
    }

    baseItems.push({
      name: 'Settings',
      href: '/settings',
      icon: Settings
    });

    return baseItems;
  };

  const sidebarItems = getSidebarItems(userRole);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <Gavel className="h-6 w-6 text-zambia-orange mr-2" />
            <span className="text-lg font-bold text-zambia-black">JMS Zambia</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* User Role Badge */}
        <div className="p-4 border-b">
          <Badge className={getRoleBadgeColor(userRole)}>
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </Badge>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive(item.href)
                  ? 'bg-zambia-orange text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-zambia-orange'
              )}
              onClick={onClose}
            >
              <item.icon className="mr-3 h-4 w-4" />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="text-xs text-gray-500 text-center">
            Judicial Management System
            <br />
            © 2024 Republic of Zambia
          </div>
        </div>
      </div>
    </div>
  );
}