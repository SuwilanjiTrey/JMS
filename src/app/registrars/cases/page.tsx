// app/registrars/cases/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CaseVerificationCard } from '@/components/registrar/CaseVerificationCard';
import { getCurrentUser, getCasesByCourt, getOrCreateCourt } from '@/lib/auth';
import { Case, CaseStatus } from '@/models';
import { Search, Filter, ArrowLeft } from 'lucide-react';

export default function RegistrarCases() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [searchTerm, setSearchTerm] = useState('');


useEffect(() => {
  const fetchUserAndCases = async () => {
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
      
      // Get court information from user profile
      const courtType = currentUser.profile?.courtType;
      const courtLocation = currentUser.profile?.courtLocation;
      
  if (!courtType || !courtLocation) {
  setError('Your profile is missing court information. Please contact your system administrator.');
  setLoading(false);
  return;
}
      const court = await getOrCreateCourt(courtType, courtLocation);
	const courtId = court.id;

	// Fetch cases for this court
	const courtCases = await getCasesByCourt(courtId);
      setCases(courtCases);
    } catch (error) {
      console.error('Error fetching user or cases:', error);
      setError('Failed to load cases. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  fetchUserAndCases();
}, [router]);

  useEffect(() => {
    // Filter cases based on URL parameter and search term
    let result = cases;
    
    if (filter !== 'all') {
      result = result.filter(caseItem => caseItem.status === filter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        caseItem => 
          caseItem.title.toLowerCase().includes(term) ||
          caseItem.caseNumber.toLowerCase().includes(term) ||
          caseItem.plaintiffs.some(p => p.name.toLowerCase().includes(term)) ||
          caseItem.defendants.some(d => d.name.toLowerCase().includes(term))
      );
    }
    
    setFilteredCases(result);
  }, [cases, filter, searchTerm]);

  const handleValidate = async (caseId: string, status: 'verified' | 'rejected', reasons?: string) => {
    try {
      const response = await fetch('/api/registrar/validate-filing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId,
          status,
          reasons,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to validate filing');
      }
      
      const data = await response.json();
      
      // Update case in local state
      setCases(prevCases =>
        prevCases.map(caseItem =>
          caseItem.id === caseId
            ? { ...caseItem, status: status as CaseStatus }
            : caseItem
        )
      );
      
      // Show success message
      alert(`Case ${status === 'verified' ? 'verified' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Error validating filing:', error);
      alert('Failed to validate filing. Please try again.');
    }
  };

  const handleIssueSummons = async (caseId: string, summonsDate: string, notes?: string) => {
    try {
      const response = await fetch('/api/registrar/issue-summons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId,
          issuedBy: user?.id,
          summonsDate,
          notes,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to issue summons');
      }
      
      const data = await response.json();
      
      // Update case in local state
      setCases(prevCases =>
        prevCases.map(caseItem =>
          caseItem.id === caseId
            ? { ...caseItem, status: 'summons' as CaseStatus }
            : caseItem
        )
      );
      
      // Show success message
      alert('Summons issued successfully');
    } catch (error) {
      console.error('Error issuing summons:', error);
      alert('Failed to issue summons. Please try again.');
    }
  };

  const getStatusColor = (status: CaseStatus) => {
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
              <Filter className="mx-auto h-12 w-12 text-red-500" />
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
        <h1 className="text-3xl font-bold">Case Management</h1>
        <p className="text-gray-600">
          Review and verify case filings, issue summons when necessary.
        </p>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search cases..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => router.push('/registrars/cases?filter=all')}
          >
            All Cases
          </Button>
          <Button
            variant={filter === 'filed' ? 'default' : 'outline'}
            onClick={() => router.push('/registrars/cases?filter=filed')}
          >
            Filed
          </Button>
          <Button
            variant={filter === 'verified' ? 'default' : 'outline'}
            onClick={() => router.push('/registrars/cases?filter=verified')}
          >
            Verified
          </Button>
          <Button
            variant={filter === 'summons' ? 'default' : 'outline'}
            onClick={() => router.push('/registrars/cases?filter=summons')}
          >
            Summons
          </Button>
        </div>
      </div>
      
      {filteredCases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No cases found</h3>
            <p className="text-gray-600 text-center">
              {searchTerm
                ? 'No cases match your search criteria.'
                : filter === 'all'
                ? 'There are no cases in the system.'
                : `There are no cases with status "${filter}".`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredCases.map((caseItem) => (
            <CaseVerificationCard
              key={caseItem.id}
              caseData={caseItem}
              onValidate={handleValidate}
              onIssueSummons={handleIssueSummons}
            />
          ))}
        </div>
      )}
    </div>
  );
}
