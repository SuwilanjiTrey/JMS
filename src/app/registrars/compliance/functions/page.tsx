// app/registrars/compliance/functions/page.tsx
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
import { ArrowLeft, FileBarChart, Plus, Edit, Trash2, Save, X, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { getCurrentUser, getOrCreateCourt } from '@/lib/auth';
import { collection, getDocs, query, where, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/constants/firebase/config';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';

interface ComplianceItem {
  id: string;
  title: string;
  caseNumber: string;
  description: string;
  dueDate: Date;
  courtId: string;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ComplianceFunctionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ComplianceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ComplianceItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    caseNumber: '',
    description: '',
    dueDate: '',
    status: 'pending',
  });

  useEffect(() => {
    const fetchUserAndCompliance = async () => {
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
        
        const complianceRef = collection(db, COLLECTIONS.COMPLIANCE);
        const q = query(
          complianceRef,
          where('courtId', '==', courtId),
          orderBy('dueDate', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        const complianceData: ComplianceItem[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          complianceData.push({
            id: doc.id,
            title: data.title,
            caseNumber: data.caseNumber,
            description: data.description,
            dueDate: data.dueDate?.toDate() || new Date(),
            courtId: data.courtId,
            status: data.status,
            createdBy: data.createdBy,
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

  const handleCreateItem = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      caseNumber: '',
      description: '',
      dueDate: new Date().toISOString().slice(0, 16),
      status: 'pending',
    });
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: ComplianceItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      caseNumber: item.caseNumber,
      description: item.description,
      dueDate: item.dueDate.toISOString().slice(0, 16),
      status: item.status,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this compliance item?')) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.COMPLIANCE, itemId));
        setComplianceItems(prevItems => prevItems.filter(item => item.id !== itemId));
      } catch (error) {
        console.error('Error deleting compliance item:', error);
        alert('Failed to delete compliance item. Please try again.');
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
      
      if (editingItem) {
        // Update existing item
        const itemRef = doc(db, COLLECTIONS.COMPLIANCE, editingItem.id);
        await updateDoc(itemRef, {
          title: formData.title,
          caseNumber: formData.caseNumber,
          description: formData.description,
          dueDate: new Date(formData.dueDate),
          status: formData.status,
          updatedAt: serverTimestamp(),
        });
        
        setComplianceItems(prevItems => 
          prevItems.map(item => 
            item.id === editingItem.id
              ? {
                  ...item,
                  title: formData.title,
                  caseNumber: formData.caseNumber,
                  description: formData.description,
                  dueDate: new Date(formData.dueDate),
                  status: formData.status,
                  updatedAt: new Date(),
                }
              : item
          )
        );
      } else {
        // Create new item
        const complianceRef = collection(db, COLLECTIONS.COMPLIANCE);
        const newItem = {
          title: formData.title,
          caseNumber: formData.caseNumber,
          description: formData.description,
          dueDate: new Date(formData.dueDate),
          courtId,
          status: formData.status,
          createdBy: user.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        const docRef = await addDoc(complianceRef, newItem);
        
        setComplianceItems(prevItems => [
          ...prevItems,
          {
            id: docRef.id,
            ...newItem,
            dueDate: new Date(formData.dueDate),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving compliance item:', error);
      alert('Failed to save compliance item. Please try again.');
    }
  };

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
        return <FileBarChart className="h-4 w-4" />;
      default:
        return <FileBarChart className="h-4 w-4" />;
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
        <Button onClick={handleCreateItem}>
          <Plus className="mr-2 h-4 w-4" />
          Create Item
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
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
            <div className="mt-6">
              <Button onClick={handleCreateItem}>
                Create New Item
              </Button>
            </div>
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
                      {item.caseNumber} • Due on {item.dueDate.toLocaleDateString()}
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
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditItem(item)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
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
              {editingItem ? 'Edit Compliance Item' : 'Create New Compliance Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the compliance item details below.' : 'Fill in the details to create a new compliance item.'}
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
              <Label htmlFor="dueDate" className="text-right">
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="complied">Complied</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
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
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
