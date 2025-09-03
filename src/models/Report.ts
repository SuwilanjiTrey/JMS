export interface CaseloadReportItem {
    status: string; // CaseStatus
    total: number;
}

export interface PerformanceMetric {
    judgeId: string;
    judgeName?: string;
    totalCases: number;
    casesClosed: number;
    avgResolutionDays?: number;
}

export interface TrendPoint {
    date: string; // YYYY-MM-DD
    casesCreated: number;
    casesClosed: number;
    hearingsScheduled: number;
}