// app/clerk/cases/[id]/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Upload, Save, Plus, X, FileText } from 'lucide-react';
import { getCurrentUser, getCaseById } from '@/lib/auth';
import { Case } from '@/models';

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCase, setEditedCase] = useState<Partial<Case> | null>(null);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);

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
        if (!['admin', 'court-admin', 'clerk', 'court-clerk'].includes(userRole)) {
          router.push('/unauthorized');
          return;
        }
        
        setUser(currentUser);
        
        // Fetch case data
        const caseDetails = await getCaseById(caseId);
        if (!caseDetails) {
          setError('Case not found');
          setLoading(false);
          return;
        }
        
        setCaseData(caseDetails);
        setEditedCase(caseDetails);
      } catch (error) {
        console.error('Error fetching user or case:', error);
        setError('Failed to load case data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndCase();
  }, [router, caseId]);

  const handleEditCase = () => {
    setIsEditing(true);
    setEditedCase(caseData ? { ...caseData } : null);
  };

  const handleSaveCase = async () => {
    if (!editedCase || !user) return;
    
    try {
      // In a real implementation, you would update the case in Firebase
      // For now, we'll just update the local state
      setCaseData(editedCase as Case);
      setIsEditing(false);
      
      // Show success message
      alert('Case updated successfully');
    } catch (error) {
      console.error('Error updating case:', error);
      alert('Failed to update case. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedCase(caseData ? { ...caseData } : null);
  };

  const handleUploadDocument = () => {
    setIsDocumentDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filed':
        return 'bg-blue-100 text-blue-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'summons':
        return 'bg-purple-100 text-purple-800';
      case 'takes_off':
        return 'bg-cyan-100 text-cyan-800';
      case 'recording':
        return 'bg-yellow-100 text-yellow-800';
      case 'adjournment':
        return 'bg-orange-100 text-orange-800';
      case 'ruling':
        return 'bg-indigo-100 text-indigo-800';
      case 'appeal':
        return 'bg-pink-100 text-pink-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'dismissed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
                <Button onClick={() => router.push('/clerk/cases')}>
                  Back to Cases
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">Case Not Found</h3>
              <p className="mt-1 text-sm text-gray-500">The requested case could not be found.</p>
              <div className="mt-6">
                <Button onClick={() => router.push('/clerk/cases')}>
                  Back to Cases
                </Button>
              </div>
            </div>
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{caseData.title}</h1>
            <p className="text-gray-600">
              {caseData.caseNumber} • {new Date(caseData.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge className={getStatusColor(caseData.status)}>
            {caseData.status.charAt(0).toUpperCase() + caseData.status.slice(1)}
          </Badge>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="parties">Parties</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Case Information</CardTitle>
              <CardDescription>
                Basic details about the case
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="title">Case Title</Label>
                    <Input
                      id="title"
                      value={editedCase?.title || ''}
                      onChange={(e) => setEditedCase({...editedCase, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editedCase?.description || ''}
                      onChange={(e) => setEditedCase({...editedCase, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Case Type</Label>
                      <Input
                        id="type"
                        value={editedCase?.type || ''}
                        onChange={(e) => setEditedCase({...editedCase, type: e.target.value as any})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Input
                        id="priority"
                        value={editedCase?.priority || ''}
                        onChange={(e) => setEditedCase({...editedCase, priority: e.target.value as any})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveCase}>
                      Save Changes
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Case Title</p>
                      <p className="text-lg">{caseData.title}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Case Number</p>
                      <p className="text-lg">{caseData.caseNumber}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Case Type</p>
                      <p className="text-lg capitalize">{caseData.type}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Priority</p>
                      <p className="text-lg capitalize">{caseData.priority}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-lg">{caseData.description}</p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleEditCase}>
                      Edit Case
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="parties" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Plaintiffs</CardTitle>
                <CardDescription>
                  Parties filing the case
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {caseData.plaintiffs.map((plaintiff, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{plaintiff.name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{plaintiff.type}</p>
                          {plaintiff.contactInfo && (
                            <div className="mt-2 text-sm">
                              {plaintiff.contactInfo.email && (
                                <p>Email: {plaintiff.contactInfo.email}</p>
                              )}
                              {plaintiff.contactInfo.phone && (
                                <p>Phone: {plaintiff.contactInfo.phone}</p>
                              )}
                              {plaintiff.contactInfo.address && (
                                <p>Address: {plaintiff.contactInfo.address}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline">Plaintiff {index + 1}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Defendants</CardTitle>
                <CardDescription>
                  Parties being sued
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {caseData.defendants.map((defendant, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{defendant.name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{defendant.type}</p>
                          {defendant.contactInfo && (
                            <div className="mt-2 text-sm">
                              {defendant.contactInfo.email && (
                                <p>Email: {defendant.contactInfo.email}</p>
                              )}
                              {defendant.contactInfo.phone && (
                                <p>Phone: {defendant.contactInfo.phone}</p>
                              )}
                              {defendant.contactInfo.address && (
                                <p>Address: {defendant.contactInfo.address}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline">Defendant {index + 1}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Case Documents</CardTitle>
                  <CardDescription>
                    Documents related to this case
                  </CardDescription>
                </div>
                <Button onClick={handleUploadDocument}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {caseData.documents && caseData.documents.length > 0 ? (
                <div className="space-y-4">
                  {caseData.documents.map((document, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{document.name}</h4>
                          <p className="text-sm text-gray-600">
                            {document.type} • {new Date(document.uploadedAt).toLocaleDateString()}
                          </p>
                          {document.description && (
                            <p className="text-sm mt-1">{document.description}</p>
                          )}
                        </div>
                        <Badge variant="outline">{document.category}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">No documents</h3>
                  <p className="text-gray-600">No documents have been uploaded for this case yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Case History</CardTitle>
              <CardDescription>
                Timeline of events and status changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {caseData.statusHistory && caseData.statusHistory.length > 0 ? (
                <div className="space-y-4">
                  {caseData.statusHistory.map((history, index) => (
                    <div key={index} className="border-l-2 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-medium">
                            Status changed to {history.newStatus}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {new Date(history.changedAt).toLocaleString()}
                          </p>
                          {history.reason && (
                            <p className="text-sm mt-1">Reason: {history.reason}</p>
                          )}
                        </div>
                        <Badge className={getStatusColor(history.status)}>
                          {history.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">No history</h3>
                  <p className="text-gray-600">No status changes have been recorded for this case yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document related to this case.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="document-name">Document Name</Label>
              <Input id="document-name" placeholder="Enter document name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pleading">Pleading</SelectItem>
                  <SelectItem value="evidence">Evidence</SelectItem>
                  <SelectItem value="motion">Motion</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="correspondence">Correspondence</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-description">Description</Label>
              <Textarea id="document-description" placeholder="Enter document description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-file">Select File</Label>
              <Input id="document-file" type="file" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDocumentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsDocumentDialogOpen(false)}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
