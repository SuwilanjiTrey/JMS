// app/public/efile/page.tsx
'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Plus, X, Upload, FileText, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { CaseType, CasePriority } from '@/models';
import { uploadPublicFile, createPublicCase } from '@/lib/utils/public';

interface CaseParty {
  name: string;
  type: 'individual' | 'organization';
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

interface DocumentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

interface FormData {
  title: string;
  description: string;
  type: CaseType;
  priority: CasePriority;
  plaintiffs: CaseParty[];
  defendants: CaseParty[];
}

export default function EFilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: 'civil',
    priority: 'medium',
    plaintiffs: [{ name: '', type: 'individual' }],
    defendants: [{ name: '', type: 'individual' }],
  });

  // Fetch current user
  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        // In a real app, you'd get the current user from auth context
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          if (parsedUser.role !== 'public') {
            router.push('/login');
            return;
          }
          setUser(parsedUser);
        } else {
          router.push('/login');
          return;
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Failed to load user data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      const newDocuments: DocumentFile[] = newFiles.map(file => ({
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        file
      }));
      
      setDocuments(prev => [...prev, ...newDocuments]);
    }
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const addPlaintiff = () => {
    setFormData({
      ...formData,
      plaintiffs: [...formData.plaintiffs, { name: '', type: 'individual' }],
    });
  };

  const removePlaintiff = (index: number) => {
    if (formData.plaintiffs.length <= 1) return;
    const newPlaintiffs = [...formData.plaintiffs];
    newPlaintiffs.splice(index, 1);
    setFormData({ ...formData, plaintiffs: newPlaintiffs });
  };

  const updatePlaintiff = (index: number, field: keyof CaseParty, value: string) => {
    const newPlaintiffs = [...formData.plaintiffs];
    newPlaintiffs[index] = { ...newPlaintiffs[index], [field]: value };
    setFormData({ ...formData, plaintiffs: newPlaintiffs });
  };

  const addDefendant = () => {
    setFormData({
      ...formData,
      defendants: [...formData.defendants, { name: '', type: 'individual' }],
    });
  };

  const removeDefendant = (index: number) => {
    if (formData.defendants.length <= 1) return;
    const newDefendants = [...formData.defendants];
    newDefendants.splice(index, 1);
    setFormData({ ...formData, defendants: newDefendants });
  };

  const updateDefendant = (index: number, field: keyof CaseParty, value: string) => {
    const newDefendants = [...formData.defendants];
    newDefendants[index] = { ...newDefendants[index], [field]: value };
    setFormData({ ...formData, defendants: newDefendants });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      
      // Validate form
      if (!formData.title.trim()) {
        setError('Case title is required');
        return;
      }
      
      if (!formData.description.trim()) {
        setError('Case description is required');
        return;
      }
      
      if (formData.plaintiffs.some(p => !p.name.trim())) {
        setError('All plaintiff names are required');
        return;
      }
      
      if (formData.defendants.some(d => !d.name.trim())) {
        setError('All defendant names are required');
        return;
      }
      
      if (documents.length === 0) {
        setError('At least one document is required');
        return;
      }
      
      // Upload documents
      const uploadedDocuments = [];
      for (const doc of documents) {
        try {
          const sanitizedFileName = doc.name.replace(/[^a-zA-Z0-9.]/g, '_');
          const downloadUrl = await uploadPublicFile(doc.file, sanitizedFileName);
          
          uploadedDocuments.push({
            id: doc.id,
            name: doc.name,
            size: doc.size,
            type: doc.type,
            downloadUrl,
            uploadedAt: new Date(),
            isPublic: false // Default to not public until approved
          });
        } catch (error) {
          console.error('Error uploading document:', error);
          throw new Error(`Failed to upload document: ${doc.name}`);
        }
      }
      
      // Create case
      const caseData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        plaintiffs: formData.plaintiffs,
        defendants: formData.defendants,
        documents: uploadedDocuments,
        createdBy: user.id,
      };
      
      const newCase = await createPublicCase(caseData);
      
      setSuccess(true);
      
      // Redirect to case details after a delay
      setTimeout(() => {
        router.push(`/public/cases/${newCase.id}`);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error filing case:', error);
      setError(error.message || 'Failed to file case. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <X className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-lg font-medium">Error</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <div className="mt-6">
                <Button onClick={() => router.push('/public/dashboard')}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-lg font-medium">Case Filed Successfully</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your case has been submitted and is under review.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                You will be redirected to the case details shortly.
              </p>
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-orange-600 mt-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/public/dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">File a Case</h1>
        <p className="text-gray-600">
          Submit a new case to the court system
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Case Information</CardTitle>
            <CardDescription>
              Basic details about the case
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Case Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter case title"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter case description"
                rows={3}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Case Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as CaseType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="criminal">Criminal</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="constitutional">Constitutional</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as CasePriority })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
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
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Plaintiffs</CardTitle>
            <CardDescription>
              Parties filing the case
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.plaintiffs.map((plaintiff, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">Plaintiff {index + 1}</h4>
                  {formData.plaintiffs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlaintiff(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`plaintiff-name-${index}`}>Name *</Label>
                    <Input
                      id={`plaintiff-name-${index}`}
                      value={plaintiff.name}
                      onChange={(e) => updatePlaintiff(index, 'name', e.target.value)}
                      placeholder="Enter name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`plaintiff-type-${index}`}>Type</Label>
                    <Select
                      value={plaintiff.type}
                      onValueChange={(value) => updatePlaintiff(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addPlaintiff}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Plaintiff
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Defendants</CardTitle>
            <CardDescription>
              Parties being sued
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.defendants.map((defendant, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">Defendant {index + 1}</h4>
                  {formData.defendants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDefendant(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`defendant-name-${index}`}>Name *</Label>
                    <Input
                      id={`defendant-name-${index}`}
                      value={defendant.name}
                      onChange={(e) => updateDefendant(index, 'name', e.target.value)}
                      placeholder="Enter name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`defendant-type-${index}`}>Type</Label>
                    <Select
                      value={defendant.type}
                      onValueChange={(value) => updateDefendant(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addDefendant}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Defendant
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Supporting Documents</CardTitle>
            <CardDescription>
              Upload documents related to this case
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Documents
              </Button>
            </div>
            
            {documents.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Uploaded Documents</h4>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-500 mr-2" />
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-sm text-gray-500">
                            {(doc.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(doc.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/public/dashboard')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Filing Case...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                File Case
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
