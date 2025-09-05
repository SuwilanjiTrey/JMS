'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  ArrowLeft,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  MapPin
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/models';
import { 
  getAllCourts,
  createCalendarEvent,
  getUsersByRole
} from '@/lib/auth';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  courtId: string;
  judgeId?: string;
  caseId?: string;
  startTime: Date;
  endTime: Date;
  location: string;
  eventType: 'hearing' | 'trial' | 'meeting' | 'other';
  createdAt: Date;
}

interface Judge {
  id: string;
  displayName: string;
  email: string;
}

interface Court {
  id: string;
  name: string;
  type: string;
  location: string;
}

export default function CalendarManagementPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courtId = searchParams.get('courtId');
  
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    judgeId: '',
    caseId: '',
    startTime: '',
    endTime: '',
    location: '',
    eventType: 'hearing' as 'hearing' | 'trial' | 'meeting' | 'other'
  });

  // Check if user has permission
  useEffect(() => {
  
    const allowedRoles = [
    // Admin roles
    'admin',
    'super-admin',
    'court-admin',
    
    // All court type roles
    'supreme-court',
    'constitutional-court', 
    'high-court',
    'subordinate-magistrate',
    'local-courts',
    'specialized-tribunals',
    'small-claims',
    
    // Judge role should also have access
    'judge'
  ];
  
  
   if (!loading && userRole) {
    if (!allowedRoles.includes(userRole)) {
      console.log('Courts page - User not authorized, redirecting:', userRole);
      router.push('/unauthorized');
    } else {
      console.log('Courts page - User authorized:', userRole);
    }
  }
}, [userRole, loading, router]); // Add loading to dependencies

  // Fetch courts
  useEffect(() => {
    fetchData();
  }, [courtId]);

  // Filter events based on search term
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  }, [searchTerm, events]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all courts
      const courtsData = await getAllCourts();
      setCourts(courtsData);

      // If courtId is provided, set it as selected
      if (courtId) {
        const court = courtsData.find(c => c.id === courtId);
        if (court) {
          setSelectedCourt(court);
          
          // Mock events data - replace with actual API call
          const mockEvents: CalendarEvent[] = [
            {
              id: '1',
              title: 'Case Hearing',
              description: 'Preliminary hearing for case CN-2023-001',
              courtId: courtId,
              startTime: new Date('2023-06-15T10:00:00'),
              endTime: new Date('2023-06-15T12:00:00'),
              location: court.location,
              eventType: 'hearing' as const,
              createdAt: new Date('2023-06-01'),
              judgeId: 'judge-1',
              caseId: 'case-123'
            },
            {
              id: '2',
              title: 'Trial Session',
              description: 'Main trial session for case CN-2023-002',
              courtId: courtId,
              startTime: new Date('2023-06-20T09:00:00'),
              endTime: new Date('2023-06-20T17:00:00'),
              location: court.location,
              eventType: 'trial' as const,
              createdAt: new Date('2023-06-05'),
              judgeId: 'judge-2',
              caseId: 'case-456'
            }
          ];
          
          setEvents(mockEvents);
          setFilteredEvents(mockEvents);
        }
      }

      // Fetch all judges
      const judgesData = await getUsersByRole('judge');
      setJudges(judgesData);

      // Mock cases data - replace with actual API call
      const mockCases = [
        { id: 'case-123', title: 'Case 1', caseNumber: 'CN-2023-001' },
        { id: 'case-456', title: 'Case 2', caseNumber: 'CN-2023-002' }
      ];
      setCases(mockCases);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Create new calendar event
      await createCalendarEvent({
        ...formData,
        courtId: selectedCourt?.id || '',
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime)
      });

      setSuccess('Event created successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error creating event:', error);
      setError(error.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCourtChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const courtIdValue = e.target.value;
    if (courtIdValue) {
      router.push(`/courts/calendarman?courtId=${courtIdValue}`);
    } else {
      router.push('/courts/calendarman');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      judgeId: '',
      caseId: '',
      startTime: '',
      endTime: '',
      location: selectedCourt?.location || '',
      eventType: 'hearing'
    });
    setError('');
  };

  const openDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'hearing': return 'bg-blue-100 text-blue-800';
      case 'trial': return 'bg-purple-100 text-purple-800';
      case 'meeting': return 'bg-green-100 text-green-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-orange-500" />
          <p className="mt-4 text-gray-600">Loading calendar management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/courts')}
          className="mb-4"
        >
          ← Back to Courts
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar Management</h1>
            <p className="text-gray-600 mt-2">
              {selectedCourt ? `Manage calendar for ${selectedCourt.name}` : 'Select a court to manage its calendar'}
            </p>
          </div>
          <Button onClick={openDialog} className="bg-orange-500 hover:bg-orange-600" disabled={!selectedCourt}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Court Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Label htmlFor="courtSelect" className="font-medium">
              Select Court:
            </Label>
            <select
              id="courtSelect"
              value={courtId || ''}
              onChange={handleCourtChange}
              className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">-- Choose a court --</option>
              {courts.map(court => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search events by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={!selectedCourt}
          />
        </div>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>
            {selectedCourt 
              ? `${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''} found for ${selectedCourt.name}`
              : 'Select a court to view its events'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedCourt ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">Please select a court to manage its events</div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No upcoming events
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => {
                const assignedJudge = judges.find(j => j.id === event.judgeId);
                const relatedCase = cases.find(c => c.id === event.caseId);
                
                return (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-gray-500">{event.description}</div>
                          </div>
                        </div>
                        
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                            <span>
                              {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                            <span>{event.location}</span>
                          </div>
                          
                          {assignedJudge && (
                            <div className="flex items-center text-sm">
                              <span className="font-medium">Judge:</span>
                              <span className="ml-2">{assignedJudge.displayName}</span>
                            </div>
                          )}
                          
                          {relatedCase && (
                            <div className="flex items-center text-sm">
                              <span className="font-medium">Case:</span>
                              <span className="ml-2">{relatedCase.title} ({relatedCase.caseNumber})</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getEventTypeColor(event.eventType)}>
                          {event.eventType}
                        </Badge>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Create a new calendar event for {selectedCourt?.name}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter event title"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter event description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) => setFormData({...formData, eventType: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hearing">Hearing</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Enter event location"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="judgeId">Assign Judge</Label>
                  <Select
                    value={formData.judgeId}
                    onValueChange={(value) => setFormData({...formData, judgeId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a judge" />
                    </SelectTrigger>
                    <SelectContent>
                      {judges.map(judge => (
                        <SelectItem key={judge.id} value={judge.id}>
                          {judge.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="caseId">Related Case</Label>
                  <Select
                    value={formData.caseId}
                    onValueChange={(value) => setFormData({...formData, caseId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a case" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases.map(caseItem => (
                        <SelectItem key={caseItem.id} value={caseItem.id}>
                          {caseItem.title} ({caseItem.caseNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Add Event'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
