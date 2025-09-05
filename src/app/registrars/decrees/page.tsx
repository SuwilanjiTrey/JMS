// app/registrars/decrees/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Scale, Plus, Edit, Trash2, FileText } from 'lucide-react';
import { getCurrentUser, getOrCreateCourt } from '@/lib/auth';
import { collection, getDocs, query, where, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/constants/firebase/config';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';

export default function RegistrarDecrees() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decrees, setDecrees] = useState<any[]>([]);
  const [filteredDecrees, setFilteredDecrees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUserAndDecrees = async () => {
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
        
        // Query decrees for this court
        const decreesRef = collection(db, COLLECTIONS.DECREES);
        const q = query(
          decreesRef,
          where('courtId', '==', courtId),
          orderBy('issuedDate', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const decreesData: any[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          decreesData.push({
            id: doc.id,
            ...data,
            issuedDate: data.issuedDate?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });
        
        setDecrees(decreesData);
      } catch (error) {
        console.error('Error fetching user or decrees:', error);
        setError(error instanceof Error ? error.message : 'Failed to load decrees. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndDecrees();
  }, [router]);

  useEffect(() => {
    // Filter decrees based on search term
    let result = decrees;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        decree => 
          decree.title.toLowerCase().includes(term) ||
          decree.caseNumber.toLowerCase().includes(term) ||
          decree.description.toLowerCase().includes(term)
      );
    }
    
    setFilteredDecrees(result);
  }, [decrees, searchTerm]);

  const handleCreateDecree = () => {
    // Navigate to decree creation page
    router.push('/registrars/decrees/create');
  };

  const handleEditDecree = (decreeId: string) => {
    // Navigate to decree editing page
    router.push(`/registrars/decrees/${decreeId}/edit`);
  };

  const handleDeleteDecree = async (decreeId: string) => {
    if (window.confirm('Are you sure you want to delete this decree?')) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.DECREES, decreeId));
        
        // Update local state
        setDecrees(prevDecrees => prevDecrees.filter(decree => decree.id !== decreeId));
      } catch (error) {
        console.error('Error deleting decree:', error);
        alert('Failed to delete decree. Please try again.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'bg-blue-100 text-blue-800';
      case 'appealed':
        return 'bg-yellow-100 text-yellow-800';
      case 'enforced':
        return 'bg-green-100 text-green-800';
      case 'overturned':
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
              <Scale className="mx-auto h-12 w-12 text-red-500" />
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
        <h1 className="text-3xl font-bold">Decrees Management</h1>
        <p className="text-gray-600">
          Manage court decrees and track their enforcement status.
        </p>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search decrees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleCreateDecree}>
          <Plus className="mr-2 h-4 w-4" />
          Create Decree
        </Button>
      </div>
      
      {filteredDecrees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No decrees found</h3>
            <p className="text-gray-600 text-center">
              {searchTerm
                ? 'No decrees match your search criteria.'
                : 'There are no decrees in the system.'}
            </p>
            <div className="mt-6">
              <Button onClick={handleCreateDecree}>
                Create New Decree
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredDecrees.map((decree) => (
            <Card key={decree.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{decree.title}</CardTitle>
                    <CardDescription>
                      {decree.caseNumber} • Issued on {new Date(decree.issuedDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(decree.status)}>
                    {decree.status.charAt(0).toUpperCase() + decree.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Description:</strong> {decree.description}</p>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditDecree(decree.id)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteDecree(decree.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
