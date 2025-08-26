'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function PublicSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [caseType, setCaseType] = useState('all');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [partyName, setPartyName] = useState('');
  const [caseNumber, setCaseNumber] = useState('');

  // Mock search results
  const searchResults = [
    {
      id: '1',
      caseNumber: 'CV-2024-001',
      title: 'Smith vs. Johnson',
      type: 'civil',
      status: 'active',
      parties: ['Smith', 'Johnson'],
      filedDate: '2024-01-15',
      lastUpdated: '2024-01-20'
    },
    {
      id: '2',
      caseNumber: 'CR-2024-002',
      title: 'State vs. Banda',
      type: 'criminal',
      status: 'pending',
      parties: ['State', 'Banda'],
      filedDate: '2024-01-20',
      lastUpdated: '2024-01-25'
    }
  ];

  const handleSearch = () => {
    // Search logic would be implemented here
    console.log('Searching with:', {
      searchTerm,
      caseType,
      status,
      dateFrom,
      dateTo,
      partyName,
      caseNumber
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zambia-black">Advanced Search</h1>
          <p className="text-zambia-black/70">Search public case records with advanced filters</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Search Criteria</CardTitle>
              <CardDescription>Enter your search criteria below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="caseNumber">Case Number</Label>
                <Input
                  id="caseNumber"
                  placeholder="e.g., CV-2024-001"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="partyName">Party Name</Label>
                <Input
                  id="partyName"
                  placeholder="e.g., Smith"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="searchTerm">Keywords</Label>
                <Input
                  id="searchTerm"
                  placeholder="Search in case details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="caseType">Case Type</Label>
                <Select value={caseType} onValueChange={setCaseType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="criminal">Criminal</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="dateFrom">Date From</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo">Date To</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSearch}
                className="w-full bg-zambia-orange hover:bg-zambia-orange/90"
              >
                Search Cases
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                {searchResults.length} case(s) found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <div key={result.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-lg">{result.caseNumber}</h4>
                      <Badge variant="outline">{result.status}</Badge>
                    </div>
                    <p className="text-gray-700 mb-2">{result.title}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 font-medium capitalize">{result.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Filed:</span>
                        <span className="ml-2 font-medium">{result.filedDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Parties:</span>
                        <span className="ml-2 font-medium">{result.parties.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="ml-2 font-medium">{result.lastUpdated}</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}