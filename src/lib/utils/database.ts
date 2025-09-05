// lib/database.ts
import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';

const sqlite_db = new Database(path.join(process.cwd(), 'database.sqlite'));

// Enable WAL mode for better concurrent access
sqlite_db.pragma('journal_mode = WAL');

// Type definitions
type WhereCondition = {
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN';
    value: any;
};

type QueryOptions = {
    limit?: number;
    offset?: number;
    orderBy?: { field: string; direction: 'ASC' | 'DESC' };
    where?: WhereCondition[];
};

// Helper function to remove undefined values from objects
const removeUndefinedFields = (obj: any): any => {
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
const parseJsonFields = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;

    const parsed: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            try {
                // Try to parse as JSON
                const jsonValue = JSON.parse(value);
                parsed[key] = jsonValue;
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

// Initialize table creation helper
const createTableIfNotExists = (tableName: string): void => {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    sqlite_db.exec(createTableSQL);

    // Create index for faster queries
    const createIndexSQL = `CREATE INDEX IF NOT EXISTS idx_${tableName}_created_at ON ${tableName}(created_at)`;
    sqlite_db.exec(createIndexSQL);
};

// Helper to build WHERE clause
const buildWhereClause = (conditions: WhereCondition[]): { clause: string; params: any[] } => {
    if (!conditions || conditions.length === 0) {
        return { clause: '', params: [] };
    }

    const clauses: string[] = [];
    const params: any[] = [];

    conditions.forEach(condition => {
        if (condition.operator === 'IN') {
            const placeholders = Array(condition.value.length).fill('?').join(', ');
            clauses.push(`JSON_EXTRACT(data, '$.${condition.field}') IN (${placeholders})`);
            params.push(...condition.value);
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

/**
 * Advanced query function with multiple conditions
 */
export async function queryDocuments(
    collectionName: string,
    options: QueryOptions = {}
): Promise<any[]> {
    try {
        createTableIfNotExists(collectionName);

        let selectSQL = `SELECT data FROM ${collectionName}`;
        const params: any[] = [];

        // Build WHERE clause
        if (options.where && options.where.length > 0) {
            const { clause, params: whereParams } = buildWhereClause(options.where);
            selectSQL += ` ${clause}`;
            params.push(...whereParams);
        }

        // Add ORDER BY
        if (options.orderBy) {
            selectSQL += ` ORDER BY JSON_EXTRACT(data, '$.${options.orderBy.field}') ${options.orderBy.direction}`;
        } else {
            selectSQL += ` ORDER BY created_at DESC`;
        }

        // Add LIMIT and OFFSET
        if (options.limit) {
            selectSQL += ` LIMIT ?`;
            params.push(options.limit);
        }

        if (options.offset) {
            selectSQL += ` OFFSET ?`;
            params.push(options.offset);
        }

        const stmt = sqlite_db.prepare(selectSQL);
        const rows = stmt.all(...params);

        return rows.map(row => parseJsonFields(JSON.parse((row as any).data)));
    } catch (error) {
        console.error("Error querying documents:", error);
        throw error;
    }
}

/**
 * Count documents in a collection
 */
export async function countDocuments(
    collectionName: string,
    conditions?: WhereCondition[]
): Promise<number> {
    try {
        createTableIfNotExists(collectionName);

        let countSQL = `SELECT COUNT(*) as count FROM ${collectionName}`;
        const params: any[] = [];

        if (conditions && conditions.length > 0) {
            const { clause, params: whereParams } = buildWhereClause(conditions);
            countSQL += ` ${clause}`;
            params.push(...whereParams);
        }

        const stmt = sqlite_db.prepare(countSQL);
        const result = stmt.get(...params) as any;

        return result.count;
    } catch (error) {
        console.error("Error counting documents:", error);
        throw error;
    }
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
    sqlite_db.close();
}

// Export the database instance for advanced usage
export { sqlite_db };

// Export types for external use
export type { WhereCondition, QueryOptions };