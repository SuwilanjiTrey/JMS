// app/public/search/cases/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Filter, ArrowLeft, FileText, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '@/lib/constants/firebase/config';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';
import { CaseType, CasePriority } from '@/models';

interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  type: CaseType;
  status: string;
  priority: CasePriority;
  createdAt: any;
  plaintiffs: any[];
  defendants: any[];
  courtId: string;
}

export default function PublicCaseSearchPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [caseType, setCaseType] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const caseTypes: { value: string; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'civil', label: 'Civil' },
    { value: 'criminal', label: 'Criminal' },
    { value: 'family', label: 'Family' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'constitutional', label: 'Constitutional' },
    { value: 'other', label: 'Other' }
  ];

  const fetchCases = async (isLoadMore = false) => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    
    try {
      let casesQuery = query(
        collection(db, COLLECTIONS.CASES),
        where('caseVisibility', '==', 'public'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      if (isLoadMore && lastVisible) {
        casesQuery = query(
          collection(db, COLLECTIONS.CASES),
          where('caseVisibility', '==', 'public'),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(10)
        );
      }
      
      // Apply filters
      if (caseType !== 'all') {
        casesQuery = query(casesQuery, where('type', '==', caseType));
      }
      
      if (searchTerm) {
        // For text search, we'll filter on the client side
        // In a real app, you'd use a full-text search service
      }
      
      const querySnapshot = await getDocs(casesQuery);
      
      const newCases: Case[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        newCases.push({
          id: doc.id,
          caseNumber: data.caseNumber,
          title: data.title,
          description: data.description,
          type: data.type,
          status: data.status,
          priority: data.priority,
          createdAt: data.createdAt,
          plaintiffs: data.plaintiffs || [],
          defendants: data.defendants || [],
          courtId: data.courtId
        } as Case);
      });
      
      // Filter by search term if provided
      let filteredCases = newCases;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredCases = newCases.filter(caseItem => 
          caseItem.title.toLowerCase().includes(term) ||
          caseItem.caseNumber.toLowerCase().includes(term) ||
          caseItem.description.toLowerCase().includes(term) ||
          caseItem.plaintiffs.some((p: any) => p.name.toLowerCase().includes(term)) ||
          caseItem.defendants.some((d: any) => d.name.toLowerCase().includes(term))
        );
      }
      
      // Filter by date range if provided
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredCases = filteredCases.filter(caseItem => {
          const caseDate = caseItem.createdAt.toDate();
          return caseDate >= fromDate;
        });
      }
      
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // End of the day
        filteredCases = filteredCases.filter(caseItem => {
          const caseDate = caseItem.createdAt.toDate();
          return caseDate <= toDate;
        });
      }
      
      if (isLoadMore) {
        setCases(prev => [...prev, ...filteredCases]);
      } else {
        setCases(filteredCases);
      }
      
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === 10);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [caseType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setLastVisible(null);
    setHasMore(true);
    fetchCases();
  };

  const handleLoadMore = () => {
    fetchCases(true);
  };

  const viewCaseDetails = (caseId: string) => {
    router.push(`/public/cases/${caseId}`);
  };

  const formatDate = (date: any) => {
    return date.toDate().toLocaleDateString('en-ZM', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/public/dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Search Public Cases</h1>
        <p className="text-gray-600">
          Search and browse public court cases
        </p>
      </div>
      
      {/* Search Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Cases
          </CardTitle>
          <CardDescription>
            Find cases by case number, party name, or keywords
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <Label htmlFor="search">Search Term</Label>
              <Input
                id="search"
                type="text"
                placeholder="Enter case number, party name, or keywords"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="caseType">Case Type</Label>
                <Select value={caseType} onValueChange={setCaseType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                  <SelectContent>
                    {caseTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
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
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isSearching}>
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Results */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Search Results {cases.length > 0 && `(${cases.length})`}
          </h2>
        </div>
        
        {loading && !isSearching ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading cases...</p>
          </div>
        ) : cases.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No cases found</h3>
              <p className="text-gray-500 mt-1">
                Try adjusting your search criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {cases.map(caseItem => (
                <Card key={caseItem.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{caseItem.title}</CardTitle>
                        <CardDescription>
                          Case Number: {caseItem.caseNumber}
                        </CardDescription>
                      </div>
                      <Badge className={getPriorityColor(caseItem.priority)}>
                        {caseItem.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4 line-clamp-2">
                      {caseItem.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline">{caseItem.type}</Badge>
                      <Badge variant="outline">{caseItem.status}</Badge>
                      <Badge variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(caseItem.createdAt)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Plaintiffs</h4>
                        <div className="flex flex-wrap gap-1">
                          {caseItem.plaintiffs.map((plaintiff, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {plaintiff.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Defendants</h4>
                        <div className="flex flex-wrap gap-1">
                          {caseItem.defendants.map((defendant, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {defendant.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => viewCaseDetails(caseItem.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
