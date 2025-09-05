// app/registrars/allocation/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Scale, FileText } from 'lucide-react';
import { getCurrentUser, getOrCreateCourt, getCasesByCourt, getUsersByRole } from '@/lib/auth';
import { Case } from '@/models';

export default function RegistrarAllocation() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [unallocatedCases, setUnallocatedCases] = useState<Case[]>([]);

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        // Get current user
        const currentUser = await getCurrentUser();
        
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        setUser(currentUser);
        
        // Get court information from user profile
        const courtType = currentUser.profile?.courtType;
        const courtLocation = currentUser.profile?.courtLocation;
        
        if (!courtType || !courtLocation) {
          setError('Your profile is missing court information. Please contact your system administrator.');
          setLoading(false);
          return;
        }
        
        // Get or create court
        const court = await getOrCreateCourt(courtType, courtLocation);
        const courtId = court.id;
        
        // Fetch cases for this court
        const courtCases = await getCasesByCourt(courtId);
        setCases(courtCases);
        
        // Fetch judges
        const allJudges = await getUsersByRole('judge');
        setJudges(allJudges);
        
        // Filter unallocated cases
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

  const handleAllocateCase = (caseId: string) => {
    // Navigate to case allocation page
    router.push(`/registrars/allocation/${caseId}`);
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
                        onClick={() => handleAllocateCase(caseItem.id)}
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
