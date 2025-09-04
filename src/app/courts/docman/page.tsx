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
  Download, 
  Eye, 
  Trash2, 
  Search, 
  ArrowLeft,
  AlertCircle,
  Loader2,
  FileText,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/models';
import { getAllCourts } from '@/lib/auth';

interface Document {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date;
  courtId?: string;
  caseId?: string;
}

interface Court {
  id: string;
  name: string;
  type: string;
  location: string;
}

export default function DocumentManagementPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courtId = searchParams.get('courtId');
  
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null as File | null
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

  // Fetch courts
  useEffect(() => {
    fetchData();
  }, [courtId]);

  // Filter documents based on search term
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDocuments(filtered);
    }
  }, [searchTerm, documents]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all courts
      const courtsData = await getAllCourts();
      setCourts(courtsData);

      // If courtId is provided, set it as selected
      if (courtId) {
        const court = courtsData.find(c => c.id === courtId);
        if (court) {
          setSelectedCourt(court);
        }
      }

      // Mock documents data - replace with actual API call
      const mockDocuments: Document[] = [
        {
          id: '1',
          title: 'Case Filing Document',
          description: 'Initial case filing document',
          fileName: 'case_filing.pdf',
          fileSize: 1024000,
          fileType: 'application/pdf',
          uploadedBy: 'John Doe',
          uploadedAt: new Date('2023-05-15'),
          courtId: courtId || 'court-1',
          caseId: 'case-123'
        },
        {
          id: '2',
          title: 'Evidence Submission',
          description: 'Evidence submitted by plaintiff',
          fileName: 'evidence.zip',
          fileSize: 5120000,
          fileType: 'application/zip',
          uploadedBy: 'Jane Smith',
          uploadedAt: new Date('2023-05-20'),
          courtId: courtId || 'court-1',
          caseId: 'case-123'
        }
      ];
      
      // Filter documents by court if courtId is provided
      const filteredDocs = courtId 
        ? mockDocuments.filter(doc => doc.courtId === courtId)
        : mockDocuments;
        
      setDocuments(filteredDocs);
      setFilteredDocuments(filteredDocs);
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
      // Simulate file upload - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Document uploaded successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      setError(error.message || 'Failed to upload document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        file: e.target.files[0]
      });
    }
  };

  const handleCourtChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const courtIdValue = e.target.value;
    if (courtIdValue) {
      router.push(`/courts/docman?courtId=${courtIdValue}`);
    } else {
      router.push('/courts/docman');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      file: null
    });
    setError('');
  };

  const openDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-orange-500" />
          <p className="mt-4 text-gray-600">Loading document management...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
            <p className="text-gray-600 mt-2">
              {selectedCourt ? `Manage documents for ${selectedCourt.name}` : 'Select a court to manage its documents'}
            </p>
          </div>
          <Button onClick={openDialog} className="bg-orange-500 hover:bg-orange-600" disabled={!selectedCourt}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Document
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
            placeholder="Search documents by title, description, or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={!selectedCourt}
          />
        </div>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            {selectedCourt 
              ? `${filteredDocuments.length} document${filteredDocuments.length !== 1 ? 's' : ''} found for ${selectedCourt.name}`
              : 'Select a court to view its documents'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedCourt ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">Please select a court to manage its documents</div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No documents found for this court
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>File Info</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="font-medium">{doc.title}</div>
                          <div className="text-sm text-gray-500">{doc.fileName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{doc.description}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatFileSize(doc.fileSize)}</div>
                        <Badge variant="outline">{doc.fileType}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{doc.uploadedBy}</div>
                        <div className="text-gray-500">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4" />
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
          )}
        </CardContent>
      </Card>

      {/* Upload Document Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new document for {selectedCourt?.name}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Document Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter document title"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter document description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="file">Select File *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
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
                    Uploading...
                  </>
                ) : (
                  'Upload Document'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
