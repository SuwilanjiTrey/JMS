import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Calendar,
    Clock,
    FileText,
    Gavel,
    RefreshCw,
    Users,
    MessageSquare,
    UserPlus,
    Eye,
    Filter,
    Download,
    ChevronDown,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    Loader2,
    Bell,
    Play,
    Mic,
    Pause,
    ArrowUp,
    X
} from 'lucide-react';

// Types for the timeline
interface TimelineEvent {
    id: string;
    type: 'status_change' | 'hearing' | 'document_upload' | 'ruling' | 'assignment' | 'note' | 'party_change';
    title: string;
    description: string;
    date: Date;
    createdBy: string;
    metadata?: {
        previousStatus?: string;
        newStatus?: string;
        documentType?: string;
        hearingType?: string;
        assignedTo?: string;
        [key: string]: any;
    };
}

interface CaseHistoryTimelineProps {
    isOpen: boolean;
    onClose: () => void;
    caseId: string;
    caseNumber: string;
    caseTitle: string;
}

const eventTypeConfig = {
    status_change: {
        icon: RefreshCw,
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        label: 'Status Change'
    },
    hearing: {
        icon: Calendar,
        color: 'bg-green-500',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        label: 'Hearing'
    },
    document_upload: {
        icon: FileText,
        color: 'bg-purple-500',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
        label: 'Document'
    },
    ruling: {
        icon: Gavel,
        color: 'bg-orange-500',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200',
        label: 'Ruling'
    },
    assignment: {
        icon: Users,
        color: 'bg-cyan-500',
        bgColor: 'bg-cyan-50',
        textColor: 'text-cyan-700',
        borderColor: 'border-cyan-200',
        label: 'Assignment'
    },
    note: {
        icon: MessageSquare,
        color: 'bg-gray-500',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200',
        label: 'Note'
    },
    party_change: {
        icon: UserPlus,
        color: 'bg-indigo-500',
        bgColor: 'bg-indigo-50',
        textColor: 'text-indigo-700',
        borderColor: 'border-indigo-200',
        label: 'Party Change'
    }
};

const statusChangeConfig = {
    filed: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
    summons: { icon: Bell, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    takes_off: { icon: Play, color: 'text-cyan-600', bg: 'bg-cyan-100' },
    recording: { icon: Mic, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    adjournment: { icon: Pause, color: 'text-orange-600', bg: 'bg-orange-100' },
    ruling: { icon: Gavel, color: 'text-purple-600', bg: 'bg-purple-100' },
    appeal: { icon: ArrowUp, color: 'text-pink-600', bg: 'bg-pink-100' },
    closed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    dismissed: { icon: X, color: 'text-red-600', bg: 'bg-red-100' }
};

export default function CaseHistoryTimeline({
    isOpen,
    onClose,
    caseId,
    caseNumber,
    caseTitle
}: CaseHistoryTimelineProps) {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<string>('all');
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

    // Mock data - replace with actual API call
    useEffect(() => {
        if (isOpen && caseId) {
            loadCaseHistory();
        }
    }, [isOpen, caseId]);

    const loadCaseHistory = async () => {
        setLoading(true);
        setError(null);

        try {
            // Mock timeline events - replace with actual API call
            const mockEvents: TimelineEvent[] = [
                {
                    id: '1',
                    type: 'status_change',
                    title: 'Case Filed',
                    description: 'Case was initially filed in the system',
                    date: new Date('2024-01-15T09:00:00'),
                    createdBy: 'System',
                    metadata: { newStatus: 'filed' }
                },
                {
                    id: '2',
                    type: 'document_upload',
                    title: 'Initial Pleading Uploaded',
                    description: 'Plaintiff submitted initial pleading documents',
                    date: new Date('2024-01-15T10:30:00'),
                    createdBy: 'John Smith',
                    metadata: { documentType: 'pleading', fileName: 'initial_pleading.pdf' }
                },
                {
                    id: '3',
                    type: 'status_change',
                    title: 'Summons Issued',
                    description: 'Court issued summons to defendants',
                    date: new Date('2024-01-20T14:00:00'),
                    createdBy: 'Court Clerk',
                    metadata: { previousStatus: 'filed', newStatus: 'summons' }
                },
                {
                    id: '4',
                    type: 'assignment',
                    title: 'Judge Assigned',
                    description: 'Judge Mary Johnson assigned to the case',
                    date: new Date('2024-01-22T11:00:00'),
                    createdBy: 'Court Administrator',
                    metadata: { assignedTo: 'Judge Mary Johnson' }
                },
                {
                    id: '5',
                    type: 'document_upload',
                    title: 'Defense Response Filed',
                    description: 'Defendant submitted response to initial pleading',
                    date: new Date('2024-02-05T16:15:00'),
                    createdBy: 'Jane Doe',
                    metadata: { documentType: 'response', fileName: 'defense_response.pdf' }
                },
                {
                    id: '6',
                    type: 'status_change',
                    title: 'Case Takes Off',
                    description: 'Case officially commenced proceedings',
                    date: new Date('2024-02-10T09:30:00'),
                    createdBy: 'Judge Mary Johnson',
                    metadata: { previousStatus: 'summons', newStatus: 'takes_off' }
                },
                {
                    id: '7',
                    type: 'hearing',
                    title: 'Pre-Trial Conference',
                    description: 'Initial pre-trial conference held to discuss case management',
                    date: new Date('2024-02-15T10:00:00'),
                    createdBy: 'Court Clerk',
                    metadata: { hearingType: 'pre-trial', location: 'Courtroom 3A', duration: '2 hours' }
                },
                {
                    id: '8',
                    type: 'status_change',
                    title: 'Recording Stage',
                    description: 'Case moved to recording stage for documentation',
                    date: new Date('2024-02-20T13:00:00'),
                    createdBy: 'Judge Mary Johnson',
                    metadata: { previousStatus: 'takes_off', newStatus: 'recording' }
                },
                {
                    id: '9',
                    type: 'note',
                    title: 'Case Management Note',
                    description: 'Additional evidence discovery period granted',
                    date: new Date('2024-02-25T15:30:00'),
                    createdBy: 'Judge Mary Johnson',
                    metadata: { noteType: 'case_management', priority: 'medium' }
                },
                {
                    id: '10',
                    type: 'hearing',
                    title: 'Main Hearing Scheduled',
                    description: 'Primary hearing scheduled for case proceedings',
                    date: new Date('2024-03-01T09:00:00'),
                    createdBy: 'Court Clerk',
                    metadata: { hearingType: 'main', location: 'Courtroom 1', scheduledFor: '2024-03-15T10:00:00' }
                }
            ];

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            setEvents(mockEvents);
        } catch (err) {
            setError('Failed to load case history');
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(event =>
        filterType === 'all' || event.type === filterType
    );

    const toggleEventExpansion = (eventId: string) => {
        const newExpanded = new Set(expandedEvents);
        if (newExpanded.has(eventId)) {
            newExpanded.delete(eventId);
        } else {
            newExpanded.add(eventId);
        }
        setExpandedEvents(newExpanded);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const groupEventsByDate = (events: TimelineEvent[]) => {
        const groups: { [key: string]: TimelineEvent[] } = {};

        events.forEach(event => {
            const dateKey = event.date.toDateString();
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(event);
        });

        return Object.entries(groups).sort(([a], [b]) =>
            new Date(b).getTime() - new Date(a).getTime()
        );
    };

    const TimelineEvent = ({ event, isLast }: { event: TimelineEvent; isLast: boolean }) => {
        const config = eventTypeConfig[event.type];
        const IconComponent = config.icon;
        const isExpanded = expandedEvents.has(event.id);

        return (
            <div className="relative flex gap-4 pb-8">
                {/* Timeline line */}
                {!isLast && (
                    <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200" />
                )}

                {/* Event icon */}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${config.color} flex-shrink-0`}>
                    <IconComponent className="w-5 h-5 text-white" />
                </div>

                {/* Event content */}
                <div className="flex-1 min-w-0">
                    <Card className={`${config.borderColor} border-l-4`}>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold text-gray-900 truncate">{event.title}</h4>
                                        <Badge variant="outline" className={`${config.bgColor} ${config.textColor} text-xs`}>
                                            {config.label}
                                        </Badge>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>

                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(event.date)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {event.createdBy}
                                        </div>
                                    </div>

                                    {/* Expandable metadata */}
                                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                                        <div className="mt-3">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleEventExpansion(event.id)}
                                                className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="w-3 h-3 mr-1" />
                                                ) : (
                                                    <ChevronRight className="w-3 h-3 mr-1" />
                                                )}
                                                {isExpanded ? 'Hide details' : 'Show details'}
                                            </Button>

                                            {isExpanded && (
                                                <div className={`mt-2 p-3 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {Object.entries(event.metadata).map(([key, value]) => (
                                                            <div key={key} className="flex justify-between text-xs">
                                                                <span className="font-medium capitalize">
                                                                    {key.replace(/_/g, ' ')}:
                                                                </span>
                                                                <span className="text-gray-600 truncate ml-2">
                                                                    {String(value)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <div className="space-y-2">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Case History Timeline
                        </DialogTitle>
                        <DialogDescription className="space-y-1">
                            <div className="font-medium text-gray-900">{caseNumber}</div>
                            <div className="text-sm text-gray-600 line-clamp-1">{caseTitle}</div>
                        </DialogDescription>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        <div className="flex items-center gap-2 flex-1">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="flex-1 sm:flex-initial px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Events</option>
                                <option value="status_change">Status Changes</option>
                                <option value="hearing">Hearings</option>
                                <option value="document_upload">Documents</option>
                                <option value="ruling">Rulings</option>
                                <option value="assignment">Assignments</option>
                                <option value="note">Notes</option>
                                <option value="party_change">Party Changes</option>
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Download className="w-4 h-4" />
                                Export
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2" onClick={loadCaseHistory}>
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Timeline Content */}
                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="p-6">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                                    <p className="text-gray-600">Loading case history...</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
                                    <p className="text-red-600 font-medium mb-2">Error Loading History</p>
                                    <p className="text-gray-600 text-sm">{error}</p>
                                    <Button variant="outline" onClick={loadCaseHistory} className="mt-4">
                                        Try Again
                                    </Button>
                                </div>
                            ) : filteredEvents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Clock className="w-8 h-8 text-gray-400 mb-4" />
                                    <p className="text-gray-600 font-medium mb-2">No Events Found</p>
                                    <p className="text-gray-500 text-sm">
                                        {filterType === 'all'
                                            ? 'No events have been recorded for this case yet.'
                                            : `No ${filterType.replace(/_/g, ' ')} events found.`
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {groupEventsByDate(filteredEvents).map(([dateKey, dayEvents], groupIndex) => (
                                        <div key={dateKey}>
                                            {/* Date header */}
                                            <div className="flex items-center gap-4 mb-6">
                                                <Separator className="flex-1" />
                                                <div className="px-3 py-1 bg-gray-100 rounded-full">
                                                    <span className="text-sm font-medium text-gray-600">
                                                        {new Date(dateKey).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <Separator className="flex-1" />
                                            </div>

                                            {/* Events for this date */}
                                            <div className="space-y-0">
                                                {dayEvents
                                                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                                                    .map((event, eventIndex) => (
                                                        <TimelineEvent
                                                            key={event.id}
                                                            event={event}
                                                            isLast={groupIndex === groupEventsByDate(filteredEvents).length - 1 &&
                                                                eventIndex === dayEvents.length - 1}
                                                        />
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    ))}

                                    {/* Timeline end */}
                                    <div className="flex items-center justify-center pt-8">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <span className="text-sm text-gray-600">Timeline complete</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}