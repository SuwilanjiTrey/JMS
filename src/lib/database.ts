// lib/database.ts
import Database from 'better-sqlite3';
import path from 'path';

// Create SQLite database connection
const sqlite_db = new Database(path.join(process.cwd(), 'database.sqlite'));

// Enable WAL mode for better concurrent access
sqlite_db.pragma('journal_mode = WAL');

// Enable foreign keys
sqlite_db.pragma('foreign_keys = ON');

// Initialize table creation helper
export const createTableIfNotExists = (tableName: string): void => {
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

    // Create index for updated_at
    const createUpdatedIndexSQL = `CREATE INDEX IF NOT EXISTS idx_${tableName}_updated_at ON ${tableName}(updated_at)`;
    sqlite_db.exec(createUpdatedIndexSQL);
};

// Close database connection
export const closeDatabase = (): void => {
    sqlite_db.close();
};

// Export the database instance
export { sqlite_db };

// Type definitions
export type WhereCondition = {
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN';
    value: any;
};

export type QueryOptions = {
    limit?: number;
    offset?: number;
    orderBy?: { field: string; direction: 'ASC' | 'DESC' };
    where?: WhereCondition[];
};

export type DatabaseResult<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
    id?: string | number;
};