'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CASE_STATUS_COLORS, CASE_PRIORITY_COLORS, CASE_TYPE_LABELS } from '@/models';

export default function AdminCases() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Mock data for demonstration
  const cases = [
    {
      id: '1',
      caseNumber: 'CV-2024-001',
      title: 'Smith vs. Johnson',
      type: 'civil',
      status: 'active',
      priority: 'high',
      createdAt: '2024-01-15',
      assignedTo: 'Judge Mwansa'
    },
    {
      id: '2',
      caseNumber: 'CR-2024-002',
      title: 'State vs. Banda',
      type: 'criminal',
      status: 'pending',
      priority: 'urgent',
      createdAt: '2024-01-20',
      assignedTo: 'Judge Phiri'
    },
    {
      id: '3',
      caseNumber: 'FA-2024-003',
      title: 'Chileshe vs. Chileshe',
      type: 'family',
      status: 'active',
      priority: 'medium',
      createdAt: '2024-01-25',
      assignedTo: 'Judge Tembo'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zambia-black">Case Management</h1>
          <p className="text-zambia-black/70">Manage all cases in the system</p>
        </div>
        <Button className="bg-zambia-orange hover:bg-zambia-orange/90">
          New Case
        </Button>
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
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
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
                  <span className="text-sm text-gray-600">Assigned to:</span>
                  <span className="text-sm font-medium">{caseItem.assignedTo}</span>
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
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}