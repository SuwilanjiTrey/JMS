'use client';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    Clock,
    AlertCircle,
    Plus,
    Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { getCalendarEventsByJudge } from '@/lib/auth';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location: string;
  eventType: 'hearing' | 'trial' | 'meeting' | 'other';
  caseId?: string;
  caseTitle?: string;
}

const JudgeCalendarTab = ({ judgeId }: { judgeId: string }) => {
    const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
    const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeView, setActiveView] = useState<'schedule' | 'hearings'>('schedule');
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const events = await getCalendarEventsByJudge(judgeId);
                
                // Get today's date at midnight
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                // Get tomorrow's date at midnight
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                
                // Filter events into today's events and upcoming events
                const todayEventsList = events.filter(event => {
                    const eventDate = new Date(event.startTime);
                    return eventDate >= today && eventDate < tomorrow;
                });
                
                const upcomingEventsList = events.filter(event => {
                    const eventDate = new Date(event.startTime);
                    return eventDate >= tomorrow;
                }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                
                setTodayEvents(todayEventsList);
                setUpcomingEvents(upcomingEventsList);
            } catch (err) {
                console.error('Error fetching calendar events:', err);
                setError('Failed to load calendar events');
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [judgeId]);

    const getEventTypeColor = (eventType: string) => {
        switch (eventType) {
            case 'hearing': return 'bg-blue-100 text-blue-800';
            case 'trial': return 'bg-purple-100 text-purple-800';
            case 'meeting': return 'bg-green-100 text-green-800';
            case 'other': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDateTime = (date: Date) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calendarCards = [
        {
            icon: Calendar,
            title: "My Schedule",
            description: loading ? "Loading schedule..." : 
                todayEvents.length > 0 ? `${todayEvents.length} event${todayEvents.length !== 1 ? 's' : ''} today` : "No events scheduled for today",
            view: 'schedule'
        },
        {
            icon: Clock,
            title: "Upcoming Hearings",
            description: loading ? "Loading hearings..." : 
                upcomingEvents.length > 0 ? `${upcomingEvents.length} upcoming hearing${upcomingEvents.length !== 1 ? 's' : ''}` : "No upcoming hearings",
            view: 'hearings'
        }
    ];

    const filteredEvents = activeView === 'schedule' 
        ? [...todayEvents, ...upcomingEvents.slice(0, 5)]
        : upcomingEvents.filter(event => event.eventType === 'hearing' || event.eventType === 'trial');

    if (filterType !== 'all') {
        filteredEvents.filter(event => event.eventType === filterType);
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <p className="text-red-800">{error}</p>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                {calendarCards.map((card, index) => (
                    <Card
                        key={index}
                        className={`cursor-pointer hover:shadow-lg transition-shadow ${activeView === card.view ? 'ring-2 ring-orange-500' : ''}`}
                        onClick={() => setActiveView(card.view as any)}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-orange-600 text-sm sm:text-base">
                                    <card.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                    <span>{card.title}</span>
                                </div>
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                    {activeView === 'schedule' ? todayEvents.length : upcomingEvents.length}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                {card.description}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>
            
            {/* Calendar View Content */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>
                            {activeView === 'schedule' && 'My Schedule'}
                            {activeView === 'hearings' && 'Upcoming Hearings'}
                        </span>
                        <div className="flex space-x-2">
                            <div className="relative">
                                <select 
                                    className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="all">All Types</option>
                                    <option value="hearing">Hearings</option>
                                    <option value="trial">Trials</option>
                                    <option value="meeting">Meetings</option>
                                    <option value="other">Other</option>
                                </select>
                                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                            </div>
                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                                <Plus className="h-4 w-4 mr-1" /> Add Event
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
                        </div>
                    ) : (
                        <>
                            {activeView === 'schedule' && (
                                <div>
                                    {todayEvents.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-lg font-medium text-gray-900 mb-3">Today's Schedule</h3>
                                            <div className="space-y-3">
                                                {todayEvents.map((event) => (
                                                    <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="flex items-center">
                                                                    <h3 className="font-medium">{event.title}</h3>
                                                                    <Badge className={`ml-2 ${getEventTypeColor(event.eventType)}`}>
                                                                        {event.eventType}
                                                                    </Badge>
                                                                </div>
                                                                {event.caseTitle && (
                                                                    <p className="text-sm text-orange-600 mt-1">Case: {event.caseTitle}</p>
                                                                )}
                                                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                                                <div className="flex items-center mt-2 text-sm text-gray-500">
                                                                    <Clock className="h-4 w-4 mr-1" />
                                                                    <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                                                                    <span className="mx-2">•</span>
                                                                    <span>{event.location}</span>
                                                                </div>
                                                            </div>
                                                            <Button size="sm" variant="outline">
                                                                Details
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {upcomingEvents.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-3">Upcoming Events</h3>
                                            <div className="space-y-3">
                                                {upcomingEvents.slice(0, 5).map((event) => (
                                                    <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="flex items-center">
                                                                    <h3 className="font-medium">{event.title}</h3>
                                                                    <Badge className={`ml-2 ${getEventTypeColor(event.eventType)}`}>
                                                                        {event.eventType}
                                                                    </Badge>
                                                                </div>
                                                                {event.caseTitle && (
                                                                    <p className="text-sm text-orange-600 mt-1">Case: {event.caseTitle}</p>
                                                                )}
                                                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                                                <div className="flex items-center mt-2 text-sm text-gray-500">
                                                                    <Calendar className="h-4 w-4 mr-1" />
                                                                    <span>{formatDate(event.startTime)}</span>
                                                                    <span className="mx-2">•</span>
                                                                    <Clock className="h-4 w-4 mr-1" />
                                                                    <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                                                                    <span className="mx-2">•</span>
                                                                    <span>{event.location}</span>
                                                                </div>
                                                            </div>
                                                            <Button size="sm" variant="outline">
                                                                Details
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {todayEvents.length === 0 && upcomingEvents.length === 0 && (
                                        <p className="text-gray-500 text-center py-4">No events scheduled</p>
                                    )}
                                </div>
                            )}

                            {activeView === 'hearings' && (
                                <div>
                                    {filteredEvents.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">No upcoming hearings</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredEvents.map((event) => (
                                                <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center">
                                                                <h3 className="font-medium">{event.title}</h3>
                                                                <Badge className={`ml-2 ${getEventTypeColor(event.eventType)}`}>
                                                                    {event.eventType}
                                                                </Badge>
                                                            </div>
                                                            {event.caseTitle && (
                                                                <p className="text-sm text-orange-600 mt-1">Case: {event.caseTitle}</p>
                                                            )}
                                                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                                            <div className="flex items-center mt-2 text-sm text-gray-500">
                                                                <Calendar className="h-4 w-4 mr-1" />
                                                                <span>{formatDate(event.startTime)}</span>
                                                                <span className="mx-2">•</span>
                                                                <Clock className="h-4 w-4 mr-1" />
                                                                <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                                                                <span className="mx-2">•</span>
                                                                <span>{event.location}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <Button size="sm" variant="outline">
                                                                Details
                                                            </Button>
                                                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                                                                Prepare
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
            
            {/* Preview of next event */}
            {!loading && upcomingEvents.length > 0 && (
                <Card className="bg-orange-50 border-orange-100">
                    <CardHeader>
                        <CardTitle className="text-orange-800 text-sm">Next Event</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">{upcomingEvents[0].title}</div>
                                <div className="text-sm text-gray-600">
                                    {formatDateTime(upcomingEvents[0].startTime)}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {upcomingEvents[0].location}
                                </div>
                            </div>
                            <Badge className={getEventTypeColor(upcomingEvents[0].eventType)}>
                                {upcomingEvents[0].eventType}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default JudgeCalendarTab;
