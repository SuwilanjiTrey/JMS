// components/registrar/CaseVerificationCard.tsx
'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Case, CaseStatus } from '@/models';
import { FileText, CheckCircle, XCircle, Calendar, User, Users, AlertTriangle } from 'lucide-react';

interface CaseVerificationCardProps {
  caseData: Case;
  onValidate: (caseId: string, status: 'verified' | 'rejected', reasons?: string) => void;
  onIssueSummons: (caseId: string, summonsDate: string, notes?: string) => void;
}

export default function CaseVerificationCard({ caseData, onValidate, onIssueSummons }: CaseVerificationCardProps) {
  const [isValidateDialogOpen, setIsValidateDialogOpen] = useState(false);
  const [isSummonsDialogOpen, setIsSummonsDialogOpen] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState('');
  const [summonsDate, setSummonsDate] = useState('');
  const [summonsNotes, setSummonsNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const getStatusLabel = (status: CaseStatus) => {
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
  };

  const handleValidate = async (status: 'verified' | 'rejected') => {
    setIsLoading(true);
    try {
      await onValidate(caseData.id, status, status === 'rejected' ? rejectionReasons : undefined);
      setIsValidateDialogOpen(false);
      setRejectionReasons('');
    } catch (error) {
      console.error('Error validating case:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueSummons = async () => {
    setIsLoading(true);
    try {
      await onIssueSummons(caseData.id, summonsDate, summonsNotes);
      setIsSummonsDialogOpen(false);
      setSummonsDate('');
      setSummonsNotes('');
    } catch (error) {
      console.error('Error issuing summons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{caseData.title}</CardTitle>
            <CardDescription className="mt-1">
              {caseData.caseNumber} • Filed on {new Date(caseData.createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(caseData.status)}>
            {getStatusLabel(caseData.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
          <p className="text-sm">{caseData.description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
              <Users className="h-4 w-4 mr-1" /> Plaintiffs
            </h4>
            <ul className="text-sm">
              {caseData.plaintiffs.map((plaintiff, index) => (
                <li key={index}>{plaintiff.name}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
              <Users className="h-4 w-4 mr-1" /> Defendants
            </h4>
            <ul className="text-sm">
              {caseData.defendants.map((defendant, index) => (
                <li key={index}>{defendant.name}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {caseData.type.charAt(0).toUpperCase() + caseData.type.slice(1)}
          </Badge>
          <Badge variant="outline">
            Priority: {caseData.priority}
          </Badge>
          {caseData.tags.map((tag, index) => (
            <Badge key={index} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex justify-between pt-2">
          <div className="flex gap-2">
            {caseData.status === 'filed' && (
              <>
                <Dialog open={isValidateDialogOpen} onOpenChange={setIsValidateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Verify Case Filing</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to verify this case filing? This will mark it as verified.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="rejection-reasons">Rejection Reasons (if rejecting)</Label>
                        <Textarea
                          id="rejection-reasons"
                          placeholder="Enter reasons for rejection..."
                          value={rejectionReasons}
                          onChange={(e) => setRejectionReasons(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsValidateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => handleValidate('rejected')}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processing...' : 'Reject'}
                      </Button>
                      <Button 
                        onClick={() => handleValidate('verified')}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processing...' : 'Verify'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isSummonsDialogOpen} onOpenChange={setIsSummonsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      Issue Summons
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Issue Summons</DialogTitle>
                      <DialogDescription>
                        Create a summons for this case. This will notify all parties involved.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="summons-date">Summons Date</Label>
                        <input
                          id="summons-date"
                          type="datetime-local"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={summonsDate}
                          onChange={(e) => setSummonsDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="summons-notes">Notes</Label>
                        <Textarea
                          id="summons-notes"
                          placeholder="Enter any additional notes..."
                          value={summonsNotes}
                          onChange={(e) => setSummonsNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsSummonsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleIssueSummons}
                        disabled={isLoading || !summonsDate}
                      >
                        {isLoading ? 'Processing...' : 'Issue Summons'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
            
            {caseData.status === 'verified' && (
              <Dialog open={isSummonsDialogOpen} onOpenChange={setIsSummonsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    Issue Summons
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Issue Summons</DialogTitle>
                    <DialogDescription>
                      Create a summons for this case. This will notify all parties involved.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="summons-date">Summons Date</Label>
                      <input
                        id="summons-date"
                        type="datetime-local"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={summonsDate}
                        onChange={(e) => setSummonsDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="summons-notes">Notes</Label>
                      <Textarea
                        id="summons-notes"
                        placeholder="Enter any additional notes..."
                        value={summonsNotes}
                        onChange={(e) => setSummonsNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSummonsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleIssueSummons}
                      disabled={isLoading || !summonsDate}
                    >
                      {isLoading ? 'Processing...' : 'Issue Summons'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <Button size="sm" variant="ghost" onClick={() => window.location.href = `/registrars/cases/${caseData.id}`}>
            <FileText className="h-4 w-4 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
