'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // This will be replaced with actual auth check
    const checkAuth = () => {
      const userRole = localStorage.getItem('userRole');
      if (userRole !== 'admin') {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zambia-black">Admin Dashboard</h1>
          <p className="text-zambia-black/70">Manage the judicial system</p>
        </div>
        <Badge variant="outline" className="bg-zambia-orange text-white">
          Administrator
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-zambia-green">Total Cases</CardTitle>
            <CardDescription>Active cases in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-zambia-green">Active Users</CardTitle>
            <CardDescription>Users across all roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-zambia-green">Pending Hearings</CardTitle>
            <CardDescription>Hearings scheduled this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-zambia-green">Documents</CardTitle>
            <CardDescription>Total documents uploaded</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/admin/cases')}
        >
          <CardHeader>
            <CardTitle className="text-zambia-orange">Case Management</CardTitle>
            <CardDescription>Create, assign, and manage cases</CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/admin/users')}
        >
          <CardHeader>
            <CardTitle className="text-zambia-orange">User Management</CardTitle>
            <CardDescription>Manage users and their roles</CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/admin/calendar')}
        >
          <CardHeader>
            <CardTitle className="text-zambia-orange">Calendar</CardTitle>
            <CardDescription>Manage court schedules and hearings</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}