'use client';

// app/public/cause-list/page.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ArrowLeft, Clock, MapPin, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/constants/firebase/config';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';

interface Hearing {
  id: string;
  title: string;
  caseNumber: string;
  caseType: string;
  scheduledDate: any;
  scheduledTime: string;
  location: string;
  judgeName: string;
  status: string;
}

export default function PublicCauseListPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [courtType, setCourtType] = useState<string>('all');
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(false);

  const courtTypes: { value: string; label: string }[] = [
    { value: 'all', label: 'All Courts' },
    { value: 'small-claims', label: 'Small Claims Court' },
    { value: 'specialized-tribunals', label: 'Specialized Tribunals' },
    { value: 'local-courts', label: 'Local Courts' },
    { value: 'subordinate-magistrate', label: 'Subordinate/Magistrate Courts' },
    { value: 'high-court', label: 'High Court' },
    { value: 'constitutional-court', label: 'Constitutional Court' },
    { value: 'supreme-court', label: 'Supreme Court' }
  ];

  const fetchCauseList = async () => {
    setLoading(true);
    
    try {
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      
      let hearingsQuery = collection(db, COLLECTIONS.HEARINGS);
      
      if (courtType && courtType !== 'all') {
        hearingsQuery = query(
          hearingsQuery,
          where('scheduledDate', '>=', startDate),
          where('scheduledDate', '<=', endDate),
          where('courtType', '==', courtType),
          where('isPublic', '==', true),
          orderBy('scheduledTime')
        );
      } else {
        hearingsQuery = query(
          hearingsQuery,
          where('scheduledDate', '>=', startDate),
          where('scheduledDate', '<=', endDate),
          where('isPublic', '==', true),
          orderBy('scheduledTime')
        );
      }
      
      const querySnapshot = await getDocs(hearingsQuery);
      
      const newHearings: Hearing[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        newHearings.push({
          id: doc.id,
          title: data.title,
          caseNumber: data.caseNumber,
          caseType: data.caseType,
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime,
          location: data.location,
          judgeName: data.judgeName,
          status: data.status
        } as Hearing);
      });
      
      setHearings(newHearings);
    } catch (error) {
      console.error('Error fetching cause list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCauseList();
  }, [selectedDate, courtType]);

  // Updated formatDate function to handle both Firestore Timestamps and regular Date objects
  const formatDate = (date: any): string => {
    // Check if it's a Firestore Timestamp with toDate method
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('en-ZM', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Check if it's already a Date object
    if (date instanceof Date) {
      return date.toLocaleDateString('en-ZM', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Check if it's a timestamp (number)
    if (typeof date === 'number') {
      return new Date(date).toLocaleDateString('en-ZM', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Fallback - try to convert to date
    try {
      return new Date(date).toLocaleDateString('en-ZM', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', date, e);
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'adjourned': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/public/dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Court Cause List</h1>
        <p className="text-gray-600">
          View scheduled court hearings
        </p>
      </div>
      
      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Date
          </CardTitle>
          <CardDescription>
            Choose a date to view scheduled hearings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Court Type</label>
              <Select value={courtType} onValueChange={setCourtType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select court type" />
                </SelectTrigger>
                <SelectContent>
                  {courtTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Cause List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Cause List for {formatDate(new Date(selectedDate))}
          </h2>
          <Badge variant="outline">
            {hearings.length} {hearings.length === 1 ? 'Hearing' : 'Hearings'}
          </Badge>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading cause list...</p>
          </div>
        ) : hearings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No hearings scheduled</h3>
              <p className="text-gray-500 mt-1">
                There are no public hearings scheduled for this date
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {hearings.map(hearing => (
              <Card key={hearing.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{hearing.title}</CardTitle>
                      <CardDescription>
                        Case Number: {hearing.caseNumber}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(hearing.status)}>
                      {hearing.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-500 mr-2" />
                      <div>
                        <div className="font-medium">Time</div>
                        <div className="text-sm text-gray-500">{hearing.scheduledTime}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                      <div>
                        <div className="font-medium">Location</div>
                        <div className="text-sm text-gray-500">{hearing.location}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-500 mr-2" />
                      <div>
                        <div className="font-medium">Judge</div>
                        <div className="text-sm text-gray-500">{hearing.judgeName}</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium">Case Type</div>
                      <Badge variant="outline">{hearing.caseType}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
