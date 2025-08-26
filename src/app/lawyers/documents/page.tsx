'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LawyersDocuments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Mock data for demonstration
  const documents = [
    {
      id: '1',
      name: 'Pleading - Smith vs Johnson',
      caseNumber: 'CV-2024-001',
      type: 'pdf',
      size: 2450000,
      category: 'pleading',
      uploadedAt: '2024-01-15',
      isConfidential: false
    },
    {
      id: '2',
      name: 'Evidence Contract',
      caseNumber: 'CV-2024-001',
      type: 'docx',
      size: 1200000,
      category: 'evidence',
      uploadedAt: '2024-01-16',
      isConfidential: true
    },
    {
      id: '3',
      name: 'Motion to Dismiss',
      caseNumber: 'CR-2024-002',
      type: 'pdf',
      size: 890000,
      category: 'motion',
      uploadedAt: '2024-01-20',
      isConfidential: false
    }
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'pleading':
        return 'bg-blue-100 text-blue-800';
      case 'evidence':
        return 'bg-green-100 text-green-800';
      case 'motion':
        return 'bg-orange-100 text-orange-800';
      case 'order':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zambia-black">My Documents</h1>
          <p className="text-zambia-black/70">Manage your case documents</p>
        </div>
        <Button className="bg-zambia-orange hover:bg-zambia-orange/90">
          Upload Document
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border">
        <Input
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="pleading">Pleading</SelectItem>
            <SelectItem value="evidence">Evidence</SelectItem>
            <SelectItem value="motion">Motion</SelectItem>
            <SelectItem value="order">Order</SelectItem>
            <SelectItem value="correspondence">Correspondence</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <Card key={doc.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg truncate">{doc.name}</CardTitle>
                {doc.isConfidential && (
                  <Badge variant="destructive">Confidential</Badge>
                )}
              </div>
              <CardDescription>{doc.caseNumber}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="text-sm font-medium uppercase">{doc.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Size:</span>
                  <span className="text-sm font-medium">{formatFileSize(doc.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Category:</span>
                  <Badge className={getCategoryBadgeColor(doc.category)}>
                    {doc.category}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Uploaded:</span>
                  <span className="text-sm font-medium">{doc.uploadedAt}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1">
                  Download
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}