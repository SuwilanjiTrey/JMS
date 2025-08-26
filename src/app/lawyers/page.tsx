'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LawyersPage() {
  const router = useRouter();

  useEffect(() => {
    // This will be replaced with actual auth check
    const checkAuth = () => {
      const userRole = localStorage.getItem('userRole');
      if (userRole !== 'lawyer') {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zambia-black">Lawyer Dashboard</h1>
          <p className="text-zambia-black/70">Manage your cases and documents</p>
        </div>
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          Lawyer
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-zambia-green">My Cases</CardTitle>
            <CardDescription>Cases you're working on</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-zambia-green">Upcoming Hearings</CardTitle>
            <CardDescription>Hearings this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-zambia-green">Documents</CardTitle>
            <CardDescription>Documents uploaded</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-zambia-green">Pending Tasks</CardTitle>
            <CardDescription>Tasks to complete</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/lawyers/cases')}
        >
          <CardHeader>
            <CardTitle className="text-zambia-orange">My Cases</CardTitle>
            <CardDescription>View and manage your cases</CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/lawyers/documents')}
        >
          <CardHeader>
            <CardTitle className="text-zambia-orange">Documents</CardTitle>
            <CardDescription>Manage your case documents</CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/lawyers/dashboard')}
        >
          <CardHeader>
            <CardTitle className="text-zambia-orange">Dashboard</CardTitle>
            <CardDescription>View your dashboard overview</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}