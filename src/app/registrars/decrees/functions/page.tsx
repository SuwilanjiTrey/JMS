// app/registrars/decrees/functions/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Scale, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { getCurrentUser, getOrCreateCourt } from '@/lib/auth';
import { collection, getDocs, query, where, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/constants/firebase/config';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';

interface Decree {
  id: string;
  title: string;
  caseNumber: string;
  description: string;
  issuedDate: Date;
  judgeId: string;
  courtId: string;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function DecreesFunctionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decrees, setDecrees] = useState<Decree[]>([]);
  const [filteredDecrees, setFilteredDecrees] = useState<Decree[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDecree, setEditingDecree] = useState<Decree | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    caseNumber: '',
    description: '',
    issuedDate: '',
    judgeId: '',
    status: 'issued',
  });

  useEffect(() => {
    const fetchUserAndDecrees = async () => {
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
        
        const decreesRef = collection(db, COLLECTIONS.DECREES);
        const q = query(
          decreesRef,
          where('courtId', '==', courtId),
          orderBy('issuedDate', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const decreesData: Decree[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          decreesData.push({
            id: doc.id,
            title: data.title,
            caseNumber: data.caseNumber,
            description: data.description,
            issuedDate: data.issuedDate?.toDate() || new Date(),
            judgeId: data.judgeId,
            courtId: data.courtId,
            status: data.status,
            createdBy: data.createdBy,
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
    setEditingDecree(null);
    setFormData({
      title: '',
      caseNumber: '',
      description: '',
      issuedDate: new Date().toISOString().slice(0, 16),
      judgeId: '',
      status: 'issued',
    });
    setIsDialogOpen(true);
  };

  const handleEditDecree = (decree: Decree) => {
    setEditingDecree(decree);
    setFormData({
      title: decree.title,
      caseNumber: decree.caseNumber,
      description: decree.description,
      issuedDate: decree.issuedDate.toISOString().slice(0, 16),
      judgeId: decree.judgeId,
      status: decree.status,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteDecree = async (decreeId: string) => {
    if (window.confirm('Are you sure you want to delete this decree?')) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.DECREES, decreeId));
        setDecrees(prevDecrees => prevDecrees.filter(decree => decree.id !== decreeId));
      } catch (error) {
        console.error('Error deleting decree:', error);
        alert('Failed to delete decree. Please try again.');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (!user) return;
      
      const courtType = user.profile?.courtType;
      const courtLocation = user.profile?.courtLocation;
      
      if (!courtType || !courtLocation) {
        setError('Your profile is missing court information.');
        return;
      }
      
      const court = await getOrCreateCourt(courtType, courtLocation);
      const courtId = court.id;
      
      if (editingDecree) {
        // Update existing decree
        const decreeRef = doc(db, COLLECTIONS.DECREES, editingDecree.id);
        await updateDoc(decreeRef, {
          title: formData.title,
          caseNumber: formData.caseNumber,
          description: formData.description,
          issuedDate: new Date(formData.issuedDate),
          judgeId: formData.judgeId,
          status: formData.status,
          updatedAt: serverTimestamp(),
        });
        
        setDecrees(prevDecrees => 
          prevDecrees.map(decree => 
            decree.id === editingDecree.id
              ? {
                  ...decree,
                  title: formData.title,
                  caseNumber: formData.caseNumber,
                  description: formData.description,
                  issuedDate: new Date(formData.issuedDate),
                  judgeId: formData.judgeId,
                  status: formData.status,
                  updatedAt: new Date(),
                }
              : decree
          )
        );
      } else {
        // Create new decree
        const decreesRef = collection(db, COLLECTIONS.DECREES);
        const newDecree = {
          title: formData.title,
          caseNumber: formData.caseNumber,
          description: formData.description,
          issuedDate: new Date(formData.issuedDate),
          judgeId: formData.judgeId,
          courtId,
          status: formData.status,
          createdBy: user.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        const docRef = await addDoc(decreesRef, newDecree);
        
        setDecrees(prevDecrees => [
          ...prevDecrees,
          {
            id: docRef.id,
            ...newDecree,
            issuedDate: new Date(formData.issuedDate),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving decree:', error);
      alert('Failed to save decree. Please try again.');
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
            <Scale className="h-12 w-12 text-gray-400 mb-4" />
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
                      {decree.caseNumber} • Issued on {decree.issuedDate.toLocaleDateString()}
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
                    onClick={() => handleEditDecree(decree)}
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
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingDecree ? 'Edit Decree' : 'Create New Decree'}
            </DialogTitle>
            <DialogDescription>
              {editingDecree ? 'Update the decree details below.' : 'Fill in the details to create a new decree.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="caseNumber" className="text-right">
                Case Number
              </Label>
              <Input
                id="caseNumber"
                value={formData.caseNumber}
                onChange={(e) => setFormData({...formData, caseNumber: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="issuedDate" className="text-right">
                Issued Date
              </Label>
              <Input
                id="issuedDate"
                type="datetime-local"
                value={formData.issuedDate}
                onChange={(e) => setFormData({...formData, issuedDate: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="appealed">Appealed</SelectItem>
                  <SelectItem value="enforced">Enforced</SelectItem>
                  <SelectItem value="overturned">Overturned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <Save className="mr-2 h-4 w-4" />
              {editingDecree ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
