'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, FileText, MoreHorizontal, Eye, Edit } from 'lucide-react';
import { Case, CaseStatus, CasePriority, CaseType } from '@/models';
import { format } from 'date-fns';

interface CaseCardProps {
  caseData: Case;
  onView?: (caseId: string) => void;
  onEdit?: (caseId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export default function CaseCard({ 
  caseData, 
  onView, 
  onEdit, 
  showActions = true, 
  compact = false 
}: CaseCardProps) {
  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'appealed':
        return 'bg-purple-100 text-purple-800';
      case 'dismissed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: CasePriority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: CaseType) => {
    // You can add specific icons for different case types
    return <FileText className="h-4 w-4" />;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Not set';
    return format(date, 'MMM dd, yyyy');
  };

  if (compact) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{caseData.caseNumber}</CardTitle>
            <div className="flex gap-1">
              <Badge className={getStatusColor(caseData.status)}>
                {caseData.status}
              </Badge>
              <Badge className={getPriorityColor(caseData.priority)}>
                {caseData.priority}
              </Badge>
            </div>
          </div>
          <CardDescription className="truncate">{caseData.title}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(caseData.createdAt)}
              </span>
              {caseData.nextHearingDate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(caseData.nextHearingDate)}
                </span>
              )}
            </div>
            {showActions && (
              <div className="flex gap-1">
                {onView && (
                  <Button size="sm" variant="ghost" onClick={() => onView(caseData.id)}>
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
                {onEdit && (
                  <Button size="sm" variant="ghost" onClick={() => onEdit(caseData.id)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTypeIcon(caseData.type)}
            <CardTitle className="text-lg">{caseData.caseNumber}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(caseData.status)}>
              {caseData.status}
            </Badge>
            <Badge className={getPriorityColor(caseData.priority)}>
              {caseData.priority}
            </Badge>
          </div>
        </div>
        <CardDescription>{caseData.title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Case Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium capitalize">{caseData.type}</span>
            </div>
            <div>
              <span className="text-gray-600">Created:</span>
              <span className="ml-2 font-medium">{formatDate(caseData.createdAt)}</span>
            </div>
            {caseData.assignedTo && (
              <div>
                <span className="text-gray-600">Assigned to:</span>
                <span className="ml-2 font-medium">{caseData.assignedTo}</span>
              </div>
            )}
            {caseData.nextHearingDate && (
              <div>
                <span className="text-gray-600">Next Hearing:</span>
                <span className="ml-2 font-medium">{formatDate(caseData.nextHearingDate)}</span>
              </div>
            )}
          </div>

          {/* Parties Involved */}
          <div>
            <span className="text-sm text-gray-600">Parties:</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {caseData.plaintiffs.slice(0, 2).map((plaintiff) => (
                <Badge key={plaintiff.id} variant="outline" className="text-xs">
                  {plaintiff.name} (P)
                </Badge>
              ))}
              {caseData.defendants.slice(0, 2).map((defendant) => (
                <Badge key={defendant.id} variant="outline" className="text-xs">
                  {defendant.name} (D)
                </Badge>
              ))}
              {(caseData.plaintiffs.length > 2 || caseData.defendants.length > 2) && (
                <Badge variant="outline" className="text-xs">
                  +{caseData.plaintiffs.length + caseData.defendants.length - 4} more
                </Badge>
              )}
            </div>
          </div>

          {/* Tags */}
          {caseData.tags.length > 0 && (
            <div>
              <span className="text-sm text-gray-600">Tags:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {caseData.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {caseData.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{caseData.tags.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 pt-2">
              {onView && (
                <Button size="sm" variant="outline" className="flex-1" onClick={() => onView(caseData.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              )}
              {onEdit && (
                <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(caseData.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}