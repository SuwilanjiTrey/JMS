// app/public/judgments/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar, ArrowLeft, FileText, Eye, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '@/lib/constants/firebase/config';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';

interface Judgment {
  id: string;
  title: string;
  caseNumber: string;
  description: string;
  caseType: string;
  issuedDate: any;
  judgeName: string;
  courtName: string;
  downloadUrl?: string;
}

export default function PublicJudgmentsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [caseType, setCaseType] = useState<string>('all');
  const [year, setYear] = useState<string>('all');
  const [judgments, setJudgments] = useState<Judgment[]>([]);
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

  // Generate years for the filter
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const fetchJudgments = async (isLoadMore = false) => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    
    try {
      let judgmentsQuery = query(
        collection(db, COLLECTIONS.JUDGMENTS),
        where('isPublished', '==', true),
        orderBy('issuedDate', 'desc'),
        limit(10)
      );
      
      if (isLoadMore && lastVisible) {
        judgmentsQuery = query(
          collection(db, COLLECTIONS.JUDGMENTS),
          where('isPublished', '==', true),
          orderBy('issuedDate', 'desc'),
          startAfter(lastVisible),
          limit(10)
        );
      }
      
      // Apply filters
      if (caseType !== 'all') {
        judgmentsQuery = query(judgmentsQuery, where('caseType', '==', caseType));
      }
      
      if (year !== 'all') {
        const startDate = new Date(parseInt(year), 0, 1);
        const endDate = new Date(parseInt(year), 11, 31);
        judgmentsQuery = query(judgmentsQuery, where('issuedDate', '>=', startDate));
        judgmentsQuery = query(judgmentsQuery, where('issuedDate', '<=', endDate));
      }
      
      const querySnapshot = await getDocs(judgmentsQuery);
      
      const newJudgments: Judgment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        newJudgments.push({
          id: doc.id,
          title: data.title,
          caseNumber: data.caseNumber,
          description: data.description,
          caseType: data.caseType,
          issuedDate: data.issuedDate,
          judgeName: data.judgeName,
          courtName: data.courtName,
          downloadUrl: data.downloadUrl
        } as Judgment);
      });
      
      // Filter by search term if provided
      let filteredJudgments = newJudgments;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredJudgments = newJudgments.filter(judgment => 
          judgment.title.toLowerCase().includes(term) ||
          judgment.caseNumber.toLowerCase().includes(term) ||
          judgment.description.toLowerCase().includes(term) ||
          judgment.judgeName.toLowerCase().includes(term) ||
          judgment.courtName.toLowerCase().includes(term)
        );
      }
      
      if (isLoadMore) {
        setJudgments(prev => [...prev, ...filteredJudgments]);
      } else {
        setJudgments(filteredJudgments);
      }
      
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === 10);
    } catch (error) {
      console.error('Error fetching judgments:', error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchJudgments();
  }, [caseType, year]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setLastVisible(null);
    setHasMore(true);
    fetchJudgments();
  };

  const handleLoadMore = () => {
    fetchJudgments(true);
  };

  const viewJudgmentDetails = (judgmentId: string) => {
    router.push(`/public/judgments/${judgmentId}`);
  };

  const downloadJudgment = (downloadUrl: string, title: string) => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (date: any) => {
    return date.toDate().toLocaleDateString('en-ZM', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        <h1 className="text-3xl font-bold">Published Judgments</h1>
        <p className="text-gray-600">
          Browse and download published court judgments
        </p>
      </div>
      
      {/* Search Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Judgments
          </CardTitle>
          <CardDescription>
            Find judgments by case number, title, or keywords
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Search by case number, title, or keywords"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
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
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map(y => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            Published Judgments {judgments.length > 0 && `(${judgments.length})`}
          </h2>
        </div>
        
        {loading && !isSearching ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading judgments...</p>
          </div>
        ) : judgments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No judgments found</h3>
              <p className="text-gray-500 mt-1">
                Try adjusting your search criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {judgments.map(judgment => (
                <Card key={judgment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{judgment.title}</CardTitle>
                        <CardDescription>
                          Case Number: {judgment.caseNumber}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{judgment.caseType}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4 line-clamp-2">
                      {judgment.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(judgment.issuedDate)}
                      </Badge>
                      <Badge variant="outline">
                        Judge: {judgment.judgeName}
                      </Badge>
                      <Badge variant="outline">
                        Court: {judgment.courtName}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => viewJudgmentDetails(judgment.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      
                      {judgment.downloadUrl && (
                        <Button
                          variant="outline"
                          onClick={() => downloadJudgment(judgment.downloadUrl, judgment.title)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      )}
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
