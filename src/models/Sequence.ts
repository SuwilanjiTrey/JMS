export interface SequenceCounter {
    id: string; // e.g., 'CASE_NUMBER_2025'
    current: number;
    prefix?: string; // e.g., 'CR', 'CIV'
    year: number; // 2025
    updatedAt: Date;
}