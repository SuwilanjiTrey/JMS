'use client';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Gavel,
    FileText,
    Search,
    BookOpen,
    AlertCircle,
    Filter,
    Calendar,
    User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { getCasesByJudge } from '@/lib/auth';

interface Case {
  id: string;
  title: string;
  caseNumber: string;
  plaintiff: string;
  defendant: string;
  status: 'pending' | 'active' | 'closed' | 'appealed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  filingDate: Date;
  nextHearing?: Date;
  pendingRuling?: boolean;
  description?: string;
}

export const JudgeCasesTab = ({ judgeId }: { judgeId: string }) => {
    const [activeCases, setActiveCases] = useState<Case[]>([]);
    const [pendingRulings, setPendingRulings] = useState<Case[]>([]);
    const [totalCases, setTotalCases] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeView, setActiveView] = useState<'active' | 'rulings' | 'search' | 'history'>('active');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');

useEffect(() => {
    const fetchCases = async () => {
        try {
            console.log('JudgeCasesTab - judgeId:', judgeId); // Add this line
            setLoading(true);
            const cases = await getCasesByJudge(judgeId);
            
            // Filter cases by status
            const activeCasesList = cases.filter(c => c.status === 'active');
            const pendingRulingsList = cases.filter(c => c.pendingRuling);
            
            setActiveCases(activeCasesList);
            setPendingRulings(pendingRulingsList);
            setTotalCases(cases.length);
        } catch (err) {
            console.error('Error fetching cases:', err);
            setError('Failed to load cases');
        } finally {
            setLoading(false);
        }
    };
    
    console.log("judge id from outside: ", judgeId)
    
    if (judgeId) { // Add this check
        fetchCases();
    } else {
        console.log('No judgeId provided to JudgeCasesTab');
        setLoading(false);
        setError('No judge ID provided');
    }
}, [judgeId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'active': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            case 'appealed': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'urgent': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const caseCards = [
        {
            icon: Gavel,
            title: "Active Cases",
            description: loading ? "Loading cases..." : 
                `${activeCases.length} active case${activeCases.length !== 1 ? 's' : ''} assigned to you`,
            view: 'active'
        },
        {
            icon: FileText,
            title: "Pending Rulings",
            description: loading ? "Loading rulings..." : 
                `${pendingRulings.length} case${pendingRulings.length !== 1 ? 's' : ''} awaiting your decision`,
            view: 'rulings'
        },
        {
            icon: Search,
            title: "Case Search",
            description: "Search and research case law and precedents",
            view: 'search'
        },
        {
            icon: BookOpen,
            title: "Case History",
            description: `Review your past ${totalCases} cases and decisions`,
            view: 'history'
        }
    ];

    const getFilteredCases = () => {
        let cases = [];
        
        if (activeView === 'active') {
            cases = activeCases;
        } else if (activeView === 'rulings') {
            cases = pendingRulings;
        } else if (activeView === 'history') {
            // For history, we'll show all cases
            cases = [...activeCases, ...pendingRulings];
        } else {
            // For search, we'll show all cases initially
            cases = [...activeCases, ...pendingRulings];
        }
        
        // Apply filters
        if (filterStatus !== 'all') {
            cases = cases.filter(c => c.status === filterStatus);
        }
        
        if (filterPriority !== 'all') {
            cases = cases.filter(c => c.priority === filterPriority);
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            cases = cases.filter(c => 
                c.title.toLowerCase().includes(term) ||
                c.caseNumber.toLowerCase().includes(term) ||
                c.plaintiff.toLowerCase().includes(term) ||
                c.defendant.toLowerCase().includes(term) ||
                (c.description && c.description.toLowerCase().includes(term))
            );
        }
        
        return cases;
    };

    const filteredCases = getFilteredCases();

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <p className="text-red-800">{error}</p>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                {caseCards.map((card, index) => (
                    <Card
                        key={index}
                        className={`cursor-pointer hover:shadow-lg transition-shadow ${activeView === card.view ? 'ring-2 ring-orange-500' : ''}`}
                        onClick={() => setActiveView(card.view as any)}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-orange-600 text-sm sm:text-base">
                                    <card.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                    <span>{card.title}</span>
                                </div>
                                {(card.view === 'active' || card.view === 'rulings' || card.view === 'history') && (
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                        {card.view === 'active' ? activeCases.length : 
                                         card.view === 'rulings' ? pendingRulings.length : 
                                         totalCases}
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                {card.description}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>
            
            {/* Cases View Content */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>
                            {activeView === 'active' && 'Active Cases'}
                            {activeView === 'rulings' && 'Pending Rulings'}
                            {activeView === 'search' && 'Case Search'}
                            {activeView === 'history' && 'Case History'}
                        </span>
                        <div className="flex space-x-2">
                            {(activeView === 'active' || activeView === 'rulings' || activeView === 'history') && (
                                <>
                                    <div className="relative">
                                        <select 
                                            className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="active">Active</option>
                                            <option value="closed">Closed</option>
                                            <option value="appealed">Appealed</option>
                                        </select>
                                        <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                                    </div>
                                    
                                    <div className="relative">
                                        <select 
                                            className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            value={filterPriority}
                                            onChange={(e) => setFilterPriority(e.target.value)}
                                        >
                                            <option value="all">All Priorities</option>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                        <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                                    </div>
                                </>
                            )}
                            
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Search cases..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
                        </div>
                    ) : (
                        <>
                            {activeView === 'search' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm">Case Law Database</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-gray-600 mb-3">Search national and regional case law</p>
                                                <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
                                                    Search Database
                                                </Button>
                                            </CardContent>
                                        </Card>
                                        
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm">Legal Precedents</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-gray-600 mb-3">Find relevant precedents for your cases</p>
                                                <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
                                                    Find Precedents
                                                </Button>
                                            </CardContent>
                                        </Card>
                                        
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm">Statute Research</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-gray-600 mb-3">Research laws and regulations</p>
                                                <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
                                                    Research Laws
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-sm">Recent Searches</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-500 text-sm">No recent searches</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                            
                            {(activeView === 'active' || activeView === 'rulings' || activeView === 'history') && (
                                <div>
                                    {filteredCases.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">
                                            {activeView === 'active' && 'No active cases found'}
                                            {activeView === 'rulings' && 'No cases pending rulings found'}
                                            {activeView === 'history' && 'No cases found in your history'}
                                        </p>
                                    ) : (
                                        <div className="space-y-4">
                                            {filteredCases.map((caseItem) => (
                                                <div key={caseItem.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center">
                                                                <h3 className="font-medium">{caseItem.title}</h3>
                                                                <Badge className={`ml-2 ${getStatusColor(caseItem.status)}`}>
                                                                    {caseItem.status}
                                                                </Badge>
                                                                <Badge className={`ml-2 ${getPriorityColor(caseItem.priority)}`}>
                                                                    {caseItem.priority}
                                                                </Badge>
                                                                {caseItem.pendingRuling && (
                                                                    <Badge className="ml-2 bg-red-100 text-red-800">
                                                                        Pending Ruling
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600 mt-1">Case No: {caseItem.caseNumber}</p>
                                                            <div className="flex items-center mt-2 text-sm text-gray-500">
                                                                <User className="h-4 w-4 mr-1" />
                                                                <span>{caseItem.plaintiff} vs. {caseItem.defendant}</span>
                                                                <span className="mx-2">•</span>
                                                                <span>Filed: {formatDate(caseItem.filingDate)}</span>
                                                            </div>
                                                            {caseItem.nextHearing && (
                                                                <div className="flex items-center mt-1 text-sm text-gray-500">
                                                                    <Calendar className="h-4 w-4 mr-1" />
                                                                    <span>Next Hearing: {formatDate(caseItem.nextHearing)}</span>
                                                                </div>
                                                            )}
                                                            {caseItem.description && (
                                                                <p className="text-sm text-gray-600 mt-2">{caseItem.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <Button size="sm" variant="outline">
                                                                View Details
                                                            </Button>
                                                            {activeView === 'rulings' && (
                                                                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                                                                    Issue Ruling
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
            
            {/* Preview of urgent cases */}
            {!loading && activeCases.length > 0 && (
                <Card className="bg-orange-50 border-orange-100">
                    <CardHeader>
                        <CardTitle className="text-orange-800 text-sm">Urgent Cases</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {activeCases
                                .filter(c => c.priority === 'urgent' || c.priority === 'high')
                                .slice(0, 2)
                                .map((caseItem) => (
                                    <div key={caseItem.id} className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">{caseItem.title}</div>
                                            <div className="text-sm text-gray-600">{caseItem.caseNumber}</div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Badge className={getStatusColor(caseItem.status)}>
                                                {caseItem.status}
                                            </Badge>
                                            <Badge className={getPriorityColor(caseItem.priority)}>
                                                {caseItem.priority}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
