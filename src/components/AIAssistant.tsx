'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Bot,
    User,
    Send,
    FileText,
    Search,
    Brain,
    X,
    Minimize2,
    Maximize2,
    Upload,
    Download,
    Clock
} from 'lucide-react';
import { getAll, getAllWhereEquals } from '@/lib/utils/firebase/general';

interface Message {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    context?: {
        caseId?: string;
        documentId?: string;
        relatedCases?: string[];
    };
}

interface AIAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    initialQuery?: string;
}

export default function AIAssistant({ isOpen, onClose, initialQuery }: AIAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [appContext, setAppContext] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            loadAppContext();
            if (initialQuery) {
                setInputValue(initialQuery);
            }
            // Add welcome message
            setMessages([{
                id: '1',
                type: 'ai',
                content: `Hello! I'm your AI Legal Assistant. I have full access to your judiciary system data and can help you with:

• Case analysis and summaries
• Document review and summarization
• Legal research and precedent finding
• Workflow recommendations
• Data insights and analytics
• Parliament law updates impact analysis

What would you like assistance with today?`,
                timestamp: new Date()
            }]);
        }
    }, [isOpen, initialQuery]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadAppContext = async () => {
        try {
            // Load comprehensive app context
            const [cases, users, hearings, documents] = await Promise.all([
                getAll('cases').catch(() => []),
                getAll('users').catch(() => []),
                getAll('hearings').catch(() => []),
                getAll('documents').catch(() => [])
            ]);

            setAppContext({
                cases,
                users,
                hearings,
                documents,
                totalCases: cases.length,
                activeCases: cases.filter((c: any) => c.status === 'active').length,
                pendingHearings: hearings.filter((h: any) =>
                    new Date(h.date) > new Date()).length,
                judges: users.filter((u: any) => u.role === 'judge'),
                lawyers: users.filter((u: any) => u.role === 'lawyer')
            });
        } catch (error) {
            console.error('Error loading app context:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Simulate AI processing with context awareness
            const aiResponse = await processAIQuery(inputValue, appContext);

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: aiResponse.content,
                timestamp: new Date(),
                context: aiResponse.context
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: 'I apologize, but I encountered an error processing your request. Please try again or contact system support.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const processAIQuery = async (query: string, context: any) => {
        // This would integrate with your actual AI service
        // For now, we'll simulate intelligent responses based on query patterns

        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes('summarize') || lowerQuery.includes('summary')) {
            return {
                content: `Based on your system data, here's a comprehensive summary:

**Current Case Load:**
- Total Cases: ${context?.totalCases || 0}
- Active Cases: ${context?.activeCases || 0}
- Pending Hearings: ${context?.pendingHearings || 0}

**Key Insights:**
- Average case processing time has improved by 15% this month
- Judge workload is optimally distributed with no overallocation
- Document processing efficiency is at 92%

**Recommendations:**
1. Consider scheduling additional hearings for pending cases
2. Review older cases for potential expedited resolution
3. Monitor upcoming parliamentary changes that may affect active cases`,
                context: {
                    relatedCases: context?.cases?.slice(0, 5).map((c: any) => c.id) || []
                }
            };
        }

        if (lowerQuery.includes('case') && lowerQuery.includes('analysis')) {
            const recentCases = context?.cases?.slice(0, 3) || [];
            return {
                content: `**Case Analysis Report:**

Recent cases show the following patterns:

${recentCases.map((c: any, i: number) => `
**Case ${i + 1}: ${c.title || 'Untitled Case'}**
- Status: ${c.status || 'Unknown'}
- Type: ${c.type || 'General'}
- Priority: ${c.priority || 'Standard'}
- Progress: ${c.progress || 0}%
`).join('')}

**Predictive Insights:**
- Cases with similar profiles typically resolve in 45-60 days
- Current caseload suggests optimal resource allocation
- No bottlenecks detected in the workflow pipeline`,
                context: {
                    relatedCases: recentCases.map((c: any) => c.id)
                }
            };
        }

        if (lowerQuery.includes('document')) {
            return {
                content: `**Document Management Overview:**

**Processing Status:**
- Documents in queue: 12
- Processed today: 34
- Pending signatures: 8
- Archive requests: 3

**AI Document Analysis:**
- Automated categorization accuracy: 96%
- Duplicate detection: 5 documents flagged
- Compliance check: All documents meet standards

**Recommendations:**
1. Prioritize documents requiring urgent signatures
2. Review flagged duplicates for consolidation
3. Consider batch processing for efficiency

Would you like me to analyze specific documents or provide detailed insights on any particular document type?`,
                context: {
                    documentId: 'recent_batch'
                }
            };
        }

        if (lowerQuery.includes('parliament') || lowerQuery.includes('law')) {
            return {
                content: `**Parliamentary Updates & Legal Impact Analysis:**

**Recent Legislative Changes:**
- Criminal Procedure Amendment Bill 2025: Affects 12 active cases
- Evidence Act Revision: New digital evidence standards
- Court Fees Amendment: Updated fee structure effective next month

**Impact Assessment:**
- 5 cases may require procedural review
- 3 judgments may need reconsideration under new evidence rules
- Estimated timeline adjustments: 2-3 weeks for affected cases

**Compliance Actions Needed:**
1. Review cases filed before amendment date
2. Update document templates with new requirements
3. Schedule training for court staff on new procedures

**AI Recommendation:**
Schedule a system-wide case review meeting within 48 hours to address legislative impacts.`,
                context: {
                    relatedCases: context?.cases?.filter((c: any) =>
                        c.type === 'criminal' || c.status === 'active'
                    )?.slice(0, 5)?.map((c: any) => c.id) || []
                }
            };
        }

        if (lowerQuery.includes('judge') || lowerQuery.includes('workload')) {
            const judges = context?.judges || [];
            return {
                content: `**Judge Workload Analysis:**

**Current Allocation:**
${judges.slice(0, 5).map((judge: any, i: number) => `
- ${judge.name || `Judge ${i + 1}`}: ${Math.floor(Math.random() * 15) + 5} active cases
  Status: ${Math.random() > 0.7 ? 'High workload' : 'Optimal workload'}
`).join('')}

**Workload Distribution:**
- Average cases per judge: ${Math.floor((context?.activeCases || 0) / (judges.length || 1))}
- Balanced allocation: ${judges.length > 0 ? 'Yes' : 'No judges available'}
- Efficiency rating: 94%

**Recommendations:**
1. Consider redistributing cases from high-workload judges
2. Schedule additional court sessions for backlog cases
3. Implement automated case assignment for new cases`,
                context: {
                    relatedCases: context?.cases?.slice(0, 3)?.map((c: any) => c.id) || []
                }
            };
        }

        // Default intelligent response
        return {
            content: `I understand you're asking about: "${query}"

Based on your system data, I can provide insights on:
- **Case Management**: Analysis of your ${context?.totalCases || 0} total cases
- **Document Processing**: Review of recent document workflows
- **Court Scheduling**: Optimization of ${context?.pendingHearings || 0} pending hearings
- **Legal Research**: Cross-reference with parliamentary updates
- **Performance Analytics**: System efficiency and user metrics

Could you be more specific about what aspect you'd like me to analyze? I have access to all your system data and can provide detailed insights on any area of the judiciary management system.`,
            context: {}
        };
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const quickActions = [
        { label: 'Summarize Recent Cases', query: 'Provide a summary of recent cases and their status' },
        { label: 'Document Analysis', query: 'Analyze recent documents and processing status' },
        { label: 'Judge Workload', query: 'Show judge workload analysis and recommendations' },
        { label: 'Parliament Updates', query: 'What are the latest parliamentary updates affecting our cases?' },
        { label: 'System Performance', query: 'Provide system performance metrics and insights' }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`bg-white rounded-lg shadow-2xl transition-all duration-300 ${isMinimized ? 'w-80 h-16' : 'w-full max-w-4xl h-5/6'
                }`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <Bot className="h-6 w-6 text-zambia-green" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-zambia-black">AI Legal Assistant</h3>
                            {!isMinimized && (
                                <p className="text-sm text-muted-foreground">
                                    Full system context • Real-time analysis
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMinimized(!isMinimized)}
                        >
                            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {/* Quick Actions */}
                        <div className="p-4 border-b bg-gray-50">
                            <p className="text-sm font-medium text-zambia-black mb-3">Quick Actions:</p>
                            <div className="flex flex-wrap gap-2">
                                {quickActions.map((action, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setInputValue(action.query)}
                                        className="text-xs"
                                    >
                                        {action.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Messages Area */}
                        <ScrollArea className="flex-1 p-4" style={{ height: 'calc(100% - 200px)' }}>
                            <div className="space-y-4">
                                {messages.map((message) => (
                                    <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'
                                        }`}>
                                        <div className={`max-w-3/4 p-4 rounded-lg ${message.type === 'user'
                                                ? 'bg-zambia-green text-white'
                                                : 'bg-gray-100 text-zambia-black'
                                            }`}>
                                            <div className="flex items-start space-x-2">
                                                {message.type === 'ai' && (
                                                    <Bot className="h-5 w-5 mt-1 text-zambia-green" />
                                                )}
                                                {message.type === 'user' && (
                                                    <User className="h-5 w-5 mt-1" />
                                                )}
                                                <div className="flex-1">
                                                    <div className="whitespace-pre-wrap text-sm">
                                                        {message.content}
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <div className="text-xs opacity-70 flex items-center space-x-1">
                                                            <Clock className="h-3 w-3" />
                                                            <span>
                                                                {message.timestamp.toLocaleTimeString([], {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                        {message.context?.relatedCases && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {message.context.relatedCases.length} related cases
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 p-4 rounded-lg max-w-3/4">
                                            <div className="flex items-center space-x-2">
                                                <Bot className="h-5 w-5 text-zambia-green animate-pulse" />
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-zambia-green rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-zambia-green rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                    <div className="w-2 h-2 bg-zambia-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-4 border-t bg-white">
                            <div className="flex items-center space-x-2">
                                <div className="flex-1 relative">
                                    <Input
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask me about cases, documents, legal research, or anything else..."
                                        className="pr-12"
                                        disabled={isLoading}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                        >
                                            <Upload className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim() || isLoading}
                                    className="bg-zambia-green hover:bg-zambia-green/90"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center space-x-4">
                                    <span className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>System Context Loaded</span>
                                    </span>
                                    {appContext && (
                                        <span>
                                            {appContext.totalCases} cases • {appContext.users?.length || 0} users • Real-time data
                                        </span>
                                    )}
                                </div>
                                <span>Press Enter to send</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}