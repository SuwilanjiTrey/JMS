'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CASE_STATUS_COLORS, CASE_PRIORITY_COLORS, CASE_TYPE_LABELS } from '@/models';

export default function LawyersCases() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data for demonstration
  const cases = [
    {
      id: '1',
      caseNumber: 'CV-2024-001',
      title: 'Smith vs. Johnson',
      type: 'civil',
      status: 'active',
      priority: 'high',
      role: 'plaintiff',
      createdAt: '2024-01-15',
      nextHearing: '2024-02-01'
    },
    {
      id: '2',
      caseNumber: 'CR-2024-002',
      title: 'State vs. Banda',
      type: 'criminal',
      status: 'pending',
      priority: 'urgent',
      role: 'defendant',
      createdAt: '2024-01-20',
      nextHearing: '2024-02-01'
    },
    {
      id: '3',
      caseNumber: 'FA-2024-003',
      title: 'Chileshe vs. Chileshe',
      type: 'family',
      status: 'active',
      priority: 'medium',
      role: 'plaintiff',
      createdAt: '2024-01-25',
      nextHearing: '2024-02-02'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zambia-black">My Cases</h1>
          <p className="text-zambia-black/70">Cases you're working on</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border">
        <Input
          placeholder="Search cases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((caseItem) => (
          <Card key={caseItem.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{caseItem.caseNumber}</CardTitle>
                <div className="flex gap-2">
                  <Badge className={CASE_STATUS_COLORS[caseItem.status]}>
                    {caseItem.status}
                  </Badge>
                  <Badge className={CASE_PRIORITY_COLORS[caseItem.priority]}>
                    {caseItem.priority}
                  </Badge>
                </div>
              </div>
              <CardDescription>{caseItem.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="text-sm font-medium">
                    {CASE_TYPE_LABELS[caseItem.type]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Role:</span>
                  <span className="text-sm font-medium capitalize">{caseItem.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Next Hearing:</span>
                  <span className="text-sm font-medium">{caseItem.nextHearing}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm font-medium">{caseItem.createdAt}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1">
                  View Details
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Upload Document
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}