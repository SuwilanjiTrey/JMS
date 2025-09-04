// components/CaseTimeline.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Calendar,
    Clock,
    User,
    FileText,
    Gavel,
    ChevronDown,
    ChevronUp,
    MapPin
} from 'lucide-react';
import type {
    Case,
    Hearing,
    CaseStatusHistory,
    CaseProcessStage,
    Ruling
} from '@/models';
import { getAllWhereEquals } from '@/lib/utils/firebase/general';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';

interface TimelineEvent {
    id: string;
    type: 'status_change' | 'hearing' | 'process_stage' | 'ruling';
    title: string;
    description?: string;
    date: Date;
    icon: React.ReactNode;
    color: string;
    metadata?: any;
}

interface CaseTimelineProps {
    caseItem: Case;
    isOpen: boolean;
    onClose: () => void;
}

export default function CaseTimeline({ caseItem, isOpen, onClose }: CaseTimelineProps) {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen && caseItem) {
            loadTimelineData();
        }
    }, [isOpen, caseItem]);

    const loadTimelineData = async () => {
        setLoading(true);
        try {
            // Fetch status history
            const statusHistory = await getAllWhereEquals(
                COLLECTIONS.CASE_STATUS_HISTORY,
                'caseId',
                caseItem.id
            ) as CaseStatusHistory[];

            // Fetch process stages
            const processStages = await getAllWhereEquals(
                COLLECTIONS.CASE_PROCESS_STAGES,
                'caseId',
                caseItem.id
            ) as CaseProcessStage[];

            // Transform data into timeline events
            const timelineEvents: TimelineEvent[] = [];

            // Add case creation event
            timelineEvents.push({
                id: `case-created-${caseItem.id}`,
                type: 'status_change',
                title: 'Case Created',
                description: `Case ${caseItem.caseNumber} was created in the system.`,
                date: caseItem.createdAt,
                icon: <FileText className="w-4 h-4" />,
                color: 'bg-blue-500'
            });

            // Add status changes
            statusHistory.forEach((statusChange) => {
                timelineEvents.push({
                    id: `status-${statusChange.id}`,
                    type: 'status_change',
                    title: `Status Changed to ${statusChange.status}`,
                    description: statusChange.notes || `Case status was updated.`,
                    date: statusChange.changedAt,
                    icon: <Clock className="w-4 h-4" />,
                    color: 'bg-purple-500',
                    metadata: statusChange
                });
            });

            // Add process stages
            processStages.forEach((stage) => {
                let title = '';
                let icon = <FileText className="w-4 h-4" />;

                switch (stage.stage) {
                    case 'filed':
                        title = 'Case Filed';
                        icon = <FileText className="w-4 h-4" />;
                        break;
                    case 'summons':
                        title = 'Summons Issued';
                        icon = <Gavel className="w-4 h-4" />;
                        break;
                    case 'takes_off':
                        title = 'Case Takes Off';
                        icon = <Clock className="w-4 h-4" />;
                        break;
                    case 'recording':
                        title = 'Recording Completed';
                        icon = <FileText className="w-4 h-4" />;
                        break;
                    case 'adjournment':
                        title = 'Case Adjourned';
                        icon = <Clock className="w-4 h-4" />;
                        break;
                    case 'ruling':
                        title = 'Ruling Issued';
                        icon = <Gavel className="w-4 h-4" />;
                        break;
                    case 'appeal':
                        title = 'Appeal Filed';
                        icon = <FileText className="w-4 h-4" />;
                        break;
                }

                timelineEvents.push({
                    id: `stage-${stage.id}`,
                    type: 'process_stage',
                    title,
                    description: stage.notes,
                    date: stage.date,
                    icon,
                    color: 'bg-green-500',
                    metadata: stage
                });
            });

            // Add hearings
            caseItem.hearings.forEach((hearing) => {
                timelineEvents.push({
                    id: `hearing-${hearing.id}`,
                    type: 'hearing',
                    title: `Hearing: ${hearing.purpose}`,
                    description: `Location: ${hearing.location}\nStatus: ${hearing.status}`,
                    date: hearing.date,
                    icon: <MapPin className="w-4 h-4" />,
                    color: 'bg-orange-500',
                    metadata: hearing
                });
            });

            // Add rulings
            caseItem.rulings.forEach((ruling) => {
                timelineEvents.push({
                    id: `ruling-${ruling.id}`,
                    type: 'ruling',
                    title: `Ruling: ${ruling.title}`,
                    description: ruling.content.substring(0, 100) + '...',
                    date: ruling.issuedAt,
                    icon: <Gavel className="w-4 h-4" />,
                    color: 'bg-red-500',
                    metadata: ruling
                });
            });

            // Sort events by date
            timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
            setEvents(timelineEvents);
        } catch (error) {
            console.error('Error loading timeline data:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'status_change': return <Clock className="w-4 h-4" />;
            case 'hearing': return <MapPin className="w-4 h-4" />;
            case 'process_stage': return <FileText className="w-4 h-4" />;
            case 'ruling': return <Gavel className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        Case History - {caseItem.caseNumber}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[70vh] pr-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No history available for this case.
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                            <div className="space-y-6">
                                {events.map((event, index) => (
                                    <div key={event.id} className="relative pl-14">
                                        {/* Timeline dot */}
                                        <div className={`absolute left-5 top-3 w-3 h-3 rounded-full ${event.color} -translate-x-1/2 z-10`}></div>

                                        <Card className="overflow-hidden">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-full ${event.color.replace('bg-', 'bg-')} text-white`}>
                                                            {getEventIcon(event.type)}
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-lg">{event.title}</CardTitle>
                                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                                <Calendar className="w-4 h-4" />
                                                                <span>{formatDate(event.date)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleEventExpansion(event.id)}
                                                    >
                                                        {expandedEvents.has(event.id) ? (
                                                            <ChevronUp className="w-4 h-4" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </CardHeader>

                                            {expandedEvents.has(event.id) && (
                                                <CardContent className="pt-0">
                                                    {event.description && (
                                                        <p className="text-gray-700 mb-3">{event.description}</p>
                                                    )}

                                                    {/* Additional metadata based on event type */}
                                                    {event.type === 'status_change' && event.metadata && (
                                                        <div className="text-sm text-gray-600 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <User className="w-4 h-4" />
                                                                <span>Changed by: {event.metadata.changedBy}</span>
                                                            </div>
                                                            {event.metadata.previousStatus && (
                                                                <div>
                                                                    Previous status: {event.metadata.previousStatus}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {event.type === 'hearing' && event.metadata && (
                                                        <div className="text-sm text-gray-600 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="w-4 h-4" />
                                                                <span>Location: {event.metadata.location}</span>
                                                            </div>
                                                            <div>Judge: {event.metadata.judgeId}</div>
                                                            {event.metadata.outcome && (
                                                                <div>Outcome: {event.metadata.outcome}</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            )}
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}