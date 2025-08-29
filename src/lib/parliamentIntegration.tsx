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

class ParliamentIntegrationService {
    private webhookEndpoint = '/api/parliament/webhook';
    private parliamentApiUrl = process.env.PARLIAMENT_API_URL || 'https://api.parliament.zm';
    private apiKey = process.env.PARLIAMENT_API_KEY || '';
    private isConnected = false;

    constructor() {
        this.initializeConnection();
    }

    /**
     * Initialize connection to Parliament API
     */
    async initializeConnection(): Promise<boolean> {
        try {
            // Test connection to Parliament API
            const response = await fetch(`${this.parliamentApiUrl}/health`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            this.isConnected = response.ok;

            if (this.isConnected) {
                console.log('Parliament API connection established');
                await this.setupWebhooks();
                await this.syncInitialData();
            }

            return this.isConnected;
        } catch (error) {
            console.error('Failed to connect to Parliament API:', error);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Setup webhooks for real-time updates
     */
    private async setupWebhooks(): Promise<void> {
        try {
            const webhookConfig = {
                url: `${window.location.origin}${this.webhookEndpoint}`,
                events: [
                    'bill.introduced',
                    'bill.amended',
                    'bill.passed',
                    'bill.assented',
                    'act.gazetted',
                    'regulation.published'
                ],
                secret: process.env.WEBHOOK_SECRET
            };

            await fetch(`${this.parliamentApiUrl}/webhooks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(webhookConfig)
            });

            console.log('Parliament webhooks configured successfully');
        } catch (error) {
            console.error('Failed to setup parliament webhooks:', error);
        }
    }

    /**
     * Sync initial legislative data
     */
    private async syncInitialData(): Promise<void> {
        try {
            // Fetch recent bills and acts
            const [bills, acts, regulations] = await Promise.all([
                this.fetchRecentBills(),
                this.fetchRecentActs(),
                this.fetchRecentRegulations()
            ]);

            // Store in Firebase
            const allUpdates = [...bills, ...acts, ...regulations];
            for (const update of allUpdates) {
                await uploadData('legislative_updates', update);
            }

            console.log(`Synced ${allUpdates.length} legislative updates`);
        } catch (error) {
            console.error('Failed to sync initial legislative data:', error);
        }
    }

    /**
     * Fetch recent bills from Parliament API
     */
    async fetchRecentBills(): Promise<LegislativeUpdate[]> {
        try {
            const response = await fetch(`${this.parliamentApiUrl}/bills/recent`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const bills = await response.json();

            return bills.map((bill: any) => ({
                id: `bill_${bill.id}`,
                billNumber: bill.number,
                title: bill.title,
                status: bill.status,
                summary: bill.summary,
                affectedLaws: bill.affected_laws || [],
                impactLevel: this.assessImpactLevel(bill),
                effectiveDate: bill.effective_date,
                category: this.categorizeUpdate(bill),
                fullText: bill.full_text,
                amendments: bill.amendments || [],
                timestamp: new Date().toISOString(),
                source: 'parliament'
            }));
        } catch (error) {
            console.error('Failed to fetch recent bills:', error);
            return [];
        }
    }

    /**
     * Fetch recent acts
     */
    async fetchRecentActs(): Promise<LegislativeUpdate[]> {
        // Similar implementation for acts
        return [];
    }

    /**
     * Fetch recent regulations
     */
    async fetchRecentRegulations(): Promise<LegislativeUpdate[]> {
        // Similar implementation for regulations
        return [];
    }

    /**
     * Process incoming webhook from Parliament
     */
    async processWebhook(payload: any): Promise<void> {
        try {
            const update: LegislativeUpdate = {
                id: `${payload.type}_${payload.id}`,
                billNumber: payload.bill_number || payload.act_number,
                title: payload.title,
                status: payload.status,
                summary: payload.summary,
                affectedLaws: payload.affected_laws || [],
                impactLevel: this.assessImpactLevel(payload),
                effectiveDate: payload.effective_date,
                category: this.categorizeUpdate(payload),
                timestamp: new Date().toISOString(),
                source: 'parliament'
            };

            // Store the update
            await uploadData('legislative_updates', update);

            // Analyze impact on existing cases
            await this.analyzeImpactOnCases(update);

            // Notify relevant users
            await this.notifyUsers(update);

            console.log(`Processed legislative update: ${update.title}`);
        } catch (error) {
            console.error('Failed to process parliament webhook:', error);
        }
    }

    /**
     * Analyze impact of legislative update on existing cases
     */
    async analyzeImpactOnCases(update: LegislativeUpdate): Promise<CaseImpactAnalysis[]> {
        try {
            // Get all active cases
            const cases = await getAll('cases');
            const impactAnalyses: CaseImpactAnalysis[] = [];

            for (const caseData of cases) {
                const impact = await this.assessCaseImpact(caseData, update);
                if (impact) {
                    impactAnalyses.push(impact);
                    // Store impact analysis
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
        // AI-powered impact analysis logic
        const relevanceScore = this.calculateRelevanceScore(caseData, update);

        if (relevanceScore < 0.3) {
            return null; // Not relevant enough
        }

        const impactType = this.determineImpactType(caseData, update);
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
     * Calculate relevance score between case and update
     */
    private calculateRelevanceScore(caseData: any, update: LegislativeUpdate): number {
        let score = 0;

        // Category match
        if (caseData.category === update.category) {
            score += 0.4;
        }

        // Keywords in case title/description
        const caseText = `${caseData.title} ${caseData.description}`.toLowerCase();
        const updateText = `${update.title} ${update.summary}`.toLowerCase();

        const commonKeywords = this.findCommonKeywords(caseText, updateText);
        score += Math.min(commonKeywords.length * 0.1, 0.3);

        // Affected laws overlap
        if (caseData.applicable_laws && update.affectedLaws) {
            const overlap = caseData.applicable_laws.filter((law: string) =>
                update.affectedLaws.includes(law)
            ).length;
            score += Math.min(overlap * 0.2, 0.3);
        }

        return Math.min(score, 1.0);
    }

    /**
     * Find common keywords between texts
     */
    private findCommonKeywords(text1: string, text2: string): string[] {
        const keywords1 = text1.split(/\s+/).filter(word => word.length > 4);
        const keywords2 = text2.split(/\s+/).filter(word => word.length > 4);

        return keywords1.filter(keyword => keywords2.includes(keyword));
    }

    /**
     * Determine impact type
     */
    private determineImpactType(
        caseData: any,
        update: LegislativeUpdate
    ): CaseImpactAnalysis['impactType'] {
        // Logic to determine if impact is procedural, substantive, etc.
        if (update.title.toLowerCase().includes('procedure')) {
            return 'procedural';
        }
        if (update.title.toLowerCase().includes('evidence')) {
            return 'evidential';
        }
        if (update.title.toLowerCase().includes('jurisdiction')) {
            return 'jurisdictional';
        }
        return 'substantive';
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

        // Add common actions
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

        // Calculate days until effective date
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
        deadline.setDate(deadline.getDate() + deadlineDays);

        return deadline.toISOString();
    }

    /**
     * Assess impact level of legislative update
     */
    private assessImpactLevel(update: any): LegislativeUpdate['impactLevel'] {
        // Logic to assess impact level based on update content
        const title = update.title.toLowerCase();
        const summary = update.summary?.toLowerCase() || '';

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
        const title = update.title.toLowerCase();

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
     * Notify relevant users of legislative update
     */
    private async notifyUsers(update: LegislativeUpdate): Promise<void> {
        try {
            // Get users who should be notified based on their roles and case assignments
            const users = await getAll('users');
            const notifications: any[] = [];

            for (const user of users) {
                if (this.shouldNotifyUser(user, update)) {
                    notifications.push({
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
            }

            // Store notifications
            for (const notification of notifications) {
                await uploadData('notifications', notification);
            }

            console.log(`Sent ${notifications.length} legislative update notifications`);
        } catch (error) {
            console.error('Failed to notify users:', error);
        }
    }

    /**
     * Determine if user should be notified
     */
    private shouldNotifyUser(user: any, update: LegislativeUpdate): boolean {
        // Notify all judges and admins
        if (['judge', 'admin'].includes(user.role)) {
            return true;
        }

        // Notify lawyers with relevant cases
        if (user.role === 'lawyer' && user.specializations) {
            return user.specializations.includes(update.category);
        }

        return false;
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
            const updates = await getAll('legislative_updates');
            return updates
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, limit) as LegislativeUpdate[];
        } catch (error) {
            console.error('Failed to get recent updates:', error);
            return [];
        }
    }

    /**
     * Get case impact analyses
     */
    async getCaseImpacts(caseId?: string): Promise<CaseImpactAnalysis[]> {
        try {
            if (caseId) {
                return await getAll('case_impact_analyses')
                    .then(analyses => analyses.filter(a => a.caseId === caseId)) as CaseImpactAnalysis[];
            }
            return await getAll('case_impact_analyses') as CaseImpactAnalysis[];
        } catch (error) {
            console.error('Failed to get case impacts:', error);
            return [];
        }
    }
}

// Export singleton instance
export const parliamentService = new ParliamentIntegrationService();

/**
 * API Route Handler for Parliament Webhooks
 * Place this in: src/app/api/parliament/webhook/route.ts
 */
export async function POST(request: Request) {
    try {
        const payload = await request.json();

        // Verify webhook signature
        const signature = request.headers.get('x-parliament-signature');
        if (!verifyWebhookSignature(payload, signature)) {
            return new Response('Unauthorized', { status: 401 });
        }

        // Process the webhook
        await parliamentService.processWebhook(payload);

        return new Response('OK', { status: 200 });
    } catch (error) {
        console.error('Parliament webhook error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

/**
 * Verify webhook signature for security
 */
function verifyWebhookSignature(payload: any, signature: string | null): boolean {
    if (!signature || !process.env.WEBHOOK_SECRET) {
        return false;
    }

    // Implementation would verify HMAC signature
    // This is a simplified version
    const crypto = require('crypto');
    const expectedSignature = crypto
        .createHmac('sha256', process.env.WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

    return signature === `sha256=${expectedSignature}`;
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
                const recentUpdates = await parliamentService.getRecentUpdates(20);
                setUpdates(recentUpdates);
                setError(null);
            } catch (err) {
                setError('Failed to load parliamentary updates');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadUpdates();

        // Set up real-time updates if WebSocket is available
        const interval = setInterval(loadUpdates, 60000); // Check every minute

        return () => clearInterval(interval);
    }, []);

    return { updates, loading, error, refresh: () => window.location.reload() };
}

/**
 * Parliament Dashboard Component
 * This can be used in the admin dashboard
 */
export function ParliamentDashboard() {
    const { updates, loading, error } = useParliamentUpdates();
    const [selectedUpdate, setSelectedUpdate] = useState<LegislativeUpdate | null>(null);

    if (loading) {
        return <div className="animate-pulse">Loading parliamentary updates...</div>;
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
                <button
                    onClick={() => window.location.reload()}
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
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600">Live Updates</span>
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
                                <h4 className="font-medium text-zambia-black">{update.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{update.summary}</p>
                                <div className="flex items-center space-x-4 mt-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${update.impactLevel === 'critical' ? 'bg-red-100 text-red-800' :
                                            update.impactLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                                update.impactLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                        }`}>
                                        {update.impactLevel} impact
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {update.category} • {update.status}
                                    </span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-400">
                                {new Date(update.timestamp).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {updates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No parliamentary updates available
                </div>
            )}

            {/* Update Detail Modal */}
            {selectedUpdate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-xl font-semibold">{selectedUpdate.title}</h3>
                                <button
                                    onClick={() => setSelectedUpdate(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Bill Number:</span>
                                        <p>{selectedUpdate.billNumber}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">Status:</span>
                                        <p className="capitalize">{selectedUpdate.status.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">Category:</span>
                                        <p className="capitalize">{selectedUpdate.category}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">Effective Date:</span>
                                        <p>{new Date(selectedUpdate.effectiveDate).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div>
                                    <span className="font-medium">Summary:</span>
                                    <p className="mt-1 text-gray-700">{selectedUpdate.summary}</p>
                                </div>

                                {selectedUpdate.affectedLaws.length > 0 && (
                                    <div>
                                        <span className="font-medium">Affected Laws:</span>
                                        <ul className="mt-1 list-disc list-inside text-gray-700">
                                            {selectedUpdate.affectedLaws.map((law, index) => (
                                                <li key={index}>{law}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selectedUpdate.amendments && selectedUpdate.amendments.length > 0 && (
                                    <div>
                                        <span className="font-medium">Key Amendments:</span>
                                        <ul className="mt-1 list-disc list-inside text-gray-700">
                                            {selectedUpdate.amendments.map((amendment, index) => (
                                                <li key={index}>{amendment}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="flex space-x-2 pt-4">
                                    <button className="px-4 py-2 bg-zambia-green text-white rounded hover:bg-zambia-green/90">
                                        Analyze Impact
                                    </button>
                                    <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                                        View Full Text
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