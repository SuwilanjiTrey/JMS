'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import CalendarComponent from '@/components/Calendar'; // The existing calendar component

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type?: 'hearing' | 'meeting' | 'deadline' | 'other';
  location?: string;
  caseNumber?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onEventCreate?: (date: Date) => void;
  title?: string;
  description?: string;
  className?: string;
  showCreateButton?: boolean;
  createButtonText?: string;
}

export default function Calendar({
  events,
  onEventClick,
  onDateClick,
  onEventCreate,
  title = "Calendar",
  description = "Calendar view",
  className = "",
  showCreateButton = false,
  createButtonText = "Add Event"
}: CalendarProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {showCreateButton && (
            <Button 
              onClick={() => onEventCreate && onEventCreate(new Date())}
              className="w-full sm:w-auto"
            >
              {createButtonText}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <CalendarComponent
            events={events}
            onEventClick={onEventClick}
            onDateClick={onDateClick}
            onEventCreate={onEventCreate}
          />
        </div>
      </CardContent>
    </Card>
  );
}
