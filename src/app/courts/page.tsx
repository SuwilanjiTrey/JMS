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
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Users,
  MapPin,
  AlertCircle,
  Loader2,
  Calendar,
  FileText,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, CourtType } from '@/models';
import { 
  getAllCourts,
  createCourt,
  updateCourt,
  deleteCourt,
  getUsersByRole
} from '@/lib/auth';

interface Court {
  id: string;
  name: string;
  type: CourtType;
  location: string;
  description: string;
  judges: string[];
  administrators: string[];
  cases: string[];
  createdAt: Date;
  updatedAt: Date;
}

const courtTypes = [
  { value: 'small-claims', label: 'Small Claims Court' },
  { value: 'specialized-tribunals', label: 'Specialized Tribunals' },
  { value: 'local-courts', label: 'Local Courts' },
  { value: 'subordinate-magistrate', label: 'Subordinate/Magistrate Courts' },
  { value: 'high-court', label: 'High Court' },
  { value: 'constitutional-court', label: 'Constitutional Court' },
  { value: 'supreme-court', label: 'Supreme Court' }
];

export default function CourtsPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courts, setCourts] = useState<Court[]>([]);
  const [filteredCourts, setFilteredCourts] = useState<Court[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: 'local-courts' as CourtType,
    location: '',
    name: '',
    description: ''
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
  }, []);

  // Filter courts based on search term
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredCourts(courts);
    } else {
      const filtered = courts.filter(court =>
        court.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        court.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        court.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCourts(filtered);
    }
  }, [searchTerm, courts]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all courts
      const courtsData = await getAllCourts();
      setCourts(courtsData);
      setFilteredCourts(courtsData);

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
      if (editingCourt) {
        // Update existing court
        await updateCourt(editingCourt.id, formData);
        setSuccess('Court updated successfully');
      } else {
        // Create new court
        await createCourt({
          ...formData,
          name: `${courtTypes.find(c => c.value === formData.type)?.label} - ${formData.location}`
        });
        setSuccess('Court created successfully');
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving court:', error);
      setError(error.message || 'Failed to save court');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (court: Court) => {
    setEditingCourt(court);
    setFormData({
      type: court.type,
      location: court.location,
      name: court.name,
      description: court.description
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (courtId: string) => {
    if (!confirm('Are you sure you want to delete this court? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteCourt(courtId);
      setSuccess('Court deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting court:', error);
      setError(error.message || 'Failed to delete court');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'local-courts',
      location: '',
      name: '',
      description: ''
    });
    setEditingCourt(null);
    setError('');
  };

  const openDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

const navigateToManagement = (section: 'cases' | 'documents' | 'calendar') => {
  switch(section) {
    case 'cases':
      router.push(`/courts/caseman`);
      break;
    case 'documents':
      router.push(`/courts/docman`);
      break;
    case 'calendar':
      router.push(`/courts/calendarman`);
      break;
    default:
      router.push(`/courts`);
      break;
  }
};

  const getCourtTypeLabel = (type: CourtType) => {
    const courtType = courtTypes.find(c => c.value === type);
    return courtType ? courtType.label : type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-orange-500" />
          <p className="mt-4 text-gray-600">Loading courts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Courts Management</h1>
          <p className="text-gray-600 mt-2">Manage all courts in the judicial system</p>
        </div>
        <Button onClick={openDialog} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="mr-2 h-4 w-4" />
          Add Court
        </Button>
      </div>

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
            placeholder="Search courts by name, location, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Courts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Courts</CardTitle>
          <CardDescription>
            {filteredCourts.length} court{filteredCourts.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Court</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Judges</TableHead>
                <TableHead>Cases</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourts.map((court) => (
                <TableRow key={court.id}>
                  <TableCell>
                    <div className="font-medium">{court.name}</div>
                    <div className="text-sm text-gray-500">{court.description}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCourtTypeLabel(court.type)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      {court.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      {court.judges.length} judge{court.judges.length !== 1 ? 's' : ''}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      {court.cases.length} case{court.cases.length !== 1 ? 's' : ''}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToManagement('cases')}
                      >
                        Cases
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToManagement('documents')}
                      >
                        Documents
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToManagement('calendar')}
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(court)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(court.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredCourts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No courts found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Court Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCourt ? 'Edit Court' : 'Add New Court'}
            </DialogTitle>
            <DialogDescription>
              {editingCourt 
                ? 'Update the court information below.'
                : 'Enter the details for the new court.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Court Type *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as CourtType})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  {courtTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Enter court location"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="name">Court Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Court name will be auto-generated"
                  disabled
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter court description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
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
                    Saving...
                  </>
                ) : editingCourt ? (
                  'Update Court'
                ) : (
                  'Add Court'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
