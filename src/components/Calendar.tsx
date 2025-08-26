'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, MoreHorizontal } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';

interface CalendarProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onEventCreate?: (date: Date) => void;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'hearing' | 'meeting' | 'deadline' | 'other';
  location?: string;
  caseNumber?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

export default function Calendar({ 
  events = [], 
  onEventClick, 
  onDateClick, 
  onEventCreate 
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.start, date));
  };

  const getEventColor = (event: CalendarEvent) => {
    switch (event.type) {
      case 'hearing':
        return 'bg-zambia-orange text-white';
      case 'meeting':
        return 'bg-blue-100 text-blue-800';
      case 'deadline':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500';
      case 'high':
        return 'border-orange-500';
      case 'medium':
        return 'border-yellow-500';
      case 'low':
        return 'border-green-500';
      default:
        return 'border-gray-300';
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick?.(event);
  };

  const handleCreateEvent = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventCreate?.(date);
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-zambia-black">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button 
          className="bg-zambia-orange hover:bg-zambia-orange/90"
          onClick={() => onEventCreate?.(new Date())}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
          <CardDescription>
            Click on a date to view details or create new events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-gray-600 border-b"
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {monthDays.map((date, index) => {
              const dateEvents = getEventsForDate(date);
              const isToday = isSameDay(date, new Date());
              const isSelected = selectedDate && isSameDay(date, selectedDate);

              return (
                <div
                  key={index}
                  className={`
                    min-h-[100px] p-2 border border-gray-200 cursor-pointer
                    hover:bg-gray-50 transition-colors relative
                    ${!isSameMonth(date, currentDate) ? 'bg-gray-50 text-gray-400' : ''}
                    ${isToday ? 'bg-zambia-green/10' : ''}
                    ${isSelected ? 'ring-2 ring-zambia-orange' : ''}
                  `}
                  onClick={() => handleDateClick(date)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`
                      text-sm font-medium
                      ${isToday ? 'bg-zambia-green text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
                    `}>
                      {format(date, 'd')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 hover:opacity-100"
                      onClick={(e) => handleCreateEvent(date, e)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Events for this date */}
                  <div className="space-y-1">
                    {dateEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`
                          text-xs p-1 rounded cursor-pointer truncate
                          ${getEventColor(event)}
                          ${getPriorityColor(event.priority)}
                          border-l-2
                        `}
                        onClick={(e) => handleEventClick(event, e)}
                        title={event.title}
                      >
                        {event.caseNumber && `${event.caseNumber}: `}
                        {event.title}
                      </div>
                    ))}
                    {dateEvents.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dateEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              Events for {format(selectedDate, 'MMMM d, yyyy')}
            </CardTitle>
            <CardDescription>
              {getEventsForDate(selectedDate).length} events scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getEventsForDate(selectedDate).length === 0 ? (
                <p className="text-gray-500">No events scheduled for this date.</p>
              ) : (
                getEventsForDate(selectedDate).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onEventClick?.(event)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge className={getEventColor(event)}>
                          {event.type}
                        </Badge>
                        {event.priority && (
                          <Badge variant="outline" className={getPriorityColor(event.priority)}>
                            {event.priority}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium mt-1">{event.title}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                        {event.location && ` • ${event.location}`}
                      </div>
                      {event.caseNumber && (
                        <div className="text-sm text-gray-500">
                          Case: {event.caseNumber}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}