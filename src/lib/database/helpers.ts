// lib/database/helpers.ts
import { WhereCondition } from '../database';

// Helper function to remove undefined values from objects
export const removeUndefinedFields = (obj: any): any => {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => removeUndefinedFields(item));
    }

    if (obj instanceof Date) {
        return obj.toISOString();
    }

    const cleaned: any = {};

    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                // Convert nested objects to JSON strings for SQLite storage
                cleaned[key] = JSON.stringify(removeUndefinedFields(value));
            } else if (Array.isArray(value)) {
                // Convert arrays to JSON strings for SQLite storage
                cleaned[key] = JSON.stringify(removeUndefinedFields(value));
            } else {
                cleaned[key] = value;
            }
        }
    }

    return cleaned;
};

// Helper function to parse JSON fields back to objects
export const parseJsonFields = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;

    const parsed: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            try {
                // Try to parse as JSON - but avoid parsing simple strings that aren't JSON
                if ((value.startsWith('{') && value.endsWith('}')) ||
                    (value.startsWith('[') && value.endsWith(']'))) {
                    const jsonValue = JSON.parse(value);
                    parsed[key] = jsonValue;
                } else {
                    parsed[key] = value;
                }
            } catch {
                // If parsing fails, keep as string
                parsed[key] = value;
            }
        } else {
            parsed[key] = value;
        }
    }
    return parsed;
};

// Helper to build WHERE clause
export const buildWhereClause = (conditions: WhereCondition[]): { clause: string; params: any[] } => {
    if (!conditions || conditions.length === 0) {
        return { clause: '', params: [] };
    }

    const clauses: string[] = [];
    const params: any[] = [];

    conditions.forEach(condition => {
        if (condition.operator === 'IN' || condition.operator === 'NOT IN') {
            if (!Array.isArray(condition.value) || condition.value.length === 0) {
                throw new Error(`${condition.operator} operator requires a non-empty array`);
            }
            const placeholders = Array(condition.value.length).fill('?').join(', ');
            clauses.push(`JSON_EXTRACT(data, '$.${condition.field}') ${condition.operator} (${placeholders})`);
            params.push(...condition.value);
        } else if (condition.operator === 'LIKE') {
            clauses.push(`JSON_EXTRACT(data, '$.${condition.field}') LIKE ?`);
            params.push(condition.value);
        } else {
            clauses.push(`JSON_EXTRACT(data, '$.${condition.field}') ${condition.operator} ?`);
            params.push(condition.value);
        }
    });

    return {
        clause: `WHERE ${clauses.join(' AND ')}`,
        params
    };
};

// Helper to validate collection name (prevent SQL injection)
export const validateCollectionName = (collectionName: string): boolean => {
    // Allow only alphanumeric characters, underscores, and hyphens
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    return validPattern.test(collectionName) && collectionName.length <= 64;
};

// Helper to sanitize collection name
export const sanitizeCollectionName = (collectionName: string): string => {
    if (!validateCollectionName(collectionName)) {
        throw new Error(`Invalid collection name: ${collectionName}. Only alphanumeric characters, underscores, and hyphens are allowed.`);
    }
    return collectionName;
};