'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function JudgesPage() {
  const router = useRouter();

  useEffect(() => {
    // This will be replaced with actual auth check
    const checkAuth = () => {
      const userRole = localStorage.getItem('userRole');
      if (userRole !== 'judge') {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zambia-black">Judge Dashboard</h1>
          <p className="text-zambia-black/70">Manage your cases and hearings</p>
        </div>
        <Badge variant="outline" className="bg-zambia-green text-white">
          Judge
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-zambia-green">My Cases</CardTitle>
            <CardDescription>Cases assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-zambia-green">Upcoming Hearings</CardTitle>
            <CardDescription>Hearings this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-zambia-green">Pending Rulings</CardTitle>
            <CardDescription>Rulings to be issued</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-zambia-green">Documents</CardTitle>
            <CardDescription>Documents to review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/judges/cases')}
        >
          <CardHeader>
            <CardTitle className="text-zambia-orange">My Cases</CardTitle>
            <CardDescription>View and manage your assigned cases</CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/judges/calendar')}
        >
          <CardHeader>
            <CardTitle className="text-zambia-orange">Calendar</CardTitle>
            <CardDescription>View your hearing schedule</CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/judges/dashboard')}
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