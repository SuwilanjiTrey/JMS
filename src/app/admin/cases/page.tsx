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
  Trash2
} from 'lucide-react';
import { CASE_STATUS_COLORS, CASE_PRIORITY_COLORS, CASE_TYPE_LABELS } from '@/models';
import type { Case, CaseCreationData, CaseStatus, CasePriority, CaseType, CaseParty } from '@/models';
import {
  uploadData,
  setDetails,
  getAll,
  deleteData
} from '@/lib/utils/firebase/general';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';

export default function AdminCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        nextHearingDate: caseItem.nextHearingDate?.toDate ? caseItem.nextHearingDate.toDate() : caseItem.nextHearingDate
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
          resetForm();
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
          status: 'draft',
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
          estimatedDuration: caseForm.estimatedDuration
        };

        const success = await uploadData(COLLECTIONS.CASES, newCase);

        if (success) {
          setCases(prev => [...prev, newCase]);
          setSuccess('Case created successfully!');
          setShowCaseDialog(false);
          resetForm();
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

  const updateCaseStatus = async (caseId: string, newStatus: CaseStatus) => {
    setSubmitting(true);
    try {
      const caseToUpdate = cases.find(c => c.id === caseId);
      if (!caseToUpdate) return;

      const updatedCase = {
        ...caseToUpdate,
        status: newStatus,
        updatedAt: new Date()
      };

      const result = await setDetails(updatedCase, COLLECTIONS.CASES, caseId);

      if (result.success) {
        setCases(prev => prev.map(c => c.id === caseId ? updatedCase : c));
        setSuccess(`Case status updated to ${newStatus}!`);
      } else {
        setError('Failed to update case status');
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

  const viewCaseDetails = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setShowDetailsDialog(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Case Management</h1>
          <p className="text-gray-600">
            {loading ? 'Loading cases...' : `Manage all cases in the system (${filteredCases.length} cases)`}
          </p>
        </div>
        <Button
          onClick={handleNewCase}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={submitting}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Case
        </Button>
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

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search cases by title or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Status" />
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
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
            <SelectTrigger className="w-full sm:w-[180px]">
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
      </Card>

      {/* Cases Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Loading cases...</span>
        </div>
      ) : cases.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <Gavel className="w-16 h-16 mx-auto text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900">No Cases Found</h3>
            <p className="text-gray-600">
              No cases have been created yet. Click the "New Case" button to create your first case.
            </p>
            <Button
              onClick={handleNewCase}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Case
            </Button>
          </div>
        </Card>
      ) : filteredCases.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <Search className="w-16 h-16 mx-auto text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900">No Matching Cases</h3>
            <p className="text-gray-600">
              No cases match your current search and filter criteria. Try adjusting your filters or search terms.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
              <Button
                onClick={handleNewCase}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Case
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((caseItem) => (
            <Card key={caseItem.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {caseItem.caseNumber}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-2 text-sm">
                      {caseItem.title}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1 ml-2">
                    <Badge className={`text-xs ${CASE_STATUS_COLORS[caseItem.status]}`}>
                      {caseItem.status}
                    </Badge>
                    <Badge className={`text-xs ${CASE_PRIORITY_COLORS[caseItem.priority]}`}>
                      {caseItem.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{CASE_TYPE_LABELS[caseItem.type]}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{new Date(caseItem.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">Parties:</span>
                    <span className="font-medium">
                      {caseItem.plaintiffs.length + caseItem.defendants.length}
                    </span>
                  </div>

                  {caseItem.estimatedDuration && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{caseItem.estimatedDuration}d</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewCaseDetails(caseItem)}
                    className="flex-1"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditCase(caseItem)}
                    className="flex-1"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>

                <Select onValueChange={(value: CaseStatus) => updateCaseStatus(caseItem.id, value)} disabled={submitting}>
                  <SelectTrigger className="w-full">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Case Form Dialog */}
      <Dialog open={showCaseDialog} onOpenChange={setShowCaseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isEditing ? `Edit Case - ${caseForm.id}` : 'Create New Case'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the case information below. All fields marked with * are required.'
                : 'Register a new case in the system. All fields marked with * are required.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Case Title *</Label>
                  <Input
                    id="title"
                    value={caseForm.title}
                    onChange={(e) => setCaseForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Smith vs. Johnson"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Case Type *</Label>
                  <Select
                    value={caseForm.type}
                    onValueChange={(value: CaseType) => setCaseForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={caseForm.priority}
                    onValueChange={(value: CasePriority) => setCaseForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="duration">Estimated Duration (days)</Label>
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
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Case Description *</Label>
                <Textarea
                  id="description"
                  value={caseForm.description}
                  onChange={(e) => setCaseForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide a detailed description of the case..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Parties */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Case Parties</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Plaintiffs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium text-blue-700">
                      Plaintiffs ({caseForm.plaintiffs.length})
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addParty('plaintiffs')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  {caseForm.plaintiffs.map((plaintiff, index) => (
                    <Card key={index} className="p-3 bg-blue-50 border-blue-200">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={plaintiff.name}
                            onChange={(e) => updateParty('plaintiffs', index, 'name', e.target.value)}
                            placeholder="Plaintiff name"
                            className="flex-1 bg-white"
                          />
                          <Select
                            value={plaintiff.type}
                            onValueChange={(value) => updateParty('plaintiffs', index, 'type', value)}
                          >
                            <SelectTrigger className="w-32 bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="organization">Organization</SelectItem>
                            </SelectContent>
                          </Select>
                          {caseForm.plaintiffs.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => removeParty('plaintiffs', index)}
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

                {/* Defendants */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium text-red-700">
                      Defendants ({caseForm.defendants.length})
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addParty('defendants')}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  {caseForm.defendants.map((defendant, index) => (
                    <Card key={index} className="p-3 bg-red-50 border-red-200">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={defendant.name}
                            onChange={(e) => updateParty('defendants', index, 'name', e.target.value)}
                            placeholder="Defendant name"
                            className="flex-1 bg-white"
                          />
                          <Select
                            value={defendant.type}
                            onValueChange={(value) => updateParty('defendants', index, 'type', value)}
                          >
                            <SelectTrigger className="w-32 bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="organization">Organization</SelectItem>
                            </SelectContent>
                          </Select>
                          {caseForm.defendants.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => removeParty('defendants', index)}
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
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCaseDialog(false);
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitCase}
                disabled={submitting}
                className={isEditing ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}
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

      {/* Case Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  {selectedCase?.caseNumber}
                  <Badge className={selectedCase ? CASE_STATUS_COLORS[selectedCase.status] : ''}>
                    {selectedCase?.status}
                  </Badge>
                  <Badge className={selectedCase ? CASE_PRIORITY_COLORS[selectedCase.priority] : ''}>
                    {selectedCase?.priority}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-lg mt-1">
                  {selectedCase?.title}
                </DialogDescription>
              </div>
              <Button
                onClick={() => selectedCase && handleEditCase(selectedCase)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Case
              </Button>
            </div>
          </DialogHeader>

          {selectedCase && (
            <div className="space-y-6">
              {/* Case Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-blue-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Case Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{CASE_TYPE_LABELS[selectedCase.type]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className="font-medium capitalize">{selectedCase.priority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium capitalize">{selectedCase.status}</span>
                    </div>
                    {selectedCase.assignedTo && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assigned to:</span>
                        <span className="font-medium">{selectedCase.assignedTo}</span>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-green-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Timeline
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {new Date(selectedCase.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Updated:</span>
                      <span className="font-medium">
                        {new Date(selectedCase.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedCase.estimatedDuration && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Est. Duration:</span>
                        <span className="font-medium">{selectedCase.estimatedDuration} days</span>
                      </div>
                    )}
                    {selectedCase.nextHearingDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next Hearing:</span>
                        <span className="font-medium">
                          {new Date(selectedCase.nextHearingDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-purple-700 flex items-center gap-2">
                    <Gavel className="w-4 h-4" />
                    Case Progress
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hearings:</span>
                      <span className="font-medium">{selectedCase.hearings.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Documents:</span>
                      <span className="font-medium">{selectedCase.documents.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rulings:</span>
                      <span className="font-medium">{selectedCase.rulings.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lawyers:</span>
                      <span className="font-medium">{selectedCase.lawyers.length}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Case Description */}
              <Card className="p-6">
                <h4 className="font-semibold mb-3 text-gray-800">Case Description</h4>
                <p className="text-gray-700 leading-relaxed">{selectedCase.description}</p>
              </Card>

              {/* Case Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h4 className="font-semibold mb-4 text-blue-700 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Plaintiffs ({selectedCase.plaintiffs.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedCase.plaintiffs.map((plaintiff, index) => (
                      <div key={plaintiff.id} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-blue-900">{plaintiff.name}</p>
                            <p className="text-sm text-blue-700 capitalize">{plaintiff.type}</p>
                          </div>
                          {plaintiff.contactInfo && (
                            <div className="text-xs text-blue-600">
                              {plaintiff.contactInfo.email && (
                                <p>📧 {plaintiff.contactInfo.email}</p>
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

                <Card className="p-6">
                  <h4 className="font-semibold mb-4 text-red-700 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Defendants ({selectedCase.defendants.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedCase.defendants.map((defendant, index) => (
                      <div key={defendant.id} className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-red-900">{defendant.name}</p>
                            <p className="text-sm text-red-700 capitalize">{defendant.type}</p>
                          </div>
                          {defendant.contactInfo && (
                            <div className="text-xs text-red-600">
                              {defendant.contactInfo.email && (
                                <p>📧 {defendant.contactInfo.email}</p>
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
                <Card className="p-6">
                  <h4 className="font-semibold mb-3 text-gray-800">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCase.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="bg-gray-100">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}