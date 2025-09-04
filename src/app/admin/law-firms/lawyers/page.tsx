'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Mail,
  Phone,
  User,
  AlertCircle,
  Loader2,
  Briefcase,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/models';
import { 
  getAllLawFirms,
  getLawFirmById,
  getUsersByLawFirm,
  registerUserWithProfile
} from '@/lib/auth';

interface Lawyer {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  profile: {
    barNumber: string;
    specialization: string[];
    lawFirmId: string;
  };
  createdAt: Date;
  isActive: boolean;
}

interface LawFirm {
  id: string;
  name: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  lawyers: string[];
  administrators: string[];
}

export default function LawyersManagementPage() {
  const { user, userRole } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lawFirmId = searchParams.get('lawFirmId');
  
  const [lawFirms, setLawFirms] = useState<LawFirm[]>([]);
  const [selectedLawFirm, setSelectedLawFirm] = useState<LawFirm | null>(null);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [filteredLawyers, setFilteredLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    barNumber: '',
    specialization: [] as string[]
  });

  const specializations = [
    'Criminal Law', 'Civil Law', 'Family Law', 'Commercial Law', 
    'Constitutional Law', 'Labour Law', 'Tax Law', 'Environmental Law'
  ];

  // Check if user has permission
  useEffect(() => {
    if (userRole !== 'admin' || userRole !== 'super-admin' || userRole !== 'law-firm-admin') {
      router.push('/unauthorized');
    }
  }, [userRole, router]);

  // Fetch law firms and selected law firm data
  useEffect(() => {
    fetchData();
  }, [lawFirmId]);

  // Filter lawyers based on search term
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredLawyers(lawyers);
    } else {
      const filtered = lawyers.filter(lawyer =>
        lawyer.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lawyer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lawyer.profile.barNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLawyers(filtered);
    }
  }, [searchTerm, lawyers]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all law firms
      const firms = await getAllLawFirms();
      setLawFirms(firms);

      // If a law firm ID is provided, fetch its details and lawyers
      if (lawFirmId) {
        const firmData = await getLawFirmById(lawFirmId);
        setSelectedLawFirm(firmData);

        // Fetch lawyers for this law firm
        const users = await getUsersByLawFirm(lawFirmId);
        const lawyersOnly = users.filter(u => u.role === 'lawyer');
        setLawyers(lawyersOnly);
        setFilteredLawyers(lawyersOnly);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLawFirmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const firmId = e.target.value;
    if (firmId) {
      router.push(`/admin/law-firms/lawyers?lawFirmId=${firmId}`);
    } else {
      router.push('/admin/law-firms/lawyers');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      // Create new lawyer
      await registerUserWithProfile({
        email: formData.email,
        password: formData.password,
        displayName: `${formData.firstName} ${formData.lastName}`,
        role: 'lawyer',
        profile: {
          lawFirmId: selectedLawFirm?.id || '',
          barNumber: formData.barNumber,
          specialization: formData.specialization
        }
      });

      setSuccess('Lawyer created successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error creating lawyer:', error);
      setError(error.message || 'Failed to create lawyer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter(s => s !== spec)
        : [...prev.specialization, spec]
    }));
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      barNumber: '',
      specialization: []
    });
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
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/admin/law-firms')}
          className="mb-4"
        >
          ← Back to Law Firms
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lawyers Management</h1>
            <p className="text-gray-600 mt-2">
              {selectedLawFirm 
                ? `Manage lawyers for ${selectedLawFirm.name}` 
                : 'Select a law firm to manage its lawyers'}
            </p>
          </div>
          {selectedLawFirm && (
            <Button onClick={openDialog} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="mr-2 h-4 w-4" />
              Add Lawyer
            </Button>
          )}
        </div>
      </div>

      {/* Law Firm Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Label htmlFor="lawFirmSelect" className="font-medium">
              Select Law Firm:
            </Label>
            <select
              id="lawFirmSelect"
              value={lawFirmId || ''}
              onChange={handleLawFirmChange}
              className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">-- Choose a law firm --</option>
              {lawFirms.map(firm => (
                <option key={firm.id} value={firm.id}>
                  {firm.name}
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

      {selectedLawFirm ? (
        <Tabs defaultValue="lawyers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="lawyers">Lawyers ({lawyers.length})</TabsTrigger>
            <TabsTrigger value="firm-info">Firm Information</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lawyers">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search lawyers by name, email, or bar number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Lawyers Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lawyers</CardTitle>
                <CardDescription>
                  {filteredLawyers.length} lawyer{filteredLawyers.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lawyer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Bar Number</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLawyers.map((lawyer) => (
                      <TableRow key={lawyer.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <div className="font-medium">{lawyer.displayName}</div>
                              <div className="text-sm text-gray-500">{lawyer.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            {lawyer.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{lawyer.profile.barNumber}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {lawyer.profile.specialization.slice(0, 2).map((spec, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                            {lawyer.profile.specialization.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{lawyer.profile.specialization.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {lawyer.createdAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
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
                
                {filteredLawyers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No lawyers found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="firm-info">
            <Card>
              <CardHeader>
                <CardTitle>Law Firm Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Contact Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Briefcase className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="font-medium">{selectedLawFirm.name}</div>
                          <div className="text-sm text-gray-500">Law Firm Name</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="font-medium">{selectedLawFirm.contactEmail}</div>
                          <div className="text-sm text-gray-500">Contact Email</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="font-medium">{selectedLawFirm.contactPhone}</div>
                          <div className="text-sm text-gray-500">Contact Phone</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Lawyers</span>
                        <Badge variant="outline">{selectedLawFirm.lawyers.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Administrators</span>
                        <Badge variant="outline">{selectedLawFirm.administrators.length}</Badge>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="font-medium">
                            {new Date(selectedLawFirm.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">Created Date</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Law Firm Selected</h3>
              <p className="text-gray-500">Please select a law firm from the dropdown above to manage its lawyers.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Lawyer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Lawyer</DialogTitle>
            <DialogDescription>
              Create a new lawyer account for {selectedLawFirm?.name}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="barNumber">Bar Registration Number *</Label>
                <Input
                  id="barNumber"
                  value={formData.barNumber}
                  onChange={(e) => setFormData({...formData, barNumber: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Areas of Specialization</Label>
                <div className="grid grid-cols-2 gap-2">
                  {specializations.map(spec => (
                    <Button
                      key={spec}
                      type="button"
                      variant={formData.specialization.includes(spec) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleSpecialization(spec)}
                    >
                      {spec}
                    </Button>
                  ))}
                </div>
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
                  'Create Lawyer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
