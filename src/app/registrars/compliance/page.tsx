// app/registrars/compliance/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileBarChart, CheckCircle, AlertTriangle, Clock, FileText } from 'lucide-react';
import { getCurrentUser, getOrCreateCourt } from '@/lib/auth';
import { collection, getDocs, query, where, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/constants/firebase/config';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';

export default function RegistrarCompliance() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [complianceItems, setComplianceItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUserAndCompliance = async () => {
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
        
        // Query compliance items for this court
        const complianceRef = collection(db, COLLECTIONS.COMPLIANCE);
        const q = query(
          complianceRef,
          where('courtId', '==', courtId),
          orderBy('dueDate', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        const complianceData: any[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          complianceData.push({
            id: doc.id,
            ...data,
            dueDate: data.dueDate?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });
        
        setComplianceItems(complianceData);
      } catch (error) {
        console.error('Error fetching user or compliance items:', error);
        setError(error instanceof Error ? error.message : 'Failed to load compliance items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndCompliance();
  }, [router]);

  useEffect(() => {
    // Filter compliance items based on search term
    let result = complianceItems;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        item => 
          item.title.toLowerCase().includes(term) ||
          item.caseNumber.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term)
      );
    }
    
    setFilteredItems(result);
  }, [complianceItems, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complied':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complied':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      case 'partial':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
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
              <FileBarChart className="mx-auto h-12 w-12 text-red-500" />
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
        <h1 className="text-3xl font-bold">Compliance Tracking</h1>
        <p className="text-gray-600">
          Monitor compliance with court orders and decrees.
        </p>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search compliance items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Compliance items tracked
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complied</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complianceItems.filter(item => item.status === 'complied').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Items fully complied
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complianceItems.filter(item => item.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Items awaiting compliance
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complianceItems.filter(item => item.status === 'overdue').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Items past due date
            </p>
          </CardContent>
        </Card>
      </div>
      
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileBarChart className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No compliance items found</h3>
            <p className="text-gray-600 text-center">
              {searchTerm
                ? 'No compliance items match your search criteria.'
                : 'There are no compliance items to track.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>
                      {item.caseNumber} • Due on {new Date(item.dueDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    <div className="flex items-center">
                      {getStatusIcon(item.status)}
                      <span className="ml-1">
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Description:</strong> {item.description}</p>
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/registrars/compliance/${item.id}`)}
                  >
                    View Details
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
