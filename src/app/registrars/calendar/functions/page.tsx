// app/registrars/calendar/functions/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Calendar as CalendarIcon, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { getCurrentUser, getOrCreateCourt } from '@/lib/auth';
import { collection, getDocs, query, where, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/constants/firebase/config';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location: string;
  eventType: string;
  courtId: string;
  caseId?: string;
  judgeId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function CalendarFunctionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    eventType: '',
    caseId: '',
    judgeId: '',
  });

  useEffect(() => {
    const fetchUserAndEvents = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        setUser(currentUser);
        
        const courtType = currentUser.profile?.courtType;
        const courtLocation = currentUser.profile?.courtLocation;
        
        if (!courtType || !courtLocation) {
          setError('Your profile is missing court information. Please contact your system administrator.');
          setLoading(false);
          return;
        }
        
        const court = await getOrCreateCourt(courtType, courtLocation);
        const courtId = court.id;
        
        const eventsRef = collection(db, COLLECTIONS.CALENDAR_EVENTS);
        const q = query(
          eventsRef,
          where('courtId', '==', courtId),
          orderBy('startTime', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        const eventsData: CalendarEvent[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          eventsData.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            startTime: data.startTime?.toDate() || new Date(),
            endTime: data.endTime?.toDate() || new Date(),
            location: data.location,
            eventType: data.eventType,
            courtId: data.courtId,
            caseId: data.caseId,
            judgeId: data.judgeId,
            createdBy: data.createdBy,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });
        
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching user or events:', error);
        setError(error instanceof Error ? error.message : 'Failed to load calendar events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndEvents();
  }, [router]);

  useEffect(() => {
    let result = events;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        event => 
          event.title.toLowerCase().includes(term) ||
          event.description.toLowerCase().includes(term) ||
          event.location.toLowerCase().includes(term)
      );
    }
    
    setFilteredEvents(result);
  }, [events, searchTerm]);

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      eventType: '',
      caseId: '',
      judgeId: '',
    });
    setIsDialogOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      startTime: event.startTime.toISOString().slice(0, 16),
      endTime: event.endTime.toISOString().slice(0, 16),
      location: event.location,
      eventType: event.eventType,
      caseId: event.caseId || '',
      judgeId: event.judgeId || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.CALENDAR_EVENTS, eventId));
        setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (!user) return;
      
      const courtType = user.profile?.courtType;
      const courtLocation = user.profile?.courtLocation;
      
      if (!courtType || !courtLocation) {
        setError('Your profile is missing court information.');
        return;
      }
      
      const court = await getOrCreateCourt(courtType, courtLocation);
      const courtId = court.id;
      
      if (editingEvent) {
        // Update existing event
        const eventRef = doc(db, COLLECTIONS.CALENDAR_EVENTS, editingEvent.id);
        await updateDoc(eventRef, {
          title: formData.title,
          description: formData.description,
          startTime: new Date(formData.startTime),
          endTime: new Date(formData.endTime),
          location: formData.location,
          eventType: formData.eventType,
          caseId: formData.caseId || null,
          judgeId: formData.judgeId || null,
          updatedAt: serverTimestamp(),
        });
        
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event.id === editingEvent.id
              ? {
                  ...event,
                  title: formData.title,
                  description: formData.description,
                  startTime: new Date(formData.startTime),
                  endTime: new Date(formData.endTime),
                  location: formData.location,
                  eventType: formData.eventType,
                  caseId: formData.caseId || undefined,
                  judgeId: formData.judgeId || undefined,
                  updatedAt: new Date(),
                }
              : event
          )
        );
      } else {
        // Create new event
        const eventsRef = collection(db, COLLECTIONS.CALENDAR_EVENTS);
        const newEvent = {
          title: formData.title,
          description: formData.description,
          startTime: new Date(formData.startTime),
          endTime: new Date(formData.endTime),
          location: formData.location,
          eventType: formData.eventType,
          courtId,
          caseId: formData.caseId || null,
          judgeId: formData.judgeId || null,
          createdBy: user.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        const docRef = await addDoc(eventsRef, newEvent);
        
        setEvents(prevEvents => [
          ...prevEvents,
          {
            id: docRef.id,
            ...newEvent,
            startTime: new Date(formData.startTime),
            endTime: new Date(formData.endTime),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-lg font-medium">Error</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <div className="mt-6">
                <Button onClick={() => router.push('/registrars/dashboard')}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/registrars/dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Calendar Management</h1>
        <p className="text-gray-600">
          Manage court schedules, hearings, and events.
        </p>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleCreateEvent}>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>
      
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No events found</h3>
            <p className="text-gray-600 text-center">
              {searchTerm
                ? 'No events match your search criteria.'
                : 'There are no events scheduled.'}
            </p>
            <div className="mt-6">
              <Button onClick={handleCreateEvent}>
                Create New Event
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>
                      {event.startTime.toLocaleDateString()} at {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{event.eventType}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Description:</strong> {event.description}</p>
                  <p><strong>Location:</strong> {event.location}</p>
                  <p><strong>Duration:</strong> {event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditEvent(event)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Update the event details below.' : 'Fill in the details to create a new event.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="eventType" className="text-right">
                Event Type
              </Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => setFormData({...formData, eventType: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hearing">Hearing</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                End Time
              </Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <Save className="mr-2 h-4 w-4" />
              {editingEvent ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
