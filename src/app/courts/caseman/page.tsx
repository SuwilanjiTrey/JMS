'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/models';
import { 
  getAllCourts,
  getCasesByCourt,
  createCase,
  assignCaseToJudge,
  getUsersByRole
} from '@/lib/auth';

interface Case {
  id: string;
  title: string;
  caseNumber: string;
  plaintiff: string;
  defendant: string;
  status: 'pending' | 'active' | 'closed' | 'appealed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  filingDate: Date;
  courtId: string;
  judgeId?: string;
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

export default function CaseManagementPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courtId = searchParams.get('courtId');
  
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    caseNumber: '',
    plaintiff: '',
    defendant: '',
    status: 'pending' as 'pending' | 'active' | 'closed' | 'appealed',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    filingDate: new Date().toISOString().split('T')[0],
    courtId: courtId || ''
  });

  const [assignFormData, setAssignFormData] = useState({
    caseId: '',
    judgeId: ''
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

  // Fetch courts and judges
  useEffect(() => {
    fetchData();
  }, [courtId]);

  // Filter cases based on search term
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredCases(cases);
    } else {
      const filtered = cases.filter(caseItem =>
        caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.plaintiff.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.defendant.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCases(filtered);
    }
  }, [searchTerm, cases]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all courts
      const courtsData = await getAllCourts();
      setCourts(courtsData);

      // If courtId is provided, fetch cases for that court
      if (courtId) {
        const court = courtsData.find(c => c.id === courtId);
        if (court) {
          setSelectedCourt(court);
          
          // Fetch cases for this court
          const casesData = await getCasesByCourt(courtId);
          setCases(casesData);
          setFilteredCases(casesData);
        }
      }

      // Fetch all judges
      const judgesData = await getUsersByRole('judge');
      setJudges(judgesData);
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
      // Create new case
      await createCase({
        ...formData,
        courtId: formData.courtId,
        filingDate: new Date(formData.filingDate)
      });

      setSuccess('Case created successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error creating case:', error);
      setError(error.message || 'Failed to create case');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Assign case to judge
      await assignCaseToJudge(assignFormData.caseId, assignFormData.judgeId);

      setSuccess('Case assigned to judge successfully');
      setIsAssignDialogOpen(false);
      resetAssignForm();
      fetchData();
    } catch (error: any) {
      console.error('Error assigning case:', error);
      setError(error.message || 'Failed to assign case');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAssignDialog = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setAssignFormData({
      caseId: caseItem.id,
      judgeId: caseItem.judgeId || ''
    });
    setIsAssignDialogOpen(true);
  };

  const handleCourtChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const courtIdValue = e.target.value;
    if (courtIdValue) {
      router.push(`/courts/caseman?courtId=${courtIdValue}`);
    } else {
      router.push('/courts/caseman');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      caseNumber: '',
      plaintiff: '',
      defendant: '',
      status: 'pending',
      priority: 'medium',
      filingDate: new Date().toISOString().split('T')[0],
      courtId: courtId || ''
    });
    setError('');
  };

  const resetAssignForm = () => {
    setAssignFormData({
      caseId: '',
      judgeId: ''
    });
    setError('');
  };

  const openDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'appealed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-orange-500" />
          <p className="mt-4 text-gray-600">Loading case management...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Case Management</h1>
            <p className="text-gray-600 mt-2">
              {selectedCourt ? `Manage cases for ${selectedCourt.name}` : 'Select a court to manage its cases'}
            </p>
          </div>
          <Button onClick={openDialog} className="bg-orange-500 hover:bg-orange-600" disabled={!selectedCourt}>
            <Plus className="mr-2 h-4 w-4" />
            Add Case
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
            placeholder="Search cases by title, case number, plaintiff, or defendant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={!selectedCourt}
          />
        </div>
      </div>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cases</CardTitle>
          <CardDescription>
            {selectedCourt 
              ? `${filteredCases.length} case${filteredCases.length !== 1 ? 's' : ''} found for ${selectedCourt.name}`
              : 'Select a court to view its cases'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedCourt ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">Please select a court to manage its cases</div>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No cases found for this court
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case</TableHead>
                  <TableHead>Case Number</TableHead>
                  <TableHead>Parties</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Judge</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => {
                  const assignedJudge = judges.find(j => j.id === caseItem.judgeId);
                  return (
                    <TableRow key={caseItem.id}>
                      <TableCell>
                        <div className="font-medium">{caseItem.title}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{caseItem.caseNumber}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>Plaintiff: {caseItem.plaintiff}</div>
                          <div>Defendant: {caseItem.defendant}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(caseItem.status)}>
                          {caseItem.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(caseItem.priority)}>
                          {caseItem.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assignedJudge ? (
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            {assignedJudge.displayName}
                          </div>
                        ) : (
                          <span className="text-gray-500">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAssignDialog(caseItem)}
                          >
                            {caseItem.judgeId ? 'Reassign' : 'Assign'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Case Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Case</DialogTitle>
            <DialogDescription>
              Create a new case for {selectedCourt?.name}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Case Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter case title"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="caseNumber">Case Number *</Label>
                <Input
                  id="caseNumber"
                  value={formData.caseNumber}
                  onChange={(e) => setFormData({...formData, caseNumber: e.target.value})}
                  placeholder="Enter case number"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="plaintiff">Plaintiff *</Label>
                  <Input
                    id="plaintiff"
                    value={formData.plaintiff}
                    onChange={(e) => setFormData({...formData, plaintiff: e.target.value})}
                    placeholder="Plaintiff name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="defendant">Defendant *</Label>
                  <Input
                    id="defendant"
                    value={formData.defendant}
                    onChange={(e) => setFormData({...formData, defendant: e.target.value})}
                    placeholder="Defendant name"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({...formData, status: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="appealed">Appealed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({...formData, priority: value as any})}
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
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="filingDate">Filing Date</Label>
                <Input
                  id="filingDate"
                  type="date"
                  value={formData.filingDate}
                  onChange={(e) => setFormData({...formData, filingDate: e.target.value})}
                  required
                />
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
                  'Add Case'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Case Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Case to Judge</DialogTitle>
            <DialogDescription>
              Assign "{selectedCase?.title}" to a judge
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAssignSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="judge">Select Judge</Label>
                <Select
                  value={assignFormData.judgeId}
                  onValueChange={(value) => setAssignFormData({...assignFormData, judgeId: value})}
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
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign Case'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
