//cases module - Mobile-friendly and Modular
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Clock,
  Users,
  Calendar,
  FileText,
  Gavel,
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2,
  Filter,
  MoreVertical,
  History,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CASE_STATUS_COLORS, CASE_PRIORITY_COLORS, CASE_TYPE_LABELS } from '@/models';
import type { Case, CaseCreationData, CaseStatus, CasePriority, CaseType, CaseParty } from '@/models';
import {
  uploadData,
  setDetails,
  getAll,
  deleteData
} from '@/lib/utils/firebase/general';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';
// Import case history timeline component
import CaseHistoryTimeline from '../CaseHistoryTimeline';
// Configuration interface for customization
interface CasesModuleConfig {
  enableFilters?: boolean;
  enableSearch?: boolean;
  enableCaseCreation?: boolean;
  enableCaseEditing?: boolean;
  enableStatusUpdate?: boolean;
  enableCaseDeletion?: boolean;
  cardLayoutColumns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  showCaseNumbers?: boolean;
  showCaseMetrics?: boolean;
  customTitle?: string;
  customDescription?: string;
  showCaseHistory?: boolean;
  enableCaseViewing?: boolean;
  enableStatusUpdates?: boolean;
}
interface CasesModuleProps {
  config?: CasesModuleConfig;
  onCaseSelect?: (caseItem: Case) => void;
  onCaseCreate?: (caseItem: Case) => void;
  onCaseUpdate?: (caseItem: Case) => void;
  onCaseDelete?: (caseId: string) => void;
  initialFilters?: {
    status?: string;
    priority?: string;
    type?: string;
  };
  customActions?: Array<{
    label: string;
    icon?: React.ComponentType<any>;
    action: (caseItem: Case) => void;
    variant?: 'default' | 'outline' | 'destructive';
  }>;
}
// Default configuration
export const defaultConfig: CasesModuleConfig = {
  enableFilters: true,
  enableSearch: true,
  enableCaseCreation: true,
  enableCaseEditing: true,
  enableStatusUpdate: true,
  enableCaseDeletion: false,
  cardLayoutColumns: {
    mobile: 1,
    tablet: 2,
    desktop: 3
  },
  showCaseNumbers: true,
  showCaseMetrics: true,
  customTitle: 'Case Management',
  customDescription: 'Manage all cases in the system',
  showCaseHistory: true,
  enableCaseViewing: true,
  enableStatusUpdates: true,
};
// Additional case status colors and labels for history integration
const CASE_STATUS_LABELS = {
  draft: 'Draft',
  active: 'Active',
  pending: 'Pending',
  closed: 'Closed',
  appealed: 'Appealed',
  dismissed: 'Dismissed',
  filed: 'Case Filed',
  summons: 'Summons Issued',
  takes_off: 'Case Takes Off',
  recording: 'Recording Stage',
  adjournment: 'Adjournment',
  ruling: 'Ruling',
  appeal: 'Appeal'
};
// Mobile-optimized Filter Panel Component
const MobileFilterPanel = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  typeFilter,
  setTypeFilter,
  isOpen,
  setIsOpen
}: any) => {
  const [localFilters, setLocalFilters] = useState({
    status: statusFilter,
    priority: priorityFilter,
    type: typeFilter
  });
  const applyFilters = () => {
    setStatusFilter(localFilters.status);
    setPriorityFilter(localFilters.priority);
    setTypeFilter(localFilters.type);
    setIsOpen(false);
  };
  const clearFilters = () => {
    const cleared = { status: 'all', priority: 'all', type: 'all' };
    setLocalFilters(cleared);
    setStatusFilter('all');
    setPriorityFilter('all');
    setTypeFilter('all');
    setIsOpen(false);
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Cases</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={localFilters.status} onValueChange={(value) =>
              setLocalFilters(prev => ({ ...prev, status: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="appealed">Appealed</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={localFilters.priority} onValueChange={(value) =>
              setLocalFilters(prev => ({ ...prev, priority: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={localFilters.type} onValueChange={(value) =>
              setLocalFilters(prev => ({ ...prev, type: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(CASE_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={clearFilters} className="flex-1">
              Clear
            </Button>
            <Button onClick={applyFilters} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Enhanced Mobile-optimized Case Card Component with Case History Integration
const CaseCard = ({
  caseItem,
  onView,
  onEdit,
  onStatusUpdate,
  onViewHistory,  
  submitting,
  config,
  customActions = []
}: {
  caseItem: Case;
  onView: (caseItem: Case) => void;
  onEdit: (caseItem: Case) => void;
  onStatusUpdate: (caseId: string, status: CaseStatus) => void;
  onViewHistory: (caseItem: Case) => void;
  submitting: boolean;
  config: CasesModuleConfig;
  customActions?: Array<{
    label: string;
    icon?: React.ComponentType<any>;
    action: (caseItem: Case) => void;
    variant?: 'default' | 'outline' | 'destructive';
  }>;
}) => {
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  // Helper functions from the history integration
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
      <Card className="hover:shadow-md transition-all duration-200 bg-white border-l-4 border-l-blue-500">
        <CardHeader className="pb-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {config.showCaseNumbers && (
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs font-mono shrink-0">
                    {caseItem.caseNumber}
                  </Badge>
                  <Badge className={`text-xs ${CASE_STATUS_COLORS[caseItem.status]} shrink-0`}>
                    {CASE_STATUS_LABELS[caseItem.status] || caseItem.status}
                  </Badge>
                </div>
              )}
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 truncate leading-tight line-clamp-2">
                {caseItem.title}
              </CardTitle>
              <CardDescription className="text-sm line-clamp-2 mt-1">
                {caseItem.description || 'No description available'}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <Badge className={`text-xs ${CASE_PRIORITY_COLORS[caseItem.priority]} whitespace-nowrap`}>
                {caseItem.priority}
              </Badge>
            </div>
          </div>
          {/* Case Type Badge */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {CASE_TYPE_LABELS[caseItem.type]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Case Metrics - Mobile Optimized */}
          {config.showCaseMetrics && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1 p-2 bg-gray-50 rounded">
                <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 truncate">Type:</span>
                <span className="font-medium truncate">{CASE_TYPE_LABELS[caseItem.type]}</span>
              </div>
              <div className="flex items-center gap-1 p-2 bg-gray-50 rounded">
                <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 truncate">Created:</span>
                <span className="font-medium truncate">
                  {new Date(caseItem.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1 p-2 bg-gray-50 rounded">
                <Users className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 truncate">Parties:</span>
                <span className="font-medium">
                  {caseItem.plaintiffs.length + caseItem.defendants.length}
                </span>
              </div>
              <div className="flex items-center gap-1 p-2 bg-gray-50 rounded">
                <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 truncate">Docs:</span>
                <span className="font-medium">{caseItem.documents?.length || 0}</span>
              </div>
            </div>
          )}
          {/* Next Hearing - Enhanced from history integration */}
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
          {/* Case Timeline Info - From history integration */}
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
          {/* Mobile Actions */}
          <div className="flex flex-col gap-2">
            {/* Primary Actions Row - Always visible */}
            <div className="flex gap-2">
              {config.enableCaseViewing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onView(caseItem)}
                  className="flex-1 text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  <span className="hidden xs:inline">View</span>
                </Button>
              )}
              {config.showCaseHistory && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowHistoryDialog(true)}
                  className="flex-1 text-xs text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <History className="w-3 h-3 mr-1" />
                  <span className="hidden xs:inline">History</span>
                </Button>
              )}
              {config.enableCaseEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(caseItem)}
                  className="flex-1 text-xs"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Edit2 className="w-3 h-3 mr-1" />
                  )}
                  <span className="hidden xs:inline">Edit</span>
                </Button>
              )}
              {/* Mobile Menu for Additional Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="px-2">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {config.enableStatusUpdate && (
                    <>
                      <DropdownMenuItem onClick={() => onStatusUpdate(caseItem.id, 'active')}>
                        Set to Active
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusUpdate(caseItem.id, 'pending')}>
                        Set to Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusUpdate(caseItem.id, 'closed')}>
                        Set to Closed
                      </DropdownMenuItem>
                    </>
                  )}
                  {customActions.map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => action.action(caseItem)}
                      className={action.variant === 'destructive' ? 'text-red-600' : ''}
                    >
                      {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Quick Status Update - Enhanced from history integration */}
            {config.enableStatusUpdates && (
              <div className="pt-2 border-t">
                <div className="text-xs text-gray-500 mb-2">Quick Status Update:</div>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onStatusUpdate(caseItem.id, 'adjournment' as CaseStatus)}
                    disabled={submitting || caseItem.status === 'adjournment'}
                    className="text-xs py-1 h-auto"
                  >
                    Adjourn
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onStatusUpdate(caseItem.id, 'ruling' as CaseStatus)}
                    disabled={submitting || caseItem.status === 'ruling'}
                    className="text-xs py-1 h-auto"
                  >
                    Rule
                  </Button>
                </div>
              </div>
            )}
            {/* Status Update - Desktop Only */}
            {config.enableStatusUpdate && (
              <div className="hidden md:block">
                <Select
                  onValueChange={(value: CaseStatus) => onStatusUpdate(caseItem.id, value)}
                  disabled={submitting}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Set to Draft</SelectItem>
                    <SelectItem value="active">Set to Active</SelectItem>
                    <SelectItem value="pending">Set to Pending</SelectItem>
                    <SelectItem value="closed">Set to Closed</SelectItem>
                    <SelectItem value="appealed">Set to Appealed</SelectItem>
                    <SelectItem value="dismissed">Set to Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Case History Timeline Dialog - Integrated from history module */}
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
};
// Party Form Component
const PartyFormSection = ({
  parties,
  type,
  onAdd,
  onUpdate,
  onRemove,
  label,
  colorScheme
}: {
  parties: CaseParty[];
  type: 'plaintiffs' | 'defendants';
  onAdd: () => void;
  onUpdate: (index: number, field: string, value: string) => void;
  onRemove: (index: number) => void;
  label: string;
  colorScheme: 'blue' | 'red';
}) => {
  const colors = {
    blue: {
      text: 'text-blue-700',
      bg: 'bg-blue-600 hover:bg-blue-700',
      cardBg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    red: {
      text: 'text-red-700',
      bg: 'bg-red-600 hover:bg-red-700',
      cardBg: 'bg-red-50',
      border: 'border-red-200'
    }
  };
  const scheme = colors[colorScheme];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className={`text-sm sm:text-base font-medium ${scheme.text}`}>
          {label} ({parties.length})
        </Label>
        <Button
          type="button"
          size="sm"
          onClick={onAdd}
          className={`text-xs ${scheme.bg}`}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {parties.map((party, index) => (
          <Card key={index} className={`p-3 ${scheme.cardBg} ${scheme.border}`}>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={party.name}
                  onChange={(e) => onUpdate(index, 'name', e.target.value)}
                  placeholder={`${label.slice(0, -1)} name`}
                  className="flex-1 bg-white text-sm"
                />
                <Select
                  value={party.type}
                  onValueChange={(value) => onUpdate(index, 'type', value)}
                >
                  <SelectTrigger className="w-24 sm:w-32 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="organization">Organization</SelectItem>
                  </SelectContent>
                </Select>
                {parties.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onRemove(index)}
                    className="px-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
// Main Cases Module Component - This would continue with your existing implementation
// The enhanced CaseCard component above now includes all case history functionality
// Export additional components for external use
export { CaseCard, PartyFormSection, MobileFilterPanel };
// Export configuration interface for TypeScript users
export type { CasesModuleConfig, CasesModuleProps };
