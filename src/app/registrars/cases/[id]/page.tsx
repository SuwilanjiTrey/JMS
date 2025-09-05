//app/registrars/cases/[id]/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getCurrentUser } from '@/lib/auth';
import { ArrowLeft, FileText, Calendar, User, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

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
  filingValidation?: {
    status: 'verified' | 'rejected';
    validatedBy: string;
    validatedAt: Date;
    reasons?: string;
  };
  summons?: {
    issuedBy: string;
    issuedAt: Date;
    summonsDate: Date;
    notes?: string;
  };
}

interface Document {
  id: string;
  title: string;
  type: string;
  uploadedBy: string;
  uploadedAt: Date;
  url: string;
}

export default function RegistrarCaseDetail() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isValidateDialogOpen, setIsValidateDialogOpen] = useState(false);
  const [isSummonsDialogOpen, setIsSummonsDialogOpen] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'verified' | 'rejected'>('verified');
  const [reasons, setReasons] = useState('');
  const [summonsDate, setSummonsDate] = useState('');
  const [summonsNotes, setSummonsNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
        if (!['admin', 'court-admin', 'registrar', 'court-registrar'].includes(userRole)) {
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
          status: 'pending',
          courtId: 'court-1',
          priority: 'medium',
        };
        
        setCaseDetail(mockCaseDetail);
        
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
          {
            id: 'doc-3',
            title: 'Correspondence',
            type: 'letter',
            uploadedBy: 'Sarah Johnson',
            uploadedAt: new Date('2023-08-10'),
            url: '/documents/correspondence.pdf',
          },
        ];
        
        setDocuments(mockDocuments);
      } catch (error) {
        console.error('Error fetching user or case:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndCase();
  }, [caseId, router]);

  const handleValidate = async () => {
    setIsProcessing(true);
    try {
      // In a real app, this would be an API call
      const response = await fetch('/api/registrar/validate-filing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId,
          status: validationStatus,
          reasons,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate filing');
      }

      // Update case in local state
      if (caseDetail) {
        setCaseDetail({
          ...caseDetail,
          status: validationStatus === 'verified' ? 'active' : 'rejected',
          filingValidation: {
            status: validationStatus,
            validatedBy: user?.id,
            validatedAt: new Date(),
            reasons,
          },
        });
      }

      setIsValidateDialogOpen(false);
      setReasons('');
    } catch (error) {
      console.error('Error validating filing:', error);
      alert('Failed to validate filing. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIssueSummons = async () => {
    setIsProcessing(true);
    try {
      // In a real app, this would be an API call
      const response = await fetch('/api/registrar/issue-summons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId,
          issuedBy: user?.id,
          summonsDate,
          notes: summonsNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to issue summons');
      }

      // Update case in local state
      if (caseDetail) {
        setCaseDetail({
          ...caseDetail,
          status: 'summons',
          summons: {
            issuedBy: user?.id,
            issuedAt: new Date(),
            summonsDate: new Date(summonsDate),
            notes: summonsNotes,
          },
        });
      }

      setIsSummonsDialogOpen(false);
      setSummonsDate('');
      setSummonsNotes('');
    } catch (error) {
      console.error('Error issuing summons:', error);
      alert('Failed to issue summons. Please try again.');
    } finally {
      setIsProcessing(false);
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

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!caseDetail) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Case Not Found</h3>
            <p className="text-gray-600 text-center mb-4">
              The case you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => router.push('/registrars/cases')}>
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
          onClick={() => router.push('/registrars/cases')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cases
        </Button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{caseDetail.title}</h1>
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
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Case Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-gray-700">{caseDetail.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-2 flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Plaintiff
                      </h3>
                      <p className="text-gray-700">{caseDetail.plaintiff}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2 flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Defendant
                      </h3>
                      <p className="text-gray-700">{caseDetail.defendant}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2 flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Filing Date
                      </h3>
                      <p className="text-gray-700">
                        {new Date(caseDetail.filingDate).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Court</h3>
                      <p className="text-gray-700">High Court</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {caseDetail.filingValidation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {caseDetail.filingValidation.status === 'verified' ? (
                        <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="mr-2 h-5 w-5 text-red-500" />
                      )}
                      Filing Validation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Status:</span>{' '}
                        {caseDetail.filingValidation.status === 'verified' ? 'Verified' : 'Rejected'}
                      </p>
                      <p>
                        <span className="font-medium">Validated by:</span> Registrar
                      </p>
                      <p>
                        <span className="font-medium">Date:</span>{' '}
                        {new Date(caseDetail.filingValidation.validatedAt).toLocaleDateString()}
                      </p>
                      {caseDetail.filingValidation.reasons && (
                        <div>
                          <p className="font-medium">Reasons:</p>
                          <p className="text-gray-700">{caseDetail.filingValidation.reasons}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {caseDetail.summons && (
                <Card>
                  <CardHeader>
                    <CardTitle>Summons Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Issued by:</span> Registrar
                      </p>
                      <p>
                        <span className="font-medium">Issued at:</span>{' '}
                        {new Date(caseDetail.summons.issuedAt).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Summons date:</span>{' '}
                        {new Date(caseDetail.summons.summonsDate).toLocaleDateString()}
                      </p>
                      {caseDetail.summons.notes && (
                        <div>
                          <p className="font-medium">Notes:</p>
                          <p className="text-gray-700">{caseDetail.summons.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-4">
              {documents.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Documents</h3>
                    <p className="text-gray-600 text-center">
                      There are no documents associated with this case.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                documents.map((document) => (
                  <Card key={document.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{document.title}</CardTitle>
                      <CardDescription>
                        {document.type} • Uploaded by {document.uploadedBy} on{' '}
                        {new Date(document.uploadedAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild>
                        <a href={document.url} target="_blank" rel="noopener noreferrer">
                          View Document
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Case History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        action: 'Case filed',
                        date: new Date(caseDetail.filingDate),
                        user: caseDetail.plaintiff,
                      },
                      ...(caseDetail.filingValidation
                        ? [
                            {
                              action: `Filing ${caseDetail.filingValidation.status}`,
                              date: new Date(caseDetail.filingValidation.validatedAt),
                              user: 'Registrar',
                            },
                          ]
                        : []),
                      ...(caseDetail.summons
                        ? [
                            {
                              action: 'Summons issued',
                              date: new Date(caseDetail.summons.issuedAt),
                              user: 'Registrar',
                            },
                          ]
                        : []),
                    ].map((event, index) => (
                      <div key={index} className="flex items-start">
                        <div className="bg-gray-100 rounded-full p-2 mr-3">
                          <Calendar className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{event.action}</p>
                          <p className="text-sm text-gray-600">
                            By {event.user} on {event.date.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {caseDetail.status === 'pending' && (
                <Dialog open={isValidateDialogOpen} onOpenChange={setIsValidateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      Validate Filing
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Validate Case Filing</DialogTitle>
                      <DialogDescription>
                        Review the case filing and decide whether to verify or reject it.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex space-x-4">
                        <Button
                          variant={validationStatus === 'verified' ? 'default' : 'outline'}
                          onClick={() => setValidationStatus('verified')}
                          className="flex-1"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Verify
                        </Button>
                        <Button
                          variant={validationStatus === 'rejected' ? 'destructive' : 'outline'}
                          onClick={() => setValidationStatus('rejected')}
                          className="flex-1"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                      <div>
                        <Label htmlFor="reasons">Reasons (if rejected)</Label>
                        <Textarea
                          id="reasons"
                          placeholder="Provide reasons for rejection..."
                          value={reasons}
                          onChange={(e) => setReasons(e.target.value)}
                          disabled={validationStatus === 'verified'}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsValidateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleValidate} disabled={isProcessing}>
                        {isProcessing ? 'Processing...' : 'Submit Decision'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              
              {caseDetail.status === 'verified' && (
                <Dialog open={isSummonsDialogOpen} onOpenChange={setIsSummonsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      Issue Summons
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Issue Summons</DialogTitle>
                      <DialogDescription>
                        Create a summons for this case.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="summonsDate">Summons Date</Label>
                        <Input
                          id="summonsDate"
                          type="date"
                          value={summonsDate}
                          onChange={(e) => setSummonsDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <Label htmlFor="summonsNotes">Notes</Label>
                        <Textarea
                          id="summonsNotes"
                          placeholder="Additional notes for the summons..."
                          value={summonsNotes}
                          onChange={(e) => setSummonsNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsSummonsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleIssueSummons} disabled={isProcessing || !summonsDate}>
                        {isProcessing ? 'Processing...' : 'Issue Summons'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              
              <Button variant="outline" className="w-full">
                Assign to Clerk
              </Button>
              
              <Button variant="outline" className="w-full">
                Download Case File
              </Button>
            </CardContent>
          </Card>
          
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
                <p className="text-sm text-gray-500">Court</p>
                <p className="font-medium">High Court</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
