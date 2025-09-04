'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Users, 
  Search, 
  Building,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/models';
import { 
  getAllLawFirms, 
  createLawFirm, 
  updateLawFirm, 
  deleteLawFirm,
  getUsersByLawFirm 
} from '@/lib/auth';

interface LawFirm {
  id: string;
  name: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  lawyers: string[];
  administrators: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export default function LawFirmsPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [lawFirms, setLawFirms] = useState<LawFirm[]>([]);
  const [filteredLawFirms, setFilteredLawFirms] = useState<LawFirm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLawFirm, setEditingLawFirm] = useState<LawFirm | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactEmail: '',
    contactPhone: ''
  });
  
  console.log("user role: ", userRole)



// Option 4: Complete solution with proper loading handling
useEffect(() => {
  // Add console.log for debugging
  console.log('Current userRole:', userRole);
  console.log('User object:', user);
  
  // Only check authorization after userRole is definitively set
  if (userRole) {
    const allowedRoles = ['admin', 'super-admin', 'law-firm-admin'];
    if (!allowedRoles.includes(userRole)) {
      console.log('User not authorized, redirecting...');
      router.push('/unauthorized');
    } else {
      console.log('User authorized with role:', userRole);
    }
  }
}, [userRole, router, user]);



  // Fetch law firms
  useEffect(() => {
    fetchLawFirms();
  }, []);

  // Filter law firms based on search term
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredLawFirms(lawFirms);
    } else {
      const filtered = lawFirms.filter(firm =>
        firm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        firm.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLawFirms(filtered);
    }
  }, [searchTerm, lawFirms]);

  const fetchLawFirms = async () => {
    setLoading(true);
    try {
      const firms = await getAllLawFirms();
      setLawFirms(firms);
      setFilteredLawFirms(firms);
    } catch (error) {
      console.error('Error fetching law firms:', error);
      setError('Failed to load law firms');
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
      if (editingLawFirm) {
        // Update existing law firm
        await updateLawFirm(editingLawFirm.id, formData);
        setSuccess('Law firm updated successfully');
      } else {
        // Create new law firm
        await createLawFirm(formData);
        setSuccess('Law firm created successfully');
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchLawFirms();
    } catch (error: any) {
      console.error('Error saving law firm:', error);
      setError(error.message || 'Failed to save law firm');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (firm: LawFirm) => {
    setEditingLawFirm(firm);
    setFormData({
      name: firm.name,
      address: firm.address,
      contactEmail: firm.contactEmail,
      contactPhone: firm.contactPhone
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (firmId: string) => {
    if (!confirm('Are you sure you want to delete this law firm? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteLawFirm(firmId);
      setSuccess('Law firm deleted successfully');
      fetchLawFirms();
    } catch (error: any) {
      console.error('Error deleting law firm:', error);
      setError(error.message || 'Failed to delete law firm');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      contactEmail: '',
      contactPhone: ''
    });
    setEditingLawFirm(null);
    setError('');
  };

  const openDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-orange-500" />
          <p className="mt-4 text-gray-600">Loading law firms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Law Firms Management</h1>
          <p className="text-gray-600 mt-2">Manage all law firms in the system</p>
        </div>
        <Button onClick={openDialog} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="mr-2 h-4 w-4" />
          Add Law Firm
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
            placeholder="Search law firms by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Law Firms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Law Firms</CardTitle>
          <CardDescription>
            {filteredLawFirms.length} law firm{filteredLawFirms.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Law Firm</TableHead>
                <TableHead>Contact Information</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLawFirms.map((firm) => (
                <TableRow key={firm.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium">{firm.name}</div>
                        <div className="text-sm text-gray-500">ID: {firm.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        {firm.contactEmail}
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        {firm.contactPhone}
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        {firm.address}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Badge variant="outline" className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {firm.lawyers.length} Lawyers
                      </Badge>
                      <Badge variant="outline" className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {firm.administrators.length} Admins
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {firm.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/law-firms/${firm.id}/lawyers`)}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Lawyers
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(firm)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(firm.id)}
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
          
          {filteredLawFirms.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No law firms found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Law Firm Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingLawFirm ? 'Edit Law Firm' : 'Add New Law Firm'}
            </DialogTitle>
            <DialogDescription>
              {editingLawFirm 
                ? 'Update the law firm information below.'
                : 'Enter the details for the new law firm.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Law Firm Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="contactPhone">Contact Phone *</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
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
                    Saving...
                  </>
                ) : editingLawFirm ? (
                  'Update Law Firm'
                ) : (
                  'Add Law Firm'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
