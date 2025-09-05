//components/clerk/HearingScheduler.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, User } from 'lucide-react';

interface Judge {
  id: string;
  displayName: string;
  profile?: {
    courtType?: string;
  };
}

interface Courtroom {
  id: string;
  name: string;
  location: string;
}

interface HearingSchedulerProps {
  caseId: string;
  caseTitle: string;
  courtId: string;
  onScheduleHearing: (data: {
    caseId: string;
    date: string;
    time: string;
    courtroom: string;
    judgeId: string;
    notes?: string;
  }) => Promise<void>;
}

export function HearingScheduler({ 
  caseId, 
  caseTitle, 
  courtId, 
  onScheduleHearing 
}: HearingSchedulerProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [courtroom, setCourtroom] = useState('');
  const [judgeId, setJudgeId] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [courtrooms, setCourtrooms] = useState<Courtroom[]>([]);

  // Fetch judges for the court
  useEffect(() => {
    const fetchJudges = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        const mockJudges: Judge[] = [
          { id: 'judge-1', displayName: 'Judge John Smith' },
          { id: 'judge-2', displayName: 'Judge Sarah Johnson' },
          { id: 'judge-3', displayName: 'Judge Michael Brown' },
        ];
        setJudges(mockJudges);
      } catch (error) {
        console.error('Error fetching judges:', error);
      }
    };

    fetchJudges();
  }, [courtId]);

  // Fetch courtrooms for the court
  useEffect(() => {
    const fetchCourtrooms = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        const mockCourtrooms: Courtroom[] = [
          { id: 'courtroom-1', name: 'Courtroom A', location: 'Floor 1' },
          { id: 'courtroom-2', name: 'Courtroom B', location: 'Floor 1' },
          { id: 'courtroom-3', name: 'Courtroom C', location: 'Floor 2' },
        ];
        setCourtrooms(mockCourtrooms);
      } catch (error) {
        console.error('Error fetching courtrooms:', error);
      }
    };

    fetchCourtrooms();
  }, [courtId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      await onScheduleHearing({
        caseId,
        date,
        time,
        courtroom,
        judgeId,
        notes,
      });
      
      // Reset form
      setDate('');
      setTime('');
      setCourtroom('');
      setJudgeId('');
      setNotes('');
    } catch (error) {
      console.error('Error scheduling hearing:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Schedule Hearing</CardTitle>
        <CardDescription>
          Schedule a hearing for case: {caseTitle}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <Label htmlFor="time" className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="courtroom" className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                Courtroom
              </Label>
              <Select value={courtroom} onValueChange={setCourtroom} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select courtroom" />
                </SelectTrigger>
                <SelectContent>
                  {courtrooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} ({room.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="judge" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Judge
              </Label>
              <Select value={judgeId} onValueChange={setJudgeId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select judge" />
                </SelectTrigger>
                <SelectContent>
                  {judges.map((judge) => (
                    <SelectItem key={judge.id} value={judge.id}>
                      {judge.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about the hearing..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isProcessing || !date || !time || !courtroom || !judgeId}>
            {isProcessing ? 'Scheduling...' : 'Schedule Hearing'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
