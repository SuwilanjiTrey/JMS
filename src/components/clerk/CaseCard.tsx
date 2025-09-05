// components/clerk/CaseCard.tsx
'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Case } from '@/models';

interface CaseCardProps {
  caseData: Case;
  onView: (caseId: string) => void;
}

export default function CaseCard({ caseData, onView }: CaseCardProps) {
  const getStatusColor = (status: string) => {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{caseData.title}</CardTitle>
            <CardDescription>
              {caseData.caseNumber} • Filed on {new Date(caseData.createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(caseData.status)}>
            {caseData.status.charAt(0).toUpperCase() + caseData.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Description:</strong> {caseData.description}</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm font-medium">Plaintiff(s):</p>
              <ul className="text-sm">
                {caseData.plaintiffs.map((p, i) => (
                  <li key={i}>{p.name}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium">Defendant(s):</p>
              <ul className="text-sm">
                {caseData.defendants.map((d, i) => (
                  <li key={i}>{d.name}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={() => onView(caseData.id)}>
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
