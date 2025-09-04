// src/lib/parliamentIntegration.ts
"use client";

import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { uploadData, getAll, setDetails } from '@/lib/utils/firebase/general';

export interface LegislativeUpdate {
    id: string;
    billNumber: string;
    title: string;
    status: 'introduced' | 'committee' | 'second_reading' | 'third_reading' | 'passed' | 'assented';
    summary: string;
    affectedLaws: string[];
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
    effectiveDate: string;
    category: 'criminal' | 'civil' | 'constitutional' | 'administrative' | 'commercial';
    fullText?: string;
    amendments?: string[];
    timestamp: string;
    source: 'parliament' | 'gazette' | 'ministry';
}

export interface CaseImpactAnalysis {
    caseId: string;
    updateId: string;
    impactType: 'procedural' | 'substantive' | 'evidential' | 'jurisdictional';
    severity: 'minimal' | 'moderate' | 'significant' | 'critical';
    requiredActions: string[];
    recommendations: string[];
    deadline?: string;
}

// Mock Data
const MOCK_LEGISLATIVE_UPDATES: LegislativeUpdate[] = [
    {
        id: 'bill_2024_001',
        billNumber: 'HB 2024/001',
        title: 'Criminal Procedure (Amendment) Act 2024',
        status: 'passed',
        summary: 'Amendment to criminal procedure laws introducing new evidence handling requirements and witness protection measures.',
        affectedLaws: ['Criminal Procedure Code', 'Evidence Act', 'Witness Protection Act'],
        impactLevel: 'high',
        effectiveDate: '2024-12-01',
        category: 'criminal',
        fullText: 'Full text of the Criminal Procedure Amendment Act...',
        amendments: [
            'New requirements for digital evidence handling',
            'Enhanced witness protection protocols',
            'Mandatory recording of interrogations'
        ],
        timestamp: '2024-11-15T10:00:00Z',
        source: 'parliament'
    },
    {
        id: 'bill_2024_002',
        billNumber: 'HB 2024/002',
        title: 'Civil Procedure (Electronic Filing) Act 2024',
        status: 'assented',
        summary: 'Introduction of mandatory electronic filing system for all civil court proceedings.',
        affectedLaws: ['Civil Procedure Code', 'Court Rules'],
        impactLevel: 'critical',
        effectiveDate: '2025-01-01',
        category: 'civil',
        amendments: [
            'Mandatory e-filing for all civil cases',
            'New digital signature requirements',
            'Electronic service of process'
        ],
        timestamp: '2024-11-10T14:30:00Z',
        source: 'parliament'
    },
    {
        id: 'bill_2024_003',
        billNumber: 'HB 2024/003',
        title: 'Commercial Courts (Jurisdiction) Amendment 2024',
        status: 'third_reading',
        summary: 'Expansion of commercial court jurisdiction to include intellectual property disputes.',
        affectedLaws: ['Commercial Courts Act', 'Intellectual Property Act'],
        impactLevel: 'medium',
        effectiveDate: '2024-12-15',
        category: 'commercial',
        timestamp: '2024-11-05T09:15:00Z',
        source: 'parliament'
    },
    {
        id: 'reg_2024_001',
        billNumber: 'SI 2024/45',
        title: 'Court Fees (Amendment) Regulations 2024',
        status: 'introduced',
        summary: 'Revision of court filing fees and service charges across all court levels.',
        affectedLaws: ['Court Fees Act'],
        impactLevel: 'medium',
        effectiveDate: '2025-02-01',
        category: 'administrative',
        timestamp: '2024-10-28T16:45:00Z',
        source: 'gazette'
    },
    {
        id: 'bill_2024_004',
        billNumber: 'HB 2024/004',
        title: 'Judicial Service (Performance) Amendment 2024',
        status: 'committee',
        summary: 'New performance evaluation criteria for judicial officers and court staff.',
        affectedLaws: ['Judicial Service Act'],
        impactLevel: 'low',
        effectiveDate: '2025-03-01',
        category: 'administrative',
        timestamp: '2024-10-20T11:00:00Z',
        source: 'ministry'
    },
    {
        id: 'bill_2024_005',
        billNumber: 'CB 2024/12',
        title: 'Constitution (Fundamental Rights) Amendment 2024',
        status: 'second_reading',
        summary: 'Amendment to strengthen fundamental rights provisions and judicial review powers.',
        affectedLaws: ['Constitution of Zambia', 'Bill of Rights'],
        impactLevel: 'critical',
        effectiveDate: '2025-06-01',
        category: 'constitutional',
        amendments: [
            'Enhanced right to fair trial provisions',
            'Expanded judicial review powers',
            'New rights for digital privacy'
        ],
        timestamp: '2024-10-15T13:20:00Z',
        source: 'parliament'
    }
];

const MOCK_CASE_IMPACTS: CaseImpactAnalysis[] = [
    {
        caseId: 'case_001',
        updateId: 'bill_2024_001',
        impactType: 'procedural',
        severity: 'significant',
        requiredActions: [
            'Update evidence handling procedures',
            'Train staff on new witness protection protocols',
            'Implement mandatory recording system'
        ],
        recommendations: [
            'Schedule urgent training session',
            'Audit current evidence storage',
            'Update case management procedures'
        ],
        deadline: '2024-11-30T23:59:59Z'
    },
    {
        caseId: 'case_002',
        updateId: 'bill_2024_002',
        impactType: 'procedural',
        severity: 'critical',
        requiredActions: [
            'Migrate all filings to electronic system',
            'Obtain digital signatures for all parties',
            'Update service procedures'
        ],
        recommendations: [
            'Immediate system training required',
            'Test all electronic filing procedures',
            'Notify all parties of new requirements'
        ],
        deadline: '2024-12-15T23:59:59Z'
    }
];

class ParliamentIntegrationService {
    private isConnected = true; // Mock as always connected
    private mockUpdates: LegislativeUpdate[] = [...MOCK_LEGISLATIVE_UPDATES];
    private mockImpacts: CaseImpactAnalysis[] = [...MOCK_CASE_IMPACTS];

    constructor() {
        this.initializeConnection();
    }

    /**
     * Mock initialization - always succeeds
     */
    async initializeConnection(): Promise<boolean> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('Mock Parliament API connection established');
        this.isConnected = true;

        // Simulate initial data sync
        await this.syncInitialData();

        return true;
    }

    /**
     * Mock sync of initial data
     */
    private async syncInitialData(): Promise<void> {
        try {
            // Store mock data in Firebase
            for (const update of this.mockUpdates) {
                await uploadData('legislative_updates', update);
            }

            for (const impact of this.mockImpacts) {
                await uploadData('case_impact_analyses', impact);
            }

            console.log(`Synced ${this.mockUpdates.length} mock legislative updates`);
        } catch (error) {
            console.error('Failed to sync mock legislative data:', error);
        }
    }

    /**
     * Mock fetch recent bills
     */
    async fetchRecentBills(): Promise<LegislativeUpdate[]> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        return this.mockUpdates.filter(update =>
            update.id.startsWith('bill_') || update.id.startsWith('cb_')
        );
    }

    /**
     * Mock fetch recent acts
     */
    async fetchRecentActs(): Promise<LegislativeUpdate[]> {
        await new Promise(resolve => setTimeout(resolve, 300));

        return this.mockUpdates.filter(update =>
            update.status === 'passed' || update.status === 'assented'
        );
    }

    /**
     * Mock fetch recent regulations
     */
    async fetchRecentRegulations(): Promise<LegislativeUpdate[]> {
        await new Promise(resolve => setTimeout(resolve, 300));

        return this.mockUpdates.filter(update =>
            update.id.startsWith('reg_') && update.source === 'gazette'
        );
    }

    /**
     * Mock webhook processing
     */
    async processWebhook(payload: any): Promise<void> {
        // Simulate processing a new update
        const newUpdate: LegislativeUpdate = {
            id: `mock_${Date.now()}`,
            billNumber: payload.bill_number || `MB ${new Date().getFullYear()}/${Math.floor(Math.random() * 100)}`,
            title: payload.title || 'Mock Legislative Update',
            status: payload.status || 'introduced',
            summary: payload.summary || 'This is a mock legislative update for testing purposes.',
            affectedLaws: payload.affected_laws || ['Mock Law Act'],
            impactLevel: this.assessImpactLevel(payload),
            effectiveDate: payload.effective_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            category: this.categorizeUpdate(payload),
            timestamp: new Date().toISOString(),
            source: 'parliament'
        };

        // Add to mock data
        this.mockUpdates.unshift(newUpdate);

        // Store the update
        await uploadData('legislative_updates', newUpdate);

        // Analyze impact on existing cases
        await this.analyzeImpactOnCases(newUpdate);

        console.log(`Processed mock legislative update: ${newUpdate.title}`);
    }

    /**
     * Mock case impact analysis
     */
    async analyzeImpactOnCases(update: LegislativeUpdate): Promise<CaseImpactAnalysis[]> {
        try {
            // Get all active cases
            const cases = await getAll('cases');
            const impactAnalyses: CaseImpactAnalysis[] = [];

            // Simulate analysis for first few cases
            const casesToAnalyze = cases.slice(0, 3);

            for (const caseData of casesToAnalyze) {
                const impact = await this.assessCaseImpact(caseData, update);
                if (impact) {
                    impactAnalyses.push(impact);
                    this.mockImpacts.push(impact);
                    await uploadData('case_impact_analyses', impact);
                }
            }

            return impactAnalyses;
        } catch (error) {
            console.error('Failed to analyze case impacts:', error);
            return [];
        }
    }

    /**
     * Assess specific case impact from legislative update
     */
    private async assessCaseImpact(
        caseData: any,
        update: LegislativeUpdate
    ): Promise<CaseImpactAnalysis | null> {
        // Mock relevance calculation
        const relevanceScore = Math.random() * 0.8 + 0.2; // Random score between 0.2-1.0

        if (relevanceScore < 0.3) {
            return null;
        }

        const impactTypes: CaseImpactAnalysis['impactType'][] = ['procedural', 'substantive', 'evidential', 'jurisdictional'];
        const impactType = impactTypes[Math.floor(Math.random() * impactTypes.length)];

        const severity = this.determineSeverity(relevanceScore, update.impactLevel);
        const requiredActions = this.generateRequiredActions(caseData, update, impactType);
        const recommendations = this.generateRecommendations(caseData, update);

        return {
            caseId: caseData.id,
            updateId: update.id,
            impactType,
            severity,
            requiredActions,
            recommendations,
            deadline: this.calculateDeadline(update, severity)
        };
    }

    /**
     * Determine severity level
     */
    private determineSeverity(
        relevanceScore: number,
        updateImpactLevel: LegislativeUpdate['impactLevel']
    ): CaseImpactAnalysis['severity'] {
        const severityMatrix = {
            'low': { high: 'moderate', medium: 'minimal', low: 'minimal' },
            'medium': { high: 'significant', medium: 'moderate', low: 'minimal' },
            'high': { high: 'critical', medium: 'significant', low: 'moderate' },
            'critical': { high: 'critical', medium: 'critical', low: 'significant' }
        };

        const relevanceLevel = relevanceScore > 0.7 ? 'high' :
            relevanceScore > 0.5 ? 'medium' : 'low';

        return severityMatrix[updateImpactLevel][relevanceLevel] as CaseImpactAnalysis['severity'];
    }

    /**
     * Generate required actions
     */
    private generateRequiredActions(
        caseData: any,
        update: LegislativeUpdate,
        impactType: CaseImpactAnalysis['impactType']
    ): string[] {
        const actions: string[] = [];

        switch (impactType) {
            case 'procedural':
                actions.push('Review case procedures against new requirements');
                actions.push('Update case workflow if necessary');
                break;
            case 'substantive':
                actions.push('Reassess legal arguments');
                actions.push('Consider case merits under new law');
                break;
            case 'evidential':
                actions.push('Review evidence admissibility');
                actions.push('Update evidence collection procedures');
                break;
            case 'jurisdictional':
                actions.push('Verify court jurisdiction remains valid');
                actions.push('Check if case needs transfer');
                break;
        }

        actions.push('Notify all parties of legislative change');
        actions.push('Update case documentation');

        return actions;
    }

    /**
     * Generate recommendations
     */
    private generateRecommendations(
        caseData: any,
        update: LegislativeUpdate
    ): string[] {
        return [
            'Schedule case review meeting with legal team',
            'Prepare briefing document on legislative changes',
            'Consider requesting case postponement if needed',
            'Update case timeline and milestones',
            'Consult with subject matter experts if required'
        ];
    }

    /**
     * Calculate deadline for addressing impact
     */
    private calculateDeadline(
        update: LegislativeUpdate,
        severity: CaseImpactAnalysis['severity']
    ): string | undefined {
        const effectiveDate = new Date(update.effectiveDate);
        const now = new Date();

        const daysUntilEffective = Math.floor(
            (effectiveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        let deadlineDays: number;
        switch (severity) {
            case 'critical':
                deadlineDays = Math.min(3, Math.floor(daysUntilEffective * 0.1));
                break;
            case 'significant':
                deadlineDays = Math.min(7, Math.floor(daysUntilEffective * 0.2));
                break;
            case 'moderate':
                deadlineDays = Math.min(14, Math.floor(daysUntilEffective * 0.3));
                break;
            default:
                deadlineDays = Math.min(30, Math.floor(daysUntilEffective * 0.5));
        }

        const deadline = new Date();
        deadline.setDate(deadline.getDate() + Math.max(1, deadlineDays));

        return deadline.toISOString();
    }

    /**
     * Assess impact level of legislative update
     */
    private assessImpactLevel(update: any): LegislativeUpdate['impactLevel'] {
        const title = (update.title || '').toLowerCase();
        const summary = (update.summary || '').toLowerCase();

        const criticalKeywords = ['constitution', 'fundamental', 'major reform'];
        const highKeywords = ['procedure', 'evidence', 'jurisdiction', 'penalty'];
        const mediumKeywords = ['amendment', 'revision', 'update'];

        if (criticalKeywords.some(keyword =>
            title.includes(keyword) || summary.includes(keyword))) {
            return 'critical';
        }

        if (highKeywords.some(keyword =>
            title.includes(keyword) || summary.includes(keyword))) {
            return 'high';
        }

        if (mediumKeywords.some(keyword =>
            title.includes(keyword) || summary.includes(keyword))) {
            return 'medium';
        }

        return 'low';
    }

    /**
     * Categorize legislative update
     */
    private categorizeUpdate(update: any): LegislativeUpdate['category'] {
        const title = (update.title || '').toLowerCase();

        if (title.includes('criminal') || title.includes('penal')) {
            return 'criminal';
        }
        if (title.includes('civil') || title.includes('contract')) {
            return 'civil';
        }
        if (title.includes('constitution')) {
            return 'constitutional';
        }
        if (title.includes('commercial') || title.includes('business')) {
            return 'commercial';
        }

        return 'administrative';
    }

    /**
     * Mock user notifications
     */
    private async notifyUsers(update: LegislativeUpdate): Promise<void> {
        try {
            const users = await getAll('users');
            const notifications: any[] = [];

            // Mock notification for relevant users
            const relevantUsers = users.filter((user: any) =>
                this.shouldNotifyUser(user, update)
            ).slice(0, 5); // Limit to 5 users for demo

            for (const user of relevantUsers) {
                notifications.push({
                    id: `notif_${Date.now()}_${user.id}`,
                    userId: user.id,
                    type: 'legislative_update',
                    title: `New Legislative Update: ${update.title}`,
                    message: `A new ${update.category} law update may affect your cases. Impact level: ${update.impactLevel}`,
                    data: {
                        updateId: update.id,
                        category: update.category,
                        impactLevel: update.impactLevel
                    },
                    timestamp: new Date().toISOString(),
                    read: false
                });
            }

            // Store notifications
            for (const notification of notifications) {
                await uploadData('notifications', notification);
            }

            console.log(`Sent ${notifications.length} mock legislative update notifications`);
        } catch (error) {
            console.error('Failed to notify users:', error);
        }
    }

    /**
     * Determine if user should be notified
     */
    private shouldNotifyUser(user: any, update: LegislativeUpdate): boolean {
        if (['judge', 'admin'].includes(user.role)) {
            return true;
        }

        if (user.role === 'lawyer' && user.specializations) {
            return user.specializations.includes(update.category);
        }

        return false;
    }

    /**
     * Add new mock update (for testing)
     */
    addMockUpdate(updateData: Partial<LegislativeUpdate>): void {
        const newUpdate: LegislativeUpdate = {
            id: `mock_${Date.now()}`,
            billNumber: updateData.billNumber || `MB ${new Date().getFullYear()}/${Math.floor(Math.random() * 100)}`,
            title: updateData.title || 'New Mock Legislative Update',
            status: updateData.status || 'introduced',
            summary: updateData.summary || 'This is a new mock legislative update.',
            affectedLaws: updateData.affectedLaws || ['Mock Law'],
            impactLevel: updateData.impactLevel || 'medium',
            effectiveDate: updateData.effectiveDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            category: updateData.category || 'administrative',
            timestamp: new Date().toISOString(),
            source: updateData.source || 'parliament',
            ...updateData
        };

        this.mockUpdates.unshift(newUpdate);
    }

    /**
     * Get connection status
     */
    getConnectionStatus(): boolean {
        return this.isConnected;
    }

    /**
     * Get recent legislative updates
     */
    async getRecentUpdates(limit: number = 10): Promise<LegislativeUpdate[]> {
        try {
            // Try to get from Firebase first, fall back to mock data
            const storedUpdates = await getAll('legislative_updates');
            if (storedUpdates.length > 0) {
                return storedUpdates
                    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, limit) as LegislativeUpdate[];
            }

            // Return mock data if nothing in Firebase
            return this.mockUpdates
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, limit);
        } catch (error) {
            console.error('Failed to get recent updates, using mock data:', error);
            return this.mockUpdates.slice(0, limit);
        }
    }

    /**
     * Get case impact analyses
     */
    async getCaseImpacts(caseId?: string): Promise<CaseImpactAnalysis[]> {
        try {
            const storedImpacts = await getAll('case_impact_analyses');
            let impacts = storedImpacts.length > 0 ? storedImpacts : this.mockImpacts;

            if (caseId) {
                impacts = impacts.filter((a: any) => a.caseId === caseId);
            }

            return impacts as CaseImpactAnalysis[];
        } catch (error) {
            console.error('Failed to get case impacts, using mock data:', error);
            const impacts = caseId
                ? this.mockImpacts.filter(a => a.caseId === caseId)
                : this.mockImpacts;
            return impacts;
        }
    }
}

// Export singleton instance
export const parliamentService = new ParliamentIntegrationService();

/**
 * Mock API Route Handler for Parliament Webhooks
 */
export async function POST(request: Request) {
    try {
        const payload = await request.json();

        console.log('Mock webhook received:', payload);

        // Mock processing without signature verification
        await parliamentService.processWebhook(payload);

        return new Response('OK', { status: 200 });
    } catch (error) {
        console.error('Mock parliament webhook error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

/**
 * Utility function to format legislative updates for display
 */
export function formatLegislativeUpdate(update: LegislativeUpdate): string {
    const statusEmoji = {
        'introduced': '📝',
        'committee': '👥',
        'second_reading': '📖',
        'third_reading': '📚',
        'passed': '✅',
        'assented': '🏛️'
    };

    const impactColor = {
        'low': '🟢',
        'medium': '🟡',
        'high': '🟠',
        'critical': '🔴'
    };

    return `${statusEmoji[update.status]} ${update.title}
📊 Impact: ${impactColor[update.impactLevel]} ${update.impactLevel.toUpperCase()}
📅 Effective: ${new Date(update.effectiveDate).toLocaleDateString()}
📋 Category: ${update.category}
${update.summary}`;
}

/**
 * Hook for React components to use parliament service
 */
export function useParliamentUpdates() {
    const [updates, setUpdates] = useState<LegislativeUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadUpdates = async () => {
            try {
                setLoading(true);
                setError(null);
                const recentUpdates = await parliamentService.getRecentUpdates(20);
                setUpdates(recentUpdates);
            } catch (err) {
                setError('Failed to load parliamentary updates');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadUpdates();

        // Simulate real-time updates every 30 seconds for demo
        const interval = setInterval(() => {
            // Randomly add a new mock update
            if (Math.random() > 0.7) {
                const mockTitles = [
                    'Court Technology Enhancement Act',
                    'Legal Aid Expansion Bill',
                    'Judicial Ethics Amendment',
                    'Electronic Evidence Procedures Act',
                    'Alternative Dispute Resolution Bill'
                ];

                parliamentService.addMockUpdate({
                    title: mockTitles[Math.floor(Math.random() * mockTitles.length)],
                    summary: 'Newly introduced mock legislation for demonstration purposes.',
                    impactLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
                    category: ['administrative', 'civil', 'criminal'][Math.floor(Math.random() * 3)] as any
                });

                loadUpdates();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const refresh = () => {
        const loadUpdates = async () => {
            try {
                setLoading(true);
                setError(null);
                const recentUpdates = await parliamentService.getRecentUpdates(20);
                setUpdates(recentUpdates);
            } catch (err) {
                setError('Failed to load parliamentary updates');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadUpdates();
    };

    return { updates, loading, error, refresh };
}

/**
 * Parliament Dashboard Component
 */
export function ParliamentDashboard() {
    const { updates, loading, error, refresh } = useParliamentUpdates();
    const [selectedUpdate, setSelectedUpdate] = useState<LegislativeUpdate | null>(null);

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
                <button
                    onClick={refresh}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Parliamentary Updates</h3>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={refresh}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Refresh
                    </button>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-600">Mock Data Active</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {updates.map((update) => (
                    <div
                        key={update.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedUpdate(update)}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{update.title}</h4>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{update.summary}</p>
                                <div className="flex items-center space-x-4 mt-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${update.impactLevel === 'critical' ? 'bg-red-100 text-red-800' :
                                            update.impactLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                                update.impactLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                        }`}>
                                        {update.impactLevel} impact
                                    </span>
                                    <span className="text-xs text-gray-500 capitalize">
                                        {update.category} • {update.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs text-blue-600">
                                        {update.source}
                                    </span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 ml-4">
                                {new Date(update.timestamp).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {updates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p>No parliamentary updates available</p>
                    <button
                        onClick={refresh}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Load Updates
                    </button>
                </div>
            )}

            {/* Update Detail Modal */}
            {selectedUpdate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1 pr-4">
                                    <h3 className="text-xl font-semibold text-gray-900">{selectedUpdate.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{selectedUpdate.billNumber}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedUpdate(null)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">Bill Number:</span>
                                        <p className="text-gray-900">{selectedUpdate.billNumber}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Status:</span>
                                        <p className="capitalize text-gray-900">{selectedUpdate.status.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Category:</span>
                                        <p className="capitalize text-gray-900">{selectedUpdate.category}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Impact Level:</span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ml-1 ${selectedUpdate.impactLevel === 'critical' ? 'bg-red-100 text-red-800' :
                                                selectedUpdate.impactLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                                    selectedUpdate.impactLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                            }`}>
                                            {selectedUpdate.impactLevel}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Effective Date:</span>
                                        <p className="text-gray-900">{new Date(selectedUpdate.effectiveDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Source:</span>
                                        <p className="capitalize text-gray-900">{selectedUpdate.source}</p>
                                    </div>
                                </div>

                                <div>
                                    <span className="font-medium text-gray-700">Summary:</span>
                                    <p className="mt-1 text-gray-900 leading-relaxed">{selectedUpdate.summary}</p>
                                </div>

                                {selectedUpdate.affectedLaws && selectedUpdate.affectedLaws.length > 0 && (
                                    <div>
                                        <span className="font-medium text-gray-700">Affected Laws:</span>
                                        <ul className="mt-1 space-y-1">
                                            {selectedUpdate.affectedLaws.map((law, index) => (
                                                <li key={index} className="text-gray-900 pl-4 relative">
                                                    <span className="absolute left-0">•</span>
                                                    {law}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selectedUpdate.amendments && selectedUpdate.amendments.length > 0 && (
                                    <div>
                                        <span className="font-medium text-gray-700">Key Amendments:</span>
                                        <ul className="mt-1 space-y-1">
                                            {selectedUpdate.amendments.map((amendment, index) => (
                                                <li key={index} className="text-gray-900 pl-4 relative">
                                                    <span className="absolute left-0">•</span>
                                                    {amendment}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 pt-4 border-t">
                                    <button
                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                        onClick={() => {
                                            alert('Case impact analysis would be performed here');
                                        }}
                                    >
                                        Analyze Impact
                                    </button>
                                    <button
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                                        onClick={() => {
                                            alert('Full text would be displayed here');
                                        }}
                                    >
                                        View Full Text
                                    </button>
                                    <button
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                                        onClick={() => {
                                            alert('Notification would be sent to relevant users');
                                        }}
                                    >
                                        Notify Team
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Case Impact Analysis Component
 */
export function CaseImpactAnalysis({ caseId }: { caseId?: string }) {
    const [impacts, setImpacts] = useState<CaseImpactAnalysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadImpacts = async () => {
            try {
                setLoading(true);
                setError(null);
                const caseImpacts = await parliamentService.getCaseImpacts(caseId);
                setImpacts(caseImpacts);
            } catch (err) {
                setError('Failed to load case impact analyses');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadImpacts();
    }, [caseId]);

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-3">
                    {[1, 2].map(i => (
                        <div key={i} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
            </div>
        );
    }

    if (impacts.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>No legislative impacts found for this case</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h4 className="text-lg font-semibold">Legislative Impact Analysis</h4>

            {impacts.map((impact, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h5 className="font-medium text-gray-900">
                                {impact.impactType.charAt(0).toUpperCase() + impact.impactType.slice(1)} Impact
                            </h5>
                            <p className="text-sm text-gray-600">Update ID: {impact.updateId}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${impact.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                impact.severity === 'significant' ? 'bg-orange-100 text-orange-800' :
                                    impact.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                            }`}>
                            {impact.severity}
                        </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <h6 className="font-medium text-gray-700 mb-2">Required Actions:</h6>
                            <ul className="space-y-1 text-sm">
                                {impact.requiredActions.map((action, idx) => (
                                    <li key={idx} className="text-gray-900 pl-4 relative">
                                        <span className="absolute left-0 text-red-600">•</span>
                                        {action}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h6 className="font-medium text-gray-700 mb-2">Recommendations:</h6>
                            <ul className="space-y-1 text-sm">
                                {impact.recommendations.map((rec, idx) => (
                                    <li key={idx} className="text-gray-900 pl-4 relative">
                                        <span className="absolute left-0 text-blue-600">•</span>
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {impact.deadline && (
                        <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Deadline:</span> {' '}
                                <span className="text-red-600 font-medium">
                                    {new Date(impact.deadline).toLocaleDateString()}
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

/**
 * Utility function to simulate adding a test legislative update
 */
export function addTestLegislativeUpdate() {
    const testUpdate = {
        title: `Test Legislative Update ${Date.now()}`,
        summary: 'This is a test update created for demonstration purposes.',
        category: 'administrative' as const,
        impactLevel: 'medium' as const,
        status: 'introduced' as const
    };

    parliamentService.addMockUpdate(testUpdate);
    console.log('Test legislative update added:', testUpdate);
}