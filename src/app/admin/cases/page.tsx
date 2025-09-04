// Updated main cases component with history integration
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
  History,
  Trash2
} from 'lucide-react';
import { CASE_STATUS_COLORS, CASE_PRIORITY_COLORS, CASE_TYPE_LABELS, CASE_STATUS_LABELS } from '@/models';
import type { Case, CaseCreationData, CaseStatus, CasePriority, CaseType, CaseParty } from '@/models';
import {
  uploadData,
  setDetails,
  getAll,
  getAllWhereEquals,
  deleteData,
} from '@/lib/utils/firebase/general';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';

// Import history utilities
import {
  createStatusHistory,
  createTimelineEvent,
  updateCaseStatusWithHistory,
  CaseHistoryHelpers
} from '@/lib/utils/caseHistory';

import { CaseCard, PartyFormSection, MobileFilterPanel } from '@/components/exports/cases_module';
import type { CasesModuleConfig, CasesModuleProps } from '@/components/exports/cases_module';
import { defaultConfig } from '@/components/exports/cases_module';
import CaseTimeline from '@/components/CaseTimeline';
import { trackStatusChange } from '@/lib/utils/caseHistory';
import { CaseProcessStage } from '@/models';
import ProcessStageManager from '@/components/ProcessStageManager';
import { trackProcessStage } from '@/lib/utils/caseHistory';

export default function AdminCases({
  config = defaultConfig,
  onCaseSelect,
  onCaseCreate,
  onCaseUpdate,
  onCaseDelete,
  initialFilters = {},
  customActions = []
}: CasesModuleProps) {
  const mergedConfig = {
    ...defaultConfig,
    ...config,
    // Enable case history by default
    showCaseHistory: config.showCaseHistory !== false
  };

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || 'all');
  const [priorityFilter, setPriorityFilter] = useState(initialFilters.priority || 'all');
  const [typeFilter, setTypeFilter] = useState(initialFilters.type || 'all');
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedCaseForHistory, setSelectedCaseForHistory] = useState<Case | null>(null);
  const [processStages, setProcessStages] = useState<CaseProcessStage[]>([]);

  // Case form state
  const [caseForm, setCaseForm] = useState<CaseCreationData & { id?: string }>({
    title: '',
    description: '',
    type: 'civil',
    priority: 'medium',
    plaintiffs: [{ name: '', type: 'individual' }],
    defendants: [{ name: '', type: 'individual' }],
    estimatedDuration: 30,
    tags: []
  });

  // Load cases on component mount
  useEffect(() => {
    loadCases();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const loadCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const casesData = await getAll(COLLECTIONS.CASES);
      // Convert Firestore timestamps to Date objects
      const processedCases = casesData.map((caseItem: any) => ({
        ...caseItem,
        createdAt: caseItem.createdAt?.toDate ? caseItem.createdAt.toDate() : new Date(caseItem.createdAt),
        updatedAt: caseItem.updatedAt?.toDate ? caseItem.updatedAt.toDate() : new Date(caseItem.updatedAt),
        nextHearingDate: caseItem.nextHearingDate?.toDate ? caseItem.nextHearingDate.toDate() : caseItem.nextHearingDate,
        // Initialize empty arrays for history if not present
        statusHistory: caseItem.statusHistory || [],
        timeline: caseItem.timeline || []
      }));
      setCases(processedCases as Case[]);
    } catch (error) {
      console.error('Error loading cases:', error);
      setError('Failed to load cases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateCaseNumber = (type: CaseType): string => {
    const typePrefix = {
      civil: 'CV',
      criminal: 'CR',
      family: 'FA',
      commercial: 'CO',
      constitutional: 'CN',
      other: 'OT'
    };

    const currentYear = new Date().getFullYear();
    const existingCases = cases.filter(c =>
      c.type === type &&
      c.caseNumber.includes(`${currentYear}`)
    );
    const nextNumber = existingCases.length + 1;

    return `${typePrefix[type]}-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;
  };

  const handleSubmitCase = async () => {
    if (!caseForm.title.trim() || !caseForm.description.trim()) {
      setError('Please fill in all required fields (Title and Description)');
      return;
    }

    if (caseForm.plaintiffs.some(p => !p.name.trim()) || caseForm.defendants.some(d => !d.name.trim())) {
      setError('All party names must be filled in');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (isEditing && caseForm.id) {
        // Update existing case
        const updatedCase: Case = {
          ...selectedCase!,
          title: caseForm.title,
          description: caseForm.description,
          type: caseForm.type,
          priority: caseForm.priority,
          plaintiffs: caseForm.plaintiffs.map((p, idx) => ({
            ...p,
            id: `plaintiff_${Date.now()}_${idx}`
          })),
          defendants: caseForm.defendants.map((d, idx) => ({
            ...d,
            id: `defendant_${Date.now()}_${idx}`
          })),
          tags: caseForm.tags || [],
          estimatedDuration: caseForm.estimatedDuration,
          updatedAt: new Date()
        };

        const result = await setDetails(updatedCase, COLLECTIONS.CASES, caseForm.id);

        if (result.success) {
          setCases(prev => prev.map(c => c.id === caseForm.id ? updatedCase : c));
          setSuccess('Case updated successfully!');
          setShowCaseDialog(false);
          onCaseUpdate?.(updatedCase);
          resetForm();

          // Create timeline event for case update
          await createTimelineEvent(
            caseForm.id,
            'note',
            'Case Updated',
            'Case information was updated',
            'current_user_id', // Replace with actual user ID
            {
              updateType: 'case_details',
              fields: ['title', 'description', 'type', 'priority', 'parties']
            }
          );
        } else {
          setError(result.error || 'Failed to update case');
        }
      } else {
        // Create new case
        const caseId = `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const caseNumber = generateCaseNumber(caseForm.type);

        const newCase: Case = {
          id: caseId,
          caseNumber,
          title: caseForm.title,
          description: caseForm.description,
          type: caseForm.type,
          status: 'filed', // Start with 'filed' status
          priority: caseForm.priority,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'current_user_id', // Replace with actual user ID from auth context
          plaintiffs: caseForm.plaintiffs.map((p, idx) => ({
            ...p,
            id: `plaintiff_${Date.now()}_${idx}`
          })),
          defendants: caseForm.defendants.map((d, idx) => ({
            ...d,
            id: `defendant_${Date.now()}_${idx}`
          })),
          lawyers: [],
          hearings: [],
          documents: [],
          rulings: [],
          tags: caseForm.tags || [],
          estimatedDuration: caseForm.estimatedDuration,
          statusHistory: [],
          timeline: []
        };

        const success = await setDetails(newCase, COLLECTIONS.CASES, newCase.id);

        if (success) {
          setCases(prev => [...prev, newCase]);
          setSuccess('Case created successfully!');
          setShowCaseDialog(false);
          onCaseCreate?.(newCase);
          resetForm();

          // Create initial status history and timeline event
          await createStatusHistory(
            caseId,
            undefined,
            'filed',
            'current_user_id', // Replace with actual user ID
            'Initial case filing'
          );

          // Add parties to timeline
          for (const plaintiff of caseForm.plaintiffs) {
            await CaseHistoryHelpers.onPartyChange(
              caseId,
              'added',
              plaintiff.name,
              'plaintiff',
              'current_user_id'
            );
          }

          for (const defendant of caseForm.defendants) {
            await CaseHistoryHelpers.onPartyChange(
              caseId,
              'added',
              defendant.name,
              'defendant',
              'current_user_id'
            );
          }
        } else {
          setError('Failed to create case. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error submitting case:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCase = (caseItem: Case) => {
    setCaseForm({
      id: caseItem.id,
      title: caseItem.title,
      description: caseItem.description,
      type: caseItem.type,
      priority: caseItem.priority,
      plaintiffs: caseItem.plaintiffs.length > 0 ? caseItem.plaintiffs : [{ name: '', type: 'individual' }],
      defendants: caseItem.defendants.length > 0 ? caseItem.defendants : [{ name: '', type: 'individual' }],
      estimatedDuration: caseItem.estimatedDuration,
      tags: caseItem.tags || []
    });
    setIsEditing(true);
    setShowCaseDialog(true);
  };

  const handleNewCase = () => {
    resetForm();
    setIsEditing(false);
    setShowCaseDialog(true);
  };

  const resetForm = () => {
    setCaseForm({
      title: '',
      description: '',
      type: 'civil',
      priority: 'medium',
      plaintiffs: [{ name: '', type: 'individual' }],
      defendants: [{ name: '', type: 'individual' }],
      estimatedDuration: 30,
      tags: []
    });
    setSelectedCase(null);
  };

<<<<<<< HEAD
  // In your cases page, update the updateCaseStatus function:
=======
  // Enhanced status update with history tracking
>>>>>>> a0af6fa6dce3584581274ea880ddffa33bcbc4ba
  const updateCaseStatus = async (caseId: string, newStatus: CaseStatus) => {
    setSubmitting(true);
    try {
      const caseToUpdate = cases.find(c => c.id === caseId);
      if (!caseToUpdate) return;

<<<<<<< HEAD
      // Track the status change in history
      await trackStatusChange(
        caseId,
        newStatus,
        'current_user_id', // Replace with actual user ID
        `Status changed from ${caseToUpdate.status} to ${newStatus}`,
        caseToUpdate.status
      );

      const updatedCase = {
        ...caseToUpdate,
        status: newStatus,
        updatedAt: new Date()
      };
=======
      const previousStatus = caseToUpdate.status;
>>>>>>> a0af6fa6dce3584581274ea880ddffa33bcbc4ba

      // Use the enhanced status update function
      const result = await updateCaseStatusWithHistory(
        caseId,
        previousStatus,
        newStatus,
        'current_user_id', // Replace with actual user ID
        `Status updated via case management interface`,
        `Case status changed from ${previousStatus} to ${newStatus}`
      );

      if (result.success) {
        // Update local state
        const updatedCase = {
          ...caseToUpdate,
          status: newStatus,
          updatedAt: new Date()
        };

        setCases(prev => prev.map(c => c.id === caseId ? updatedCase : c));
        setSuccess(`Case status updated to ${CASE_STATUS_LABELS[newStatus]}!`);
        onCaseUpdate?.(updatedCase);
      } else {
        setError(result.error || 'Failed to update case status');
      }
    } catch (error) {
      console.error('Error updating case status:', error);
      setError('Error updating case status');
    } finally {
      setSubmitting(false);
    }
  };
  const addParty = (type: 'plaintiffs' | 'defendants') => {
    setCaseForm(prev => ({
      ...prev,
      [type]: [...prev[type], { name: '', type: 'individual' }]
    }));
  };

  const updateParty = (type: 'plaintiffs' | 'defendants', index: number, field: string, value: string) => {
    setCaseForm(prev => ({
      ...prev,
      [type]: prev[type].map((party, i) =>
        i === index ? { ...party, [field]: value } : party
      )
    }));
  };

  const removeParty = (type: 'plaintiffs' | 'defendants', index: number) => {
    setCaseForm(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  // Filter cases
  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || caseItem.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || caseItem.type === typeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });


  const viewCaseDetails = async (caseItem: Case) => {
    setSelectedCase(caseItem);
    setShowDetailsDialog(true);
    onCaseSelect?.(caseItem);

    // Fetch process stages for this case
    try {
      const stages = await getAllWhereEquals(
        COLLECTIONS.CASE_PROCESS_STAGES,
        'caseId',
        caseItem.id
      ) as CaseProcessStage[];
      setProcessStages(stages);
    } catch (error) {
      console.error('Error fetching process stages:', error);
    }
  };

  // Grid columns based on config
  const getGridClasses = () => {
    const { mobile, tablet, desktop } = mergedConfig.cardLayoutColumns!;
    return `grid grid-cols-${mobile} md:grid-cols-${tablet} lg:grid-cols-${desktop} gap-4 sm:gap-6`;
  };

  const handleViewHistory = (caseItem: Case) => {
    setSelectedCaseForHistory(caseItem);
    setShowHistoryDialog(true);
  };


  return (
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Mobile-Optimized Header */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
              {mergedConfig.customTitle}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {loading ? 'Loading cases...' : `${mergedConfig.customDescription} (${filteredCases.length} cases)`}
            </p>
          </div>
          {mergedConfig.enableCaseCreation && (
            <Button
              onClick={handleNewCase}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              disabled={submitting}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="sm:inline">New Case</span>
            </Button>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Mobile-Optimized Search and Filters */}
      {(mergedConfig.enableSearch || mergedConfig.enableFilters) && (
        <Card className="p-3 sm:p-4">
          <div className="space-y-3">
            {/* Search - Always visible */}
            {mergedConfig.enableSearch && (
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <Input
                  placeholder="Search cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 shadow-none focus-visible:ring-0 text-sm"
                />
              </div>
            )}

            {/* Filters - Desktop: Inline, Mobile: Button */}
            {mergedConfig.enableFilters && (
              <>
                {/* Desktop Filters */}
                <div className="hidden sm:flex gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="filed">Case Filed</SelectItem>
                      <SelectItem value="summons">Summons Issued</SelectItem>
                      <SelectItem value="takes_off">Case Takes Off</SelectItem>
                      <SelectItem value="recording">Recording</SelectItem>
                      <SelectItem value="adjournment">Adjournment</SelectItem>
                      <SelectItem value="ruling">Ruling</SelectItem>
                      <SelectItem value="appeal">Appeal</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(CASE_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mobile Filter Button */}
                <div className="sm:hidden flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Filters applied:</span>
                    <div className="flex gap-1">
                      {statusFilter !== 'all' && (
                        <Badge variant="outline" className="text-xs">{statusFilter}</Badge>
                      )}
                      {priorityFilter !== 'all' && (
                        <Badge variant="outline" className="text-xs">{priorityFilter}</Badge>
                      )}
                      {typeFilter !== 'all' && (
                        <Badge variant="outline" className="text-xs">{typeFilter}</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMobileFilters(true)}
                    className="gap-2"
                  >
                    Filters
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Cases Content */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-8 sm:py-12">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
          <span className="mt-2 text-sm sm:text-lg">Loading cases...</span>
        </div>
      ) : cases.length === 0 ? (
        <Card className="p-6 sm:p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <Gavel className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">No Cases Found</h3>
            <p className="text-sm sm:text-base text-gray-600">
              No cases have been created yet. Click the "New Case" button to create your first case.
            </p>
            {mergedConfig.enableCaseCreation && (
              <Button
                onClick={handleNewCase}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Case
              </Button>
            )}
          </div>
        </Card>
      ) : filteredCases.length === 0 ? (
        <Card className="p-6 sm:p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <Search className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">No Matching Cases</h3>
            <p className="text-sm sm:text-base text-gray-600">
              No cases match your current search and filter criteria. Try adjusting your filters or search terms.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setTypeFilter('all');
                }}
                className="w-full sm:w-auto"
              >
                Clear Filters
              </Button>
              {mergedConfig.enableCaseCreation && (
                <Button
                  onClick={handleNewCase}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Case
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className={getGridClasses()}>
          {filteredCases.map((caseItem, index) => (
            <CaseCard
              key={index}
              caseItem={caseItem}
              onView={viewCaseDetails}
              onEdit={handleEditCase}
              onStatusUpdate={updateCaseStatus}
              submitting={submitting}
              config={mergedConfig}
              customActions={customActions}
              onViewHistory={handleViewHistory}
            />
          ))}
        </div>
      )}

      {/* Rest of the component remains the same... */}
      {/* Mobile Filter Panel, Case Form Dialog, Case Details Dialog, etc. */}

      {/* Mobile-Optimized Case Form Dialog */}
      <Dialog open={showCaseDialog} onOpenChange={setShowCaseDialog}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              {isEditing ? `Edit Case${caseForm.id ? ` - ${caseForm.id}` : ''}` : 'Create New Case'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {isEditing
                ? 'Update the case information below. All fields marked with * are required.'
                : 'Register a new case in the system. All fields marked with * are required.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {/* Basic Information */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-medium border-b pb-2">Basic Information</h3>

              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm">Case Title *</Label>
                    <Input
                      id="title"
                      value={caseForm.title}
                      onChange={(e) => setCaseForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Smith vs. Johnson"
                      className="w-full text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm">Case Type *</Label>
                    <Select
                      value={caseForm.type}
                      onValueChange={(value: CaseType) => setCaseForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CASE_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-sm">Priority</Label>
                    <Select
                      value={caseForm.priority}
                      onValueChange={(value: CasePriority) => setCaseForm(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm">Estimated Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={caseForm.estimatedDuration || ''}
                      onChange={(e) => setCaseForm(prev => ({
                        ...prev,
                        estimatedDuration: parseInt(e.target.value) || 30
                      }))}
                      placeholder="30"
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm">Case Description *</Label>
                  <Textarea
                    id="description"
                    value={caseForm.description}
                    onChange={(e) => setCaseForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide a detailed description of the case..."
                    rows={3}
                    className="resize-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Case Parties - Mobile Optimized */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-medium border-b pb-2">Case Parties</h3>

              <div className="space-y-4 sm:space-y-6">
                {/* Mobile: Stacked, Desktop: Side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Plaintiffs */}
                  <PartyFormSection
                    parties={caseForm.plaintiffs}
                    type="plaintiffs"
                    onAdd={() => addParty('plaintiffs')}
                    onUpdate={(index, field, value) => updateParty('plaintiffs', index, field, value)}
                    onRemove={(index) => removeParty('plaintiffs', index)}
                    label="Plaintiffs"
                    colorScheme="blue"
                  />

                  {/* Defendants */}
                  <PartyFormSection
                    parties={caseForm.defendants}
                    type="defendants"
                    onAdd={() => addParty('defendants')}
                    onUpdate={(index, field, value) => updateParty('defendants', index, field, value)}
                    onRemove={(index) => removeParty('defendants', index)}
                    label="Defendants"
                    colorScheme="red"
                  />
                </div>
              </div>
            </div>

            {/* Mobile-Optimized Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCaseDialog(false);
                  resetForm();
                }}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitCase}
                disabled={submitting}
                className={`w-full sm:w-auto ${isEditing ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isEditing ? (
                      <>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Update Case
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Case
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile-Optimized Case Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-2xl font-bold flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="truncate">{selectedCase?.caseNumber}</span>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={selectedCase ? CASE_STATUS_COLORS[selectedCase.status] : ''}>
                      {selectedCase?.status}
                    </Badge>
                    <Badge className={selectedCase ? CASE_PRIORITY_COLORS[selectedCase.priority] : ''}>
                      {selectedCase?.priority}
                    </Badge>
                  </div>
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-lg mt-1 line-clamp-2 sm:line-clamp-none">
                  {selectedCase?.title}
                </DialogDescription>
              </div>
              {mergedConfig.enableCaseEditing && (
                <Button
                  onClick={() => selectedCase && handleEditCase(selectedCase)}
                  className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto flex-shrink-0"
                  size="sm"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  <span className="sm:inline">Edit</span>
                </Button>
              )}
            </div>
          </DialogHeader>

          {selectedCase && (
            <div className="space-y-4 sm:space-y-6">
              <ProcessStageManager
                caseId={selectedCase.id}
                currentStages={processStages.map(stage => ({
                  stage: stage.stage,
                  date: stage.date
                }))}
                onStageComplete={async (stageType, notes) => {
                  await trackProcessStage(
                    selectedCase.id,
                    stageType,
                    'current_user_id', // Replace with actual user ID from auth context
                    notes
                  );
                  // Refresh the process stages
                  const updatedStages = await getAllWhereEquals(
                    COLLECTIONS.CASE_PROCESS_STAGES,
                    'caseId',
                    selectedCase.id
                  ) as CaseProcessStage[];
                  setProcessStages(updatedStages);
                }}
              />
              {/* Case Overview - Mobile Stacked */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                <Card className="p-3 sm:p-4">
                  <h4 className="font-semibold mb-2 sm:mb-3 text-blue-700 flex items-center gap-2 text-sm sm:text-base">
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                    Case Information
                  </h4>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium text-right">{CASE_TYPE_LABELS[selectedCase.type]}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-600">Priority:</span>
                      <span className="font-medium capitalize text-right">{selectedCase.priority}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium capitalize text-right">{selectedCase.status}</span>
                    </div>
                    {selectedCase.assignedTo && (
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-600">Assigned to:</span>
                        <span className="font-medium text-right truncate">{selectedCase.assignedTo}</span>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-3 sm:p-4">
                  <h4 className="font-semibold mb-2 sm:mb-3 text-green-700 flex items-center gap-2 text-sm sm:text-base">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    Timeline
                  </h4>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium text-right">
                        {new Date(selectedCase.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-600">Updated:</span>
                      <span className="font-medium text-right">
                        {new Date(selectedCase.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: '2-digit'
                        })}
                      </span>
                    </div>
                    {selectedCase.estimatedDuration && (
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-600">Est. Duration:</span>
                        <span className="font-medium text-right">{selectedCase.estimatedDuration} days</span>
                      </div>
                    )}
                    {selectedCase.nextHearingDate && (
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-600">Next Hearing:</span>
                        <span className="font-medium text-right">
                          {new Date(selectedCase.nextHearingDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                  <h4 className="font-semibold mb-2 sm:mb-3 text-purple-700 flex items-center gap-2 text-sm sm:text-base">
                    <Gavel className="w-3 h-3 sm:w-4 sm:h-4" />
                    Case Progress
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-1 sm:gap-2 text-xs sm:text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-600">Hearings:</span>
                      <span className="font-medium">{selectedCase.hearings.length}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-600">Documents:</span>
                      <span className="font-medium">{selectedCase.documents.length}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-600">Rulings:</span>
                      <span className="font-medium">{selectedCase.rulings.length}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-600">Lawyers:</span>
                      <span className="font-medium">{selectedCase.lawyers.length}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Case Description */}
              <Card className="p-4 sm:p-6">
                <h4 className="font-semibold mb-3 text-gray-800 text-sm sm:text-base">Case Description</h4>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{selectedCase.description}</p>
              </Card>

              {/* Case Parties - Mobile Stacked */}
              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-2 sm:gap-6">
                <Card className="p-4 sm:p-6">
                  <h4 className="font-semibold mb-3 sm:mb-4 text-blue-700 flex items-center gap-2 text-sm sm:text-base">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    Plaintiffs ({selectedCase.plaintiffs.length})
                  </h4>
                  <div className="space-y-2 sm:space-y-3">
                    {selectedCase.plaintiffs.map((plaintiff, index) => (
                      <div key={plaintiff.id} className="bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-200">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-blue-900 text-sm truncate">{plaintiff.name}</p>
                            <p className="text-xs sm:text-sm text-blue-700 capitalize">{plaintiff.type}</p>
                          </div>
                          {plaintiff.contactInfo && (
                            <div className="text-xs text-blue-600 flex-shrink-0">
                              {plaintiff.contactInfo.email && (
                                <p className="truncate">📧 {plaintiff.contactInfo.email}</p>
                              )}
                              {plaintiff.contactInfo.phone && (
                                <p>📞 {plaintiff.contactInfo.phone}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 sm:p-6">
                  <h4 className="font-semibold mb-3 sm:mb-4 text-red-700 flex items-center gap-2 text-sm sm:text-base">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    Defendants ({selectedCase.defendants.length})
                  </h4>
                  <div className="space-y-2 sm:space-y-3">
                    {selectedCase.defendants.map((defendant, index) => (
                      <div key={defendant.id} className="bg-red-50 p-2 sm:p-3 rounded-lg border border-red-200">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-red-900 text-sm truncate">{defendant.name}</p>
                            <p className="text-xs sm:text-sm text-red-700 capitalize">{defendant.type}</p>
                          </div>
                          {defendant.contactInfo && (
                            <div className="text-xs text-red-600 flex-shrink-0">
                              {defendant.contactInfo.email && (
                                <p className="truncate">📧 {defendant.contactInfo.email}</p>
                              )}
                              {defendant.contactInfo.phone && (
                                <p>📞 {defendant.contactInfo.phone}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Tags */}
              {selectedCase.tags.length > 0 && (
                <Card className="p-4 sm:p-6">
                  <h4 className="font-semibold mb-3 text-gray-800 text-sm sm:text-base">Tags</h4>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {selectedCase.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="bg-gray-100 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {selectedCaseForHistory && (
                <CaseTimeline
                  caseItem={selectedCaseForHistory}
                  isOpen={showHistoryDialog}
                  onClose={() => {
                    setShowHistoryDialog(false);
                    setSelectedCaseForHistory(null);
                  }}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}