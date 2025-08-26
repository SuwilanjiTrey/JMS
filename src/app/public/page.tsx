'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PublicPage() {
  const router = useRouter();

  useEffect(() => {
    // This will be replaced with actual auth check
    const checkAuth = () => {
      const userRole = localStorage.getItem('userRole');
      if (!userRole || userRole !== 'public') {
        // For public access, we might allow unauthenticated access
        // or require basic authentication
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zambia-black">Public Portal</h1>
          <p className="text-zambia-black/70">Access public case information</p>
        </div>
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          Public
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-zambia-green">Search Cases</CardTitle>
            <CardDescription>Search public case records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,456</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-zambia-green">Active Cases</CardTitle>
            <CardDescription>Currently active cases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-zambia-green">Court Schedules</CardTitle>
            <CardDescription>Public court schedules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-zambia-green">Recent Rulings</CardTitle>
            <CardDescription>Recent court rulings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/public/cases')}
        >
          <CardHeader>
            <CardTitle className="text-zambia-orange">Case Search</CardTitle>
            <CardDescription>Search for case information</CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/public/search')}
        >
          <CardHeader>
            <CardTitle className="text-zambia-orange">Advanced Search</CardTitle>
            <CardDescription>Advanced case search options</CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/public/dashboard')}
        >
          <CardHeader>
            <CardTitle className="text-zambia-orange">Dashboard</CardTitle>
            <CardDescription>View public dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}