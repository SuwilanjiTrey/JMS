'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminCalendar() {
  // Mock data for demonstration
  const hearings = [
    {
      id: '1',
      caseNumber: 'CV-2024-001',
      title: 'Smith vs. Johnson',
      date: '2024-02-01',
      time: '09:00',
      location: 'Courtroom 1',
      judge: 'Judge Mwansa',
      status: 'scheduled'
    },
    {
      id: '2',
      caseNumber: 'CR-2024-002',
      title: 'State vs. Banda',
      date: '2024-02-01',
      time: '14:00',
      location: 'Courtroom 2',
      judge: 'Judge Phiri',
      status: 'scheduled'
    },
    {
      id: '3',
      caseNumber: 'FA-2024-003',
      title: 'Chileshe vs. Chileshe',
      date: '2024-02-02',
      time: '10:30',
      location: 'Courtroom 3',
      judge: 'Judge Tembo',
      status: 'scheduled'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zambia-black">Court Calendar</h1>
          <p className="text-zambia-black/70">Manage court schedules and hearings</p>
        </div>
        <Button className="bg-zambia-orange hover:bg-zambia-orange/90">
          Schedule Hearing
        </Button>
      </div>

      {/* Calendar Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>Monthly calendar with hearings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-center text-gray-500">
                  Calendar component will be implemented here
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Today's Hearings</CardTitle>
              <CardDescription>Hearings scheduled for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hearings.filter(h => h.date === '2024-02-01').map((hearing) => (
                  <div key={hearing.id} className="border-l-4 border-zambia-orange pl-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{hearing.caseNumber}</h4>
                      <Badge variant="outline">{hearing.time}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{hearing.title}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {hearing.location} • {hearing.judge}
                    </div>
                  </div>
                ))}
                {hearings.filter(h => h.date === '2024-02-01').length === 0 && (
                  <p className="text-sm text-gray-500">No hearings scheduled for today</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming Hearings */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Hearings</CardTitle>
          <CardDescription>All scheduled hearings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hearings.map((hearing) => (
              <div key={hearing.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-medium">{hearing.caseNumber}</h4>
                      <p className="text-sm text-gray-600">{hearing.title}</p>
                    </div>
                    <div className="text-sm">
                      <div className="text-zambia-green font-medium">{hearing.date}</div>
                      <div className="text-gray-500">{hearing.time}</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{hearing.location}</div>
                      <div className="text-gray-500">{hearing.judge}</div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}