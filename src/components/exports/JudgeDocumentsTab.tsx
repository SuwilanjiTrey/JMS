'use client';
import { useState, useEffect } from 'react';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    FileText,
    Bot,
    Upload,
    AlertCircle,
    Loader2,
    Eye,
    Download,
    Search
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getDocumentsByJudge } from '@/lib/auth';

interface Document {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date;
  caseId?: string;
  caseTitle?: string;
  status: 'pending' | 'processed' | 'analyzed';
}

const JudgeDocumentsTab = ({ judgeId }: { judgeId: string }) => {
    const [loading, setLoading] = useState(true);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [error, setError] = useState('');
    const [activeView, setActiveView] = useState<'cases' | 'upload' | 'analysis'>('cases');
    const [searchTerm, setSearchTerm] = useState('');
    
    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                setLoading(true);
                const documentsData = await getDocumentsByJudge(judgeId);
                setDocuments(documentsData);
            } catch (err) {
                console.error('Error fetching documents:', err);
                setError('Failed to load documents');
            } finally {
                setLoading(false);
            }
        };
        fetchDocuments();
    }, [judgeId]);

    const getCaseDocumentsCount = () => {
        return documents.filter(doc => doc.caseId).length;
    };

    const getPendingAnalysisCount = () => {
        return documents.filter(doc => doc.status === 'pending').length;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const filteredDocuments = documents.filter(doc => {
        if (activeView === 'cases' && !doc.caseId) return false;
        if (activeView === 'analysis' && doc.status !== 'pending') return false;
        if (searchTerm && !doc.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !doc.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !(doc.caseTitle && doc.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()))) {
            return false;
        }
        return true;
    });

    const documentCards = [
        {
            icon: FileText,
            title: "Case Documents",
            description: "Review documents for your assigned cases",
            view: 'cases'
        },
        {
            icon: Upload,
            title: "Upload Documents",
            description: "Upload rulings, orders, and judicial documents",
            view: 'upload'
        },
        {
            icon: Bot,
            title: "Document Analysis",
            description: "AI-powered document summarization and analysis",
            view: 'analysis'
        }
    ];

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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {documentCards.map((card, index) => {
                    let badgeCount = 0;
                    let badgeText = '';
                    
                    if (card.view === 'cases') {
                        badgeCount = getCaseDocumentsCount();
                        badgeText = `${badgeCount} document${badgeCount !== 1 ? 's' : ''}`;
                    } else if (card.view === 'analysis') {
                        badgeCount = getPendingAnalysisCount();
                        badgeText = badgeCount > 0 ? `${badgeCount} pending` : 'Ready';
                    }
                    
                    return (
                        <Card
                            key={index}
                            className={`cursor-pointer hover:shadow-lg transition-shadow relative ${activeView === card.view ? 'ring-2 ring-orange-500' : ''}`}
                            onClick={() => setActiveView(card.view as any)}
                        >
                            {loading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-lg">
                                    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                                </div>
                            ) : null}
                            
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-orange-600 text-sm sm:text-base">
                                        <card.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span>{card.title}</span>
                                    </div>
                                    {badgeCount > 0 && (
                                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                            {badgeText}
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">
                                    {card.description}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    );
                })}
            </div>

            {/* Document View Content */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>
                            {activeView === 'cases' && 'Case Documents'}
                            {activeView === 'upload' && 'Upload Documents'}
                            {activeView === 'analysis' && 'Document Analysis'}
                        </span>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                        </div>
                    ) : (
                        <>
                            {activeView === 'cases' && (
                                <div>
                                    {filteredDocuments.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">No case documents found</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {filteredDocuments.map((doc) => (
                                                <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-medium">{doc.title}</h3>
                                                            <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                                                            {doc.caseTitle && (
                                                                <p className="text-sm text-orange-600 mt-1">Case: {doc.caseTitle}</p>
                                                            )}
                                                            <div className="flex items-center mt-2 text-xs text-gray-500">
                                                                <span>{doc.fileName}</span>
                                                                <span className="mx-2">•</span>
                                                                <span>{formatFileSize(doc.fileSize)}</span>
                                                                <span className="mx-2">•</span>
                                                                <span>{formatDate(doc.uploadedAt)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <Button size="sm" variant="outline">
                                                                <Eye className="h-4 w-4 mr-1" /> View
                                                            </Button>
                                                            <Button size="sm" variant="outline">
                                                                <Download className="h-4 w-4 mr-1" /> Download
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeView === 'upload' && (
                                <div className="space-y-6">
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-lg font-medium text-gray-900">Upload Documents</h3>
                                        <p className="mt-1 text-sm text-gray-500">Drag and drop files here, or click to browse</p>
                                        <div className="mt-6">
                                            <Button className="bg-orange-600 hover:bg-orange-700">
                                                Select Files
                                            </Button>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm">Recent Uploads</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-gray-500 text-sm">No recent uploads</p>
                                            </CardContent>
                                        </Card>
                                        
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm">Upload Guidelines</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ul className="text-sm text-gray-600 space-y-1">
                                                    <li>• Ensure documents are properly formatted</li>
                                                    <li>• Include case number in filename</li>
                                                    <li>• Remove sensitive information</li>
                                                    <li>• Verify document authenticity</li>
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            )}

                            {activeView === 'analysis' && (
                                <div>
                                    {filteredDocuments.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">No documents pending analysis</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {filteredDocuments.map((doc) => (
                                                <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center">
                                                                <h3 className="font-medium">{doc.title}</h3>
                                                                <Badge className="ml-2 bg-yellow-100 text-yellow-800">Pending Analysis</Badge>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                                                            {doc.caseTitle && (
                                                                <p className="text-sm text-orange-600 mt-1">Case: {doc.caseTitle}</p>
                                                            )}
                                                            <div className="flex items-center mt-2 text-xs text-gray-500">
                                                                <span>{doc.fileName}</span>
                                                                <span className="mx-2">•</span>
                                                                <span>{formatFileSize(doc.fileSize)}</span>
                                                                <span className="mx-2">•</span>
                                                                <span>{formatDate(doc.uploadedAt)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                                                                <Bot className="h-4 w-4 mr-1" /> Analyze
                                                            </Button>
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
        </div>
    );
};

export default JudgeDocumentsTab;
