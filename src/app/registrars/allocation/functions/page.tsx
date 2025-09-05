// app/registrars/allocation/functions/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Users, Scale, FileText, Check, X } from 'lucide-react';
import { getCurrentUser, getOrCreateCourt, getCasesByCourt, getUsersByRole } from '@/lib/auth';
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/constants/firebase/config';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';
import { Case } from '@/models';

interface AllocationData {
  caseId: string;
  judgeId: string;
}

export default function AllocationFunctionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [unallocatedCases, setUnallocatedCases] = useState<Case[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [selectedJudge, setSelectedJudge] = useState<string>('');

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        setUser(currentUser);
        
        const courtType = currentUser.profile?.courtType;
        const courtLocation = currentUser.profile?.courtLocation;
        
        if (!courtType || !courtLocation) {
          setError('Your profile is missing court information. Please contact your system administrator.');
          setLoading(false);
          return;
        }
        
        const court = await getOrCreateCourt(courtType, courtLocation);
        const courtId = court.id;
        
        const courtCases = await getCasesByCourt(courtId);
        setCases(courtCases);
        
        const allJudges = await getUsersByRole('judge');
        setJudges(allJudges);
        
        const unallocated = courtCases.filter((caseItem: Case) => !caseItem.assignedTo);
        setUnallocatedCases(unallocated);
      } catch (error) {
        console.error('Error fetching user or data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndData();
  }, [router]);

  const handleAllocateCase = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setSelectedJudge('');
    setIsDialogOpen(true);
  };

  const handleAllocate = async () => {
    if (!selectedCase || !selectedJudge) return;
    
    try {
      const caseRef = doc(db, COLLECTIONS.CASES, selectedCase.id);
      await updateDoc(caseRef, {
        assignedTo: selectedJudge,
        updatedAt: new Date(),
      });
      
      const judgeRef = doc(db, COLLECTIONS.USERS, selectedJudge);
      const judgeDoc = await getDoc(judgeRef);
      
      if (judgeDoc.exists()) {
        const judgeData = judgeDoc.data();
        const assignedCases = judgeData.profile?.assignedCases || [];
        
        if (!assignedCases.some((ref: any) => ref.id === selectedCase.id)) {
          await updateDoc(judgeRef, {
            'profile.assignedCases': [...assignedCases, caseRef],
            updatedAt: new Date(),
          });
        }
      }
      
      setCases(prevCases => 
        prevCases.map(caseItem => 
          caseItem.id === selectedCase.id
            ? { ...caseItem, assignedTo: selectedJudge }
            : caseItem
        )
      );
      
      setUnallocatedCases(prevCases => prevCases.filter(caseItem => caseItem.id !== selectedCase.id));
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error allocating case:', error);
      alert('Failed to allocate case. Please try again.');
    }
  };

  const handleViewJudgeWorkload = (judgeId: string) => {
    // Navigate to judge workload page
    router.push(`/registrars/judge-workload/${judgeId}`);
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
              <Users className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-lg font-medium">Error</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <div className="mt-6">
                <Button onClick={() => router.push('/registrars/dashboard')}>
                  Back to Dashboard
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
          onClick={() => router.push('/registrars/dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Case Allocation</h1>
        <p className="text-gray-600">
          Allocate cases to judges based on availability and expertise.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Unallocated Cases
            </CardTitle>
            <CardDescription>
              Cases that need to be assigned to a judge
            </CardDescription>
          </CardHeader>
          <CardContent>
            {unallocatedCases.length > 0 ? (
              <div className="space-y-4">
                {unallocatedCases.map((caseItem) => (
                  <div key={caseItem.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{caseItem.title}</h3>
                        <p className="text-sm text-gray-600">{caseItem.caseNumber}</p>
                        <p className="text-sm text-gray-600 mt-1">{caseItem.description}</p>
                      </div>
                      <Badge className={getStatusColor(caseItem.status)}>
                        {getStatusLabel(caseItem.status)}
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <Button
                        size="sm"
                        onClick={() => handleAllocateCase(caseItem)}
                      >
                        Allocate Case
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">No unallocated cases</h3>
                <p className="mt-1 text-sm text-gray-500">All cases have been assigned to judges.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scale className="mr-2 h-5 w-5" />
              Available Judges
            </CardTitle>
            <CardDescription>
              Judges available for case allocation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {judges.length > 0 ? (
              <div className="space-y-4">
                {judges.map((judge) => (
                  <div key={judge.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{judge.displayName}</h3>
                        <p className="text-sm text-gray-600">{judge.email}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {judge.profile?.courtType} - {judge.profile?.courtLocation}
                        </p>
                      </div>
                      <Badge variant="outline">Judge</Badge>
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewJudgeWorkload(judge.id)}
                      >
                        View Workload
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Scale className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">No judges available</h3>
                <p className="mt-1 text-sm text-gray-500">There are no judges in the system.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Allocate Case to Judge</DialogTitle>
            <DialogDescription>
              Select a judge to allocate this case to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedCase && (
              <div className="mb-4">
                <h3 className="font-medium">{selectedCase.title}</h3>
                <p className="text-sm text-gray-600">{selectedCase.caseNumber}</p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Judge:</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedJudge}
                onChange={(e) => setSelectedJudge(e.target.value)}
              >
                <option value="">Select a judge</option>
                {judges.map(judge => (
                  <option key={judge.id} value={judge.id}>
                    {judge.displayName} - {judge.profile?.courtType}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleAllocate} disabled={!selectedJudge}>
              <Check className="mr-2 h-4 w-4" />
              Allocate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
  
  // Helper functions
  function getStatusColor(status: string) {
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
  }
  
  function getStatusLabel(status: string) {
    switch (status) {
      case 'filed':
        return 'Case Filed';
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'summons':
        return 'Summons Issued';
      case 'takes_off':
        return 'Case Takes Off';
      case 'recording':
        return 'Recording Stage';
      case 'adjournment':
        return 'Adjournment';
      case 'ruling':
        return 'Ruling';
      case 'appeal':
        return 'Appeal';
      case 'closed':
        return 'Closed';
      case 'dismissed':
        return 'Dismissed';
      default:
        return status;
    }
  }
}
