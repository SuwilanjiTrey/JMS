//admin calendar page

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Clock, MapPin, User, MoreVertical } from 'lucide-react';
import Calendar, { CalendarEvent } from '@/components/exports/HearingCalendar'; // Our reusable Calendar component
import { uploadData, fetchData, deleteData, getAll } from '@/lib/utils/firebase/general';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';
import { Case } from '@/models/Case';

interface Hearing {
  id: string;
  caseId: string;
  caseNumber: string;
  title: string;
  date: string;
  time: string;
  location: string;
  judge: string;
  status: 'scheduled' | 'postponed' | 'completed' | 'cancelled';
  description?: string;
  participants?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  purpose?: string;
}

interface AdminCalendarProps {
  collections?: {
    hearings: string;
    cases: string;
  };
  initialDate?: Date;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  customLocations?: string[];
  customJudges?: string[];
  customPurposes?: string[];
  showActions?: boolean;
  className?: string;
}

// Hearing Form Component
interface HearingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cases: Case[];
  selectedCase: Case | null;
  setSelectedCase: (case_: Case | null) => void;
  newHearing: Partial<Hearing>;
  setNewHearing: (hearing: Partial<Hearing>) => void;
  loadingCases: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  customLocations?: string[];
  customJudges?: string[];
  customPurposes?: string[];
}

function HearingForm({
  open,
  onOpenChange,
  cases,
  selectedCase,
  setSelectedCase,
  newHearing,
  setNewHearing,
  loadingCases,
  onSubmit,
  onCancel,
  customLocations = ["Courtroom 1", "Courtroom 2", "Courtroom 3", "Virtual"],
  customJudges = ["Judge Mwansa", "Judge Phiri", "Judge Tembo", "Judge Banda"],
  customPurposes = ["Initial Hearing", "Pre-trial Conference", "Trial", "Sentencing", "Motion Hearing", "Status Conference", "Settlement Conference", "Bail Hearing", "Other"]
}: HearingFormProps) {
  const activeCases = cases.filter(case_ =>
    case_.status === 'active' || case_.status === 'pending'
  );

  const handleCaseSelect = (caseId: string) => {
    const case_ = cases.find(c => c.id === caseId);
    if (case_) {
      setSelectedCase(case_);
      setNewHearing({
        ...newHearing,
        caseNumber: case_.caseNumber,
        title: case_.title,
        priority: case_.priority
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule New Hearing</DialogTitle>
          <DialogDescription>
            Create a new court hearing appointment
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="case">Select Case *</Label>
            <Select
              value={selectedCase?.id || ''}
              onValueChange={handleCaseSelect}
              disabled={loadingCases}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingCases ? "Loading cases..." : "Select a case"} />
              </SelectTrigger>
              <SelectContent>
                {activeCases.map((case_) => (
                  <SelectItem key={case_.id} value={case_.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{case_.caseNumber}</span>
                      <span className="text-sm text-gray-500 truncate">{case_.title}</span>
                    </div>
                  </SelectItem>
                ))}
                {activeCases.length === 0 && (
                  <SelectItem value="no-cases" disabled>
                    No active cases available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          {selectedCase && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Case Details</h4>
              <div className="space-y-1 text-xs">
                <div><span className="font-medium">Case Number:</span> {selectedCase.caseNumber}</div>
                <div><span className="font-medium">Title:</span> {selectedCase.title}</div>
                <div><span className="font-medium">Type:</span> {selectedCase.type}</div>
                <div><span className="font-medium">Status:</span> {selectedCase.status}</div>
                <div><span className="font-medium">Priority:</span> {selectedCase.priority}</div>
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="caseNumber">Case Number *</Label>
            <Input
              id="caseNumber"
              value={newHearing.caseNumber || ''}
              onChange={(e) => setNewHearing({ ...newHearing, caseNumber: e.target.value })}
              placeholder="e.g., CV-2024-001"
              disabled={!!selectedCase}
            />
          </div>
          <div>
            <Label htmlFor="title">Case Title *</Label>
            <Input
              id="title"
              value={newHearing.title || ''}
              onChange={(e) => setNewHearing({ ...newHearing, title: e.target.value })}
              placeholder="e.g., Smith vs. Johnson"
              disabled={!!selectedCase}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={newHearing.date || ''}
                onChange={(e) => setNewHearing({ ...newHearing, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={newHearing.time || ''}
                onChange={(e) => setNewHearing({ ...newHearing, time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Select value={newHearing.location} onValueChange={(value) => setNewHearing({ ...newHearing, location: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select courtroom" />
              </SelectTrigger>
              <SelectContent>
                {customLocations.map((location) => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="purpose">Purpose</Label>
            <Select value={newHearing.purpose} onValueChange={(value) => setNewHearing({ ...newHearing, purpose: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select hearing purpose" />
              </SelectTrigger>
              <SelectContent>
                {customPurposes.map((purpose) => (
                  <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="judge">Judge</Label>
            <Select value={newHearing.judge} onValueChange={(value) => setNewHearing({ ...newHearing, judge: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select judge" />
              </SelectTrigger>
              <SelectContent>
                {customJudges.map((judge) => (
                  <SelectItem key={judge} value={judge}>{judge}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={newHearing.priority} onValueChange={(value) => setNewHearing({ ...newHearing, priority: value as 'low' | 'medium' | 'high' | 'urgent' })}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newHearing.description || ''}
              onChange={(e) => setNewHearing({ ...newHearing, description: e.target.value })}
              placeholder="Additional notes or details"
              rows={3}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={onSubmit} className="flex-1">
              Create Hearing
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Today's Hearings Component
interface TodaysHearingsProps {
  hearings: Hearing[];
  getStatusColor: (status: string) => string;
}

function TodaysHearings({ hearings, getStatusColor }: TodaysHearingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Hearings</CardTitle>
        <CardDescription>Hearings scheduled for today</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hearings.map((hearing) => (
            <div key={hearing.id} className="border-l-4 border-zambia-orange pl-4 py-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h4 className="font-medium">{hearing.caseNumber}</h4>
                <div className="flex items-center gap-2 mt-1 sm:mt-0">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <Badge variant="outline">{hearing.time}</Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{hearing.title}</p>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {hearing.location}
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {hearing.judge}
                </div>
              </div>
              <Badge className={`mt-2 text-xs ${getStatusColor(hearing.status)}`}>
                {hearing.status}
              </Badge>
            </div>
          ))}
          {hearings.length === 0 && (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No hearings scheduled for today</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Hearing List Component
interface HearingListProps {
  hearings: Hearing[];
  getStatusColor: (status: string) => string;
  onDelete: (id: string) => void;
  onEdit?: (hearing: Hearing) => void;
  onView?: (hearing: Hearing) => void;
  showActions?: boolean;
}

function HearingList({ hearings, getStatusColor, onDelete, onEdit, onView, showActions = true }: HearingListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Hearings</CardTitle>
        <CardDescription>Complete list of scheduled hearings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hearings.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No hearings scheduled</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {hearings.map((hearing) => (
                  <div key={hearing.id} className="border-b last:border-b-0">
                    {/* Mobile view */}
                    <div className="p-4 sm:hidden">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{hearing.caseNumber}</h4>
                          <p className="text-sm text-gray-600 truncate">{hearing.title}</p>
                        </div>
                        {showActions && (
                          <div className="relative">
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-zambia-green font-medium">{hearing.date}</div>
                          <div className="text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {hearing.time}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            {hearing.location}
                          </div>
                          <div className="text-gray-500 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {hearing.judge}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <Badge className={getStatusColor(hearing.status)}>
                          {hearing.status}
                        </Badge>
                        {showActions && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => onView && onView(hearing)}>
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDelete(hearing.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Desktop view */}
                    <div className="hidden sm:flex items-center justify-between p-4 hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-6">
                          <div className="min-w-0">
                            <h4 className="font-medium">{hearing.caseNumber}</h4>
                            <p className="text-sm text-gray-600 truncate">{hearing.title}</p>
                          </div>
                          <div className="text-sm">
                            <div className="text-zambia-green font-medium">{hearing.date}</div>
                            <div className="text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {hearing.time}
                            </div>
                          </div>
                          <div className="text-sm min-w-0">
                            <div className="font-medium flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              {hearing.location}
                            </div>
                            <div className="text-gray-500 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {hearing.judge}
                            </div>
                          </div>
                          <Badge className={getStatusColor(hearing.status)}>
                            {hearing.status}
                          </Badge>
                        </div>
                      </div>
                      {showActions && (
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline" onClick={() => onEdit && onEdit(hearing)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onView && onView(hearing)}>
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDelete(hearing.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminCalendar({
  collections = { hearings: COLLECTIONS.HEARINGS, cases: COLLECTIONS.CASES },
  initialDate,
  onEventClick,
  onDateClick,
  customLocations,
  customJudges,
  customPurposes,
  showActions = true,
  className = ""
}: AdminCalendarProps) {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCases, setLoadingCases] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate || null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [newHearing, setNewHearing] = useState<Partial<Hearing>>({
    status: 'scheduled'
  });

  // Load hearings and cases from Firebase on component mount
  useEffect(() => {
    loadHearings();
    loadCases();
  }, []);

  const loadHearings = async () => {
    try {
      setLoading(true);
      const data = await fetchData(collections.hearings);
      setHearings(data || []);
    } catch (error) {
      console.error('Error loading hearings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCases = async () => {
    try {
      setLoadingCases(true);
      const data = await getAll(collections.cases);
      setCases((data || []) as Case[]);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoadingCases(false);
    }
  };

  // Convert hearings to calendar events
  const calendarEvents: CalendarEvent[] = hearings.map(hearing => {
    const startDateTime = new Date(`${hearing.date}T${hearing.time}`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration
    return {
      id: hearing.id,
      title: hearing.title,
      start: startDateTime,
      end: endDateTime,
      type: 'hearing',
      location: hearing.location,
      caseNumber: hearing.caseNumber,
      priority: hearing.priority || 'medium',
      status: hearing.status as 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
    };
  });

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  // Filter today's hearings
  const todaysHearings = hearings.filter(h => h.date === today);

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setNewHearing({
      ...newHearing,
      date: date.toISOString().split('T')[0]
    });
    setShowScheduleModal(true);
    if (onDateClick) {
      onDateClick(date);
    }
  };

  // Handle calendar event click
  const handleEventClick = (event: CalendarEvent) => {
    // Find the corresponding hearing
    const hearing = hearings.find(h => h.id === event.id);
    if (hearing) {
      console.log('Hearing details:', hearing);
      // You can implement a detailed view modal here
      alert(`Hearing: ${hearing.caseNumber}\n${hearing.title}\nDate: ${hearing.date} at ${hearing.time}\nLocation: ${hearing.location}\nJudge: ${hearing.judge}`);
    }
    if (onEventClick) {
      onEventClick(event);
    }
  };

  // Handle new hearing creation
  const handleCreateHearing = async () => {
    if (!selectedCase) {
      alert('Please select a case first');
      return;
    }
    if (!newHearing.date || !newHearing.time) {
      alert('Please fill in date and time');
      return;
    }
    try {
      const hearingToCreate: Hearing = {
        id: Date.now().toString(),
        caseId: selectedCase?.id || '',
        caseNumber: newHearing.caseNumber!,
        title: newHearing.title!,
        date: newHearing.date!,
        time: newHearing.time!,
        location: newHearing.location || 'TBD',
        judge: newHearing.judge || 'TBD',
        status: newHearing.status as 'scheduled',
        description: newHearing.description,
        participants: newHearing.participants,
        priority: newHearing.priority || 'medium',
        purpose: newHearing.purpose || 'Hearing'
      };
      const success = await uploadData(collections.hearings, hearingToCreate);
      if (success) {
        setHearings([...hearings, hearingToCreate]);
        setShowScheduleModal(false);
        setNewHearing({ status: 'scheduled' });
        setSelectedDate(null);
        setSelectedCase(null);
        alert('Hearing scheduled successfully!');
      } else {
        alert('Failed to create hearing. Please try again.');
      }
    } catch (error) {
      console.error('Error creating hearing:', error);
      alert('An error occurred while creating the hearing.');
    }
  };

  // Handle hearing deletion
  const handleDeleteHearing = async (hearingId: string) => {
    if (!confirm('Are you sure you want to delete this hearing?')) return;
    try {
      const result = await deleteData(collections.hearings, hearingId);
      if (result.success) {
        setHearings(hearings.filter(h => h.id !== hearingId));
      } else {
        alert('Failed to delete hearing: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting hearing:', error);
      alert('An error occurred while deleting the hearing.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'postponed':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`container mx-auto p-4 sm:p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading calendar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto p-4 sm:p-6 space-y-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zambia-black">Court Calendar</h1>
          <p className="text-zambia-black/70">Manage court schedules and hearings</p>
        </div>
        <Button 
          className="bg-zambia-orange hover:bg-zambia-orange/90 w-full sm:w-auto"
          onClick={() => setShowScheduleModal(true)}
        >
          Schedule Hearing
        </Button>
      </div>
      
      <HearingForm
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        cases={cases}
        selectedCase={selectedCase}
        setSelectedCase={setSelectedCase}
        newHearing={newHearing}
        setNewHearing={setNewHearing}
        loadingCases={loadingCases}
        onSubmit={handleCreateHearing}
        onCancel={() => {
          setShowScheduleModal(false);
          setNewHearing({ status: 'scheduled' });
          setSelectedDate(null);
          setSelectedCase(null);
        }}
        customLocations={customLocations}
        customJudges={customJudges}
        customPurposes={customPurposes}
      />
      
      {/* Calendar Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Calendar
            events={calendarEvents}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
            onEventCreate={handleDateClick}
            title="Calendar View"
            description="Monthly calendar with hearings"
            showCreateButton={false}
          />
        </div>
        <div>
          <TodaysHearings 
            hearings={todaysHearings} 
            getStatusColor={getStatusColor} 
          />
        </div>
      </div>
      
      {/* Upcoming Hearings */}
      <HearingList 
        hearings={hearings}
        getStatusColor={getStatusColor}
        onDelete={handleDeleteHearing}
        showActions={showActions}
      />
    </div>
  );
}
