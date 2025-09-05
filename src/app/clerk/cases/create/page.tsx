// app/clerk/cases/create/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Plus, X, Tag, User } from 'lucide-react';
import { getCurrentUser, getOrCreateCourt, createCase } from '@/lib/auth';
import { CaseType, CasePriority } from '@/models';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/constants/firebase/config';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';

interface CaseParty {
  name: string;
  type: 'individual' | 'organization';
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

interface CaseLawyer {
  name: string;
  barId: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  specialization?: string[];
}

interface FormData {
  title: string;
  description: string;
  type: CaseType;
  priority: CasePriority;
  plaintiffs: CaseParty[];
  defendants: CaseParty[];
  lawyers: CaseLawyer[];
  estimatedDuration: number | null;
  tags: string[];
}

export default function CreateCasePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: 'civil',
    priority: 'medium',
    plaintiffs: [{ name: '', type: 'individual' }],
    defendants: [{ name: '', type: 'individual' }],
    lawyers: [],
    estimatedDuration: null,
    tags: [],
  });

  useEffect(() => {
    const fetchUser = async () => {
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
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Failed to load user data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      
      // Validate form
      if (!formData.title.trim()) {
        setError('Case title is required');
        return;
      }
      
      if (!formData.description.trim()) {
        setError('Case description is required');
        return;
      }
      
      if (formData.plaintiffs.some(p => !p.name.trim())) {
        setError('All plaintiff names are required');
        return;
      }
      
      if (formData.defendants.some(d => !d.name.trim())) {
        setError('All defendant names are required');
        return;
      }
      
      // Get court information from user profile
      const courtType = user.profile?.courtType;
      const courtLocation = user.profile?.courtLocation;
      
      if (!courtType || !courtLocation) {
        setError('Your profile is missing court information');
        return;
      }
      
      // Get or create court
      const court = await getOrCreateCourt(courtType, courtLocation);
      const courtId = court.id;
      
      // Create case with all fields
      const caseData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        plaintiffs: formData.plaintiffs,
        defendants: formData.defendants,
        lawyers: formData.lawyers,
        estimatedDuration: formData.estimatedDuration,
        tags: formData.tags,
        courtId,
        createdBy: user.id,
      };
      
      const newCase = await createCase(caseData);
      
      // Redirect to case details
      router.push(`/clerk/cases/${newCase.id}`);
    } catch (error) {
      console.error('Error creating case:', error);
      setError(error instanceof Error ? error.message : 'Failed to create case. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addPlaintiff = () => {
    setFormData({
      ...formData,
      plaintiffs: [...formData.plaintiffs, { name: '', type: 'individual' }],
    });
  };

  const removePlaintiff = (index: number) => {
    if (formData.plaintiffs.length <= 1) return;
    const newPlaintiffs = [...formData.plaintiffs];
    newPlaintiffs.splice(index, 1);
    setFormData({ ...formData, plaintiffs: newPlaintiffs });
  };

  const updatePlaintiff = (index: number, field: keyof CaseParty, value: string) => {
    const newPlaintiffs = [...formData.plaintiffs];
    newPlaintiffs[index] = { ...newPlaintiffs[index], [field]: value };
    setFormData({ ...formData, plaintiffs: newPlaintiffs });
  };

  const addDefendant = () => {
    setFormData({
      ...formData,
      defendants: [...formData.defendants, { name: '', type: 'individual' }],
    });
  };

  const removeDefendant = (index: number) => {
    if (formData.defendants.length <= 1) return;
    const newDefendants = [...formData.defendants];
    newDefendants.splice(index, 1);
    setFormData({ ...formData, defendants: newDefendants });
  };

  const updateDefendant = (index: number, field: keyof CaseParty, value: string) => {
    const newDefendants = [...formData.defendants];
    newDefendants[index] = { ...newDefendants[index], [field]: value };
    setFormData({ ...formData, defendants: newDefendants });
  };

  const addLawyer = () => {
    setFormData({
      ...formData,
      lawyers: [...formData.lawyers, { name: '', barId: '' }],
    });
  };

  const removeLawyer = (index: number) => {
    const newLawyers = [...formData.lawyers];
    newLawyers.splice(index, 1);
    setFormData({ ...formData, lawyers: newLawyers });
  };

  const updateLawyer = (index: number, field: keyof CaseLawyer, value: string) => {
    const newLawyers = [...formData.lawyers];
    newLawyers[index] = { ...newLawyers[index], [field]: value };
    setFormData({ ...formData, lawyers: newLawyers });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
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
        <h1 className="text-3xl font-bold">Create New Case</h1>
        <p className="text-gray-600">
          Enter case details to create a new case record.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Case Information</CardTitle>
            <CardDescription>
              Basic details about the case
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Case Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter case title"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter case description"
                rows={3}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Case Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as CaseType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="criminal">Criminal</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="constitutional">Constitutional</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as CasePriority })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="estimatedDuration">Estimated Duration (days)</Label>
              <Input
                id="estimatedDuration"
                type="number"
                value={formData.estimatedDuration || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  estimatedDuration: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Enter estimated duration in days"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Plaintiffs</CardTitle>
            <CardDescription>
              Parties filing the case
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.plaintiffs.map((plaintiff, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">Plaintiff {index + 1}</h4>
                  {formData.plaintiffs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlaintiff(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`plaintiff-name-${index}`}>Name *</Label>
                    <Input
                      id={`plaintiff-name-${index}`}
                      value={plaintiff.name}
                      onChange={(e) => updatePlaintiff(index, 'name', e.target.value)}
                      placeholder="Enter name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`plaintiff-type-${index}`}>Type</Label>
                    <Select
                      value={plaintiff.type}
                      onValueChange={(value) => updatePlaintiff(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addPlaintiff}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Plaintiff
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Defendants</CardTitle>
            <CardDescription>
              Parties being sued
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.defendants.map((defendant, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">Defendant {index + 1}</h4>
                  {formData.defendants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDefendant(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`defendant-name-${index}`}>Name *</Label>
                    <Input
                      id={`defendant-name-${index}`}
                      value={defendant.name}
                      onChange={(e) => updateDefendant(index, 'name', e.target.value)}
                      placeholder="Enter name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`defendant-type-${index}`}>Type</Label>
                    <Select
                      value={defendant.type}
                      onValueChange={(value) => updateDefendant(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addDefendant}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Defendant
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Lawyers</CardTitle>
            <CardDescription>
              Lawyers assigned to this case
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.lawyers.map((lawyer, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">Lawyer {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLawyer(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`lawyer-name-${index}`}>Name</Label>
                    <Input
                      id={`lawyer-name-${index}`}
                      value={lawyer.name}
                      onChange={(e) => updateLawyer(index, 'name', e.target.value)}
                      placeholder="Enter lawyer name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`lawyer-barId-${index}`}>Bar ID</Label>
                    <Input
                      id={`lawyer-barId-${index}`}
                      value={lawyer.barId}
                      onChange={(e) => updateLawyer(index, 'barId', e.target.value)}
                      placeholder="Enter bar ID"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addLawyer}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Lawyer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>
              Add tags to categorize this case
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag}>
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  <span>{tag}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTag(tag)}
                    className="ml-1 h-4 w-4 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/clerk/cases')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Case
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
