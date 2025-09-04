import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Edit2,
  Clock,
  Users,
  Calendar,
  FileText,
  MoreHorizontal,
  History,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import CaseHistoryTimeline from './CaseHistoryTimeline';

// Import types and constants
type Case = {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  type: 'civil' | 'criminal' | 'family' | 'commercial' | 'constitutional' | 'other';
  status: 'filed' | 'summons' | 'takes_off' | 'recording' | 'adjournment' | 'ruling' | 'appeal' | 'closed' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
  nextHearingDate?: Date;
  plaintiffs: Array<{ id: string; name: string; type: string }>;
  defendants: Array<{ id: string; name: string; type: string }>;
  hearings: Array<any>;
  documents: Array<any>;
  estimatedDuration?: number;
};

const CASE_STATUS_COLORS = {
  filed: 'bg-blue-100 text-blue-800',
  summons: 'bg-indigo-100 text-indigo-800',
  takes_off: 'bg-cyan-100 text-cyan-800',
  recording: 'bg-yellow-100 text-yellow-800',
  adjournment: 'bg-orange-100 text-orange-800',
  ruling: 'bg-purple-100 text-purple-800',
  appeal: 'bg-pink-100 text-pink-800',
  closed: 'bg-green-100 text-green-800',
  dismissed: 'bg-red-100 text-red-800'
};

const CASE_STATUS_LABELS = {
  filed: 'Case Filed',
  summons: 'Summons Issued',
  takes_off: 'Case Takes Off',
  recording: 'Recording Stage',
  adjournment: 'Adjournment',
  ruling: 'Ruling',
  appeal: 'Appeal',
  closed: 'Closed',
  dismissed: 'Dismissed'
};

const CASE_PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const CASE_TYPE_LABELS = {
  civil: 'Civil',
  criminal: 'Criminal',
  family: 'Family',
  commercial: 'Commercial',
  constitutional: 'Constitutional',
  other: 'Other'
};

interface CaseCardProps {
  caseItem: Case;
  onView: (caseItem: Case) => void;
  onEdit: (caseItem: Case) => void;
  onStatusUpdate: (caseId: string, newStatus: Case['status']) => void;
  submitting: boolean;
  config: {
    enableCaseViewing: boolean;
    enableCaseEditing: boolean;
    enableStatusUpdates: boolean;
    showCaseHistory: boolean;
  };
  customActions?: Array<{
    label: string;
    icon: any;
    onClick: (caseItem: Case) => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  }>;
}

export default function CaseCard({
  caseItem,
  onView,
  onEdit,
  onStatusUpdate,
  submitting,
  config,
  customActions = []
}: CaseCardProps) {
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(d);
  };

  const getTimeAgo = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - d.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const isOverdue = (date?: Date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <>
      <Card className="h-full hover:shadow-md transition-shadow duration-200 border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs font-mono shrink-0">
                  {caseItem.caseNumber}
                </Badge>
                <Badge className={`text-xs ${CASE_STATUS_COLORS[caseItem.status]} shrink-0`}>
                  {CASE_STATUS_LABELS[caseItem.status]}
                </Badge>
              </div>
              <CardTitle className="text-base sm:text-lg leading-tight line-clamp-2">
                {caseItem.title}
              </CardTitle>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {config.enableCaseViewing && (
                  <DropdownMenuItem onClick={() => onView(caseItem)} className="gap-2">
                    <Eye className="h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                )}

                {config.enableCaseEditing && (
                  <DropdownMenuItem onClick={() => onEdit(caseItem)} className="gap-2">
                    <Edit2 className="h-4 w-4" />
                    Edit Case
                  </DropdownMenuItem>
                )}

                {config.showCaseHistory && (
                  <DropdownMenuItem onClick={() => setShowHistoryDialog(true)} className="gap-2">
                    <History className="h-4 w-4" />
                    Case History
                  </DropdownMenuItem>
                )}

                {customActions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => action.onClick(caseItem)}
                    className="gap-2"
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <CardDescription className="text-sm line-clamp-2 mb-3">
            {caseItem.description}
          </CardDescription>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {CASE_TYPE_LABELS[caseItem.type]}
            </Badge>
            <Badge className={`text-xs ${CASE_PRIORITY_COLORS[caseItem.priority]}`}>
              {caseItem.priority.charAt(0).toUpperCase() + caseItem.priority.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Case Statistics */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {caseItem.plaintiffs.length + caseItem.defendants.length} parties
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{caseItem.documents?.length || 0} docs</span>
            </div>
          </div>

          {/* Next Hearing */}
          {caseItem.nextHearingDate && (
            <div className={`p-2.5 rounded-lg border ${isOverdue(caseItem.nextHearingDate)
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium">
                    {isOverdue(caseItem.nextHearingDate) ? 'Overdue Hearing' : 'Next Hearing'}
                  </div>
                  <div className="text-xs truncate">
                    {formatDate(caseItem.nextHearingDate)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Case Timeline Info */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Created {getTimeAgo(caseItem.createdAt)}</span>
              </div>
              {caseItem.estimatedDuration && (
                <span>{caseItem.estimatedDuration} days est.</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {config.enableCaseViewing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(caseItem)}
                className="flex-1 gap-2"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View</span>
              </Button>
            )}

            {config.showCaseHistory && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistoryDialog(true)}
                className="flex-1 gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">History</span>
              </Button>
            )}

            {config.enableCaseEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(caseItem)}
                className="flex-1 gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Edit2 className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}
          </div>

          {/* Quick Status Update */}
          {config.enableStatusUpdates && (
            <div className="pt-2 border-t">
              <div className="text-xs text-gray-500 mb-2">Quick Status Update:</div>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStatusUpdate(caseItem.id, 'adjournment')}
                  disabled={submitting || caseItem.status === 'adjournment'}
                  className="text-xs py-1 h-auto"
                >
                  Adjourn
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStatusUpdate(caseItem.id, 'ruling')}
                  disabled={submitting || caseItem.status === 'ruling'}
                  className="text-xs py-1 h-auto"
                >
                  Rule
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Case History Timeline Dialog */}
      {config.showCaseHistory && (
        <CaseHistoryTimeline
          isOpen={showHistoryDialog}
          onClose={() => setShowHistoryDialog(false)}
          caseId={caseItem.id}
          caseNumber={caseItem.caseNumber}
          caseTitle={caseItem.title}
        />
      )}
    </>
  );
}