//app/clerk/cases/[id]/edit/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, FileText, Upload, Calendar, User } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { HearingScheduler } from '@/components/clerk/HearingScheduler';

interface CaseDetail {
  id: string;
  title: string;
  caseNumber: string;
  description: string;
  plaintiff: string;
  defendant: string;
  filingDate: Date;
  status: 'pending' | 'verified' | 'rejected' | 'summons' | 'active';
  courtId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  judgeId?: string;
  hearingId?: string;
}

interface Document {
  id: string;
  title: string;
  type: string;
  uploadedBy: string;
  uploadedAt: Date;
  url: string;
}

interface Hearing {
  id: string;
  caseId: string;
  date: Date;
  time: string;
  courtroom: string;
  judgeId: string;
  notes: string;
  scheduledBy: string;
  scheduledAt: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export default function ClerkCaseEdit() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: '',
    type: '',
    file: null as File | null,
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    plaintiff: '',
    defendant: '',
  });

  useEffect(() => {
    const fetchUserAndCase = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }

        // Normalize role
        const userRole = currentUser.profile?.adminType ?? currentUser.role;
        
        // Check if user has appropriate role
        if (!['clerk', 'court-clerk', 'admin'].includes(userRole)) {
          router.push('/unauthorized');
          return;
        }

        setUser(currentUser);
        
        // Fetch case details (in a real app, this would be an API call)
        // For now, we'll use mock data
        const mockCaseDetail: CaseDetail = {
          id: caseId,
          title: 'Smith vs. Johnson',
          caseNumber: 'CV-2023-001',
          description: 'Contract dispute regarding services rendered. The plaintiff claims that the defendant failed to deliver services as per the agreement dated January 15, 2023.',
          plaintiff: 'John Smith',
          defendant: 'Sarah Johnson',
          filingDate: new Date('2023-08-15'),
          status: 'active',
          courtId: 'court-1',
          priority: 'medium',
        };
        
        setCaseDetail(mockCaseDetail);
        setFormData({
          title: mockCaseDetail.title,
          description: mockCaseDetail.description,
          plaintiff: mockCaseDetail.plaintiff,
          defendant: mockCaseDetail.defendant,
        });
        
        // Fetch case documents (in a real app, this would be an API call)
        const mockDocuments: Document[] = [
          {
            id: 'doc-1',
            title: 'Contract Agreement',
            type: 'contract',
            uploadedBy: 'John Smith',
            uploadedAt: new Date('2023-08-15'),
            url: '/documents/contract-agreement.pdf',
          },
          {
            id: 'doc-2',
            title: 'Proof of Payment',
            type: 'receipt',
            uploadedBy: 'John Smith',
            uploadedAt: new Date('2023-08-15'),
            url: '/documents/proof-of-payment.pdf',
          },
        ];
        
        setDocuments(mockDocuments);
        
        // Fetch hearings (in a real app, this would be an API call)
        const mockHearings: Hearing[] = [
          {
            id: 'hearing-1',
            caseId,
            date: new Date('2023-09-15'),
            time: '10:00',
            courtroom: 'Courtroom A',
            judgeId: 'judge-1',
            notes: 'Initial hearing to discuss case timeline',
            scheduledBy: user.id,
            scheduledAt: new Date('2023-08-20'),
            status: 'scheduled',
          },
        ];
        
        setHearings(mockHearings);
      } catch (error) {
        console.error('Error fetching user or case:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndCase();
  }, [caseId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCase = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would be an API call
      // await fetch(`/api/clerk/cases/${caseId}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(formData),
      // });

      // Update local state
      if (caseDetail) {
        setCaseDetail({
          ...caseDetail,
          ...formData,
        });
      }

      alert('Case updated successfully!');
    } catch (error) {
      console.error('Error updating case:', error);
      alert('Failed to update case. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewDocument({
        ...newDocument,
        file: e.target.files[0],
      });
    }
  };

  const handleUploadDocument = async () => {
    if (!newDocument.title || !newDocument.type || !newDocument.file) {
      alert('Please fill in all fields and select a file.');
      return;
    }

    setIsUploading(true);
    try {
      // In a real app, this would be an API call with file upload
      // const formData = new FormData();
      // formData.append('title', newDocument.title);
      // formData.append('type', newDocument.type);
      // formData.append('file', newDocument.file);
      // formData.append('caseId', caseId);
      
      // const response = await fetch('/api/clerk/documents', {
      //   method: 'POST',
      //   body: formData,
      // });
      
      // const newDoc = await response.json();
      
      // Update local state with mock data
      const newDoc: Document = {
        id: `doc-${documents.length + 1}`,
        title: newDocument.title,
        type: newDocument.type,
        uploadedBy: user?.displayName || 'Clerk',
        uploadedAt: new Date(),
        url: '/documents/new-document.pdf',
      };
      
      setDocuments([...documents, newDoc]);
      setNewDocument({
        title: '',
        type: '',
        file: null,
      });
      
      alert('Document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleScheduleHearing = async (data: {
    caseId: string;
    date: string;
    time: string;
    courtroom: string;
    judgeId: string;
    notes?: string;
  }) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/clerk/schedule-hearing', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(data),
      // });
      
      // const newHearing = await response.json();
      
      // Update local state with mock data
      const newHearing: Hearing = {
        id: `hearing-${hearings.length + 1}`,
        caseId: data.caseId,
        date: new Date(data.date),
        time: data.time,
        courtroom: data.courtroom,
        judgeId: data.judgeId,
        notes: data.notes || '',
        scheduledBy: user?.id || '',
        scheduledAt: new Date(),
        status: 'scheduled',
      };
      
      setHearings([...hearings, newHearing]);
      
      alert('Hearing scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling hearing:', error);
      alert('Failed to schedule hearing. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'summons':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHearingStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!caseDetail) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Case Not Found</h3>
            <p className="text-gray-600 text-center mb-4">
              The case you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => router.push('/clerk/cases')}>
              Back to Cases
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/clerk/cases')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cases
        </Button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Case</h1>
            <p className="text-gray-600">Case #{caseDetail.caseNumber}</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Badge className={getStatusColor(caseDetail.status)}>
              {caseDetail.status}
            </Badge>
            <Badge className={getPriorityColor(caseDetail.priority)}>
              {caseDetail.priority} priority
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Case Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="hearings">Hearings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Case Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="plaintiff">Plaintiff</Label>
                      <Input
                        id="plaintiff"
                        name="plaintiff"
                        value={formData.plaintiff}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="defendant">Defendant</Label>
                      <Input
                        id="defendant"
                        name="defendant"
                        value={formData.defendant}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleSaveCase} disabled={isSaving}>
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload New Document</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="docTitle">Document Title</Label>
                    <Input
                      id="docTitle"
                      value={newDocument.title}
                      onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="docType">Document Type</Label>
                    <Select 
                      value={newDocument.type} 
                      onValueChange={(value) => setNewDocument({...newDocument, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="evidence">Evidence</SelectItem>
                        <SelectItem value="affidavit">Affidavit</SelectItem>
                        <SelectItem value="motion">Motion</SelectItem>
                        <SelectItem value="order">Order</SelectItem>
                        <SelectItem value="receipt">Receipt</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="docFile">File</Label>
                    <Input
                      id="docFile"
                      type="file"
                      onChange={handleFileChange}
                    />
                  </div>
                  
                  <Button onClick={handleUploadDocument} disabled={isUploading}>
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? 'Uploading...' : 'Upload Document'}
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Case Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No documents uploaded yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {documents.map((document) => (
                        <div key={document.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{document.title}</p>
                            <p className="text-sm text-gray-500">
                              {document.type} • Uploaded by {document.uploadedBy} on{' '}
                              {new Date(document.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={document.url} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="hearings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Hearing</CardTitle>
                </CardHeader>
                <CardContent>
                  <HearingScheduler
                    caseId={caseId}
                    caseTitle={caseDetail.title}
                    courtId={caseDetail.courtId}
                    onScheduleHearing={handleScheduleHearing}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Hearings</CardTitle>
                </CardHeader>
                <CardContent>
                  {hearings.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No hearings scheduled yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {hearings.map((hearing) => (
                        <div key={hearing.id} className="p-4 border rounded">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium">Hearing</h3>
                            <Badge className={getHearingStatusColor(hearing.status)}>
                              {hearing.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                              <span>{new Date(hearing.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-gray-500" />
                              <span>{hearing.time}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                              <span>{hearing.courtroom}</span>
                            </div>
                            <div className="flex items-center">
                              <User className="mr-2 h-4 w-4 text-gray-500" />
                              <span>Judge ID: {hearing.judgeId}</span>
                            </div>
                          </div>
                          
                          {hearing.notes && (
                            <div className="mt-3">
                              <p className="text-sm font-medium">Notes:</p>
                              <p className="text-sm text-gray-600">{hearing.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Case Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Case Number</p>
                <p className="font-medium">{caseDetail.caseNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge className={getStatusColor(caseDetail.status)}>
                  {caseDetail.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <Badge className={getPriorityColor(caseDetail.priority)}>
                  {caseDetail.priority}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Filing Date</p>
                <p className="font-medium">
                  {new Date(caseDetail.filingDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Court</p>
                <p className="font-medium">High Court</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Upload Documents
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                View Calendar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
