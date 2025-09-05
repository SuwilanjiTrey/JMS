// lib/database/crud.ts
import { randomUUID } from 'crypto';
import {
    sqlite_db,
    createTableIfNotExists,
    WhereCondition,
    QueryOptions,
    DatabaseResult
} from '../database';
import {
    removeUndefinedFields,
    parseJsonFields,
    buildWhereClause,
    sanitizeCollectionName
} from './helpers';

/**
 * Upload data to a collection (table)
 * @param collectionName - Name of the collection/table
 * @param data - Data to insert
 * @returns Promise<boolean> - Success status
 */
export async function uploadData(collectionName: string, data: any): Promise<boolean> {
    try {
        const sanitizedCollectionName = sanitizeCollectionName(collectionName);
        createTableIfNotExists(sanitizedCollectionName);

        const cleanedData = removeUndefinedFields(data);
        const id = data.id || randomUUID();

        const insertSQL = `
            INSERT INTO ${sanitizedCollectionName} (id, data, created_at, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;

        const stmt = sqlite_db.prepare(insertSQL);
        stmt.run(id, JSON.stringify({ ...cleanedData, id }));

        return true;
    } catch (error) {
        console.error("Error adding document: ", error);
        return false;
    }
}

/**
 * Set details for a specific document (upsert operation)
 * @param item - Data to set
 * @param collectionName - Name of the collection/table
 * @param id - Document ID
 * @returns Promise<DatabaseResult> - Result with success status and ID
 */
export async function setDetails(
    item: any,
    collectionName: string,
    id: string | number
): Promise<DatabaseResult> {
    if (!collectionName || !id) {
        console.error("Collection name or document ID is missing.");
        return { success: false, error: "Invalid collection name or document ID." };
    }

    try {
        const sanitizedCollectionName = sanitizeCollectionName(collectionName);
        createTableIfNotExists(sanitizedCollectionName);

        const cleanedItem = removeUndefinedFields(item);
        const documentId = String(id);

        const upsertSQL = `
            INSERT INTO ${sanitizedCollectionName} (id, data, created_at, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET 
                data = ?,
                updated_at = CURRENT_TIMESTAMP
        `;

        const dataWithId = { ...cleanedItem, id: documentId };
        const dataJson = JSON.stringify(dataWithId);

        const stmt = sqlite_db.prepare(upsertSQL);
        stmt.run(documentId, dataJson, dataJson);

        return { success: true, id: documentId };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred.";
        console.error("Error setting document: ", errorMessage);
        return { success: false, error: errorMessage };
    }
}

/**
 * Delete a document from a collection
 * @param collectionName - Name of the collection/table
 * @param documentId - ID of document to delete
 * @returns Promise<DatabaseResult> - Result with success status
 */
export async function deleteData(
    collectionName: string,
    documentId: string | number
): Promise<DatabaseResult> {
    if (!collectionName || !documentId) {
        console.error("Collection name or document ID is missing.");
        return { success: false, error: "Invalid collection name or document ID." };
    }

    try {
        const sanitizedCollectionName = sanitizeCollectionName(collectionName);
        createTableIfNotExists(sanitizedCollectionName);

        const deleteSQL = `DELETE FROM ${sanitizedCollectionName} WHERE id = ?`;
        const stmt = sqlite_db.prepare(deleteSQL);
        const result = stmt.run(String(documentId));

        if (result.changes === 0) {
            return { success: false, error: "Document not found." };
        }

        console.log(`Document with ID "${documentId}" successfully deleted from collection "${collectionName}".`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting document:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred.",
        };
    }
}

/**
 * Fetch data from a collection with optional limit
 * @param collectionName - Name of the collection/table
 * @param count - Optional limit on number of documents
 * @returns Promise<any[]> - Array of documents
 */
export async function fetchData(collectionName: string, count?: number): Promise<any[]> {
    try {
        const sanitizedCollectionName = sanitizeCollectionName(collectionName);
        createTableIfNotExists(sanitizedCollectionName);

        let selectSQL = `SELECT data FROM ${sanitizedCollectionName} ORDER BY created_at DESC`;

        if (count) {
            selectSQL += ` LIMIT ?`;
        }

        const stmt = sqlite_db.prepare(selectSQL);
        const rows = count ? stmt.all(count) : stmt.all();

        return rows.map(row => parseJsonFields(JSON.parse((row as any).data)));
    } catch (error) {
        console.error("Error fetching data:", error);
        return [];
    }
}

/**
 * Set details for multiple documents using transaction
 * @param items - Array of items to set
 * @param collectionName - Name of the collection/table
 * @returns Promise<{ success: boolean; errors: string[] }>
 */
export async function setDetailsOfMany(
    items: any[],
    collectionName: string
): Promise<{ success: boolean; errors: string[] }> {
    let success = true;
    let errors: string[] = [];

    if (!items || items.length === 0) {
        return { success: true, errors: [] };
    }

    const sanitizedCollectionName = sanitizeCollectionName(collectionName);
    createTableIfNotExists(sanitizedCollectionName);

    // Use transaction for batch operations
    const transaction = sqlite_db.transaction((items: any[]) => {
        const upsertSQL = `
            INSERT INTO ${sanitizedCollectionName} (id, data, created_at, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET 
                data = ?,
                updated_at = CURRENT_TIMESTAMP
        `;

        const stmt = sqlite_db.prepare(upsertSQL);

        for (const item of items) {
            const id = item.id;
            if (!id) {
                errors.push("Item missing ID field");
                success = false;
                continue;
            }

            try {
                const cleanedItem = removeUndefinedFields(item);
                const documentId = String(id);
                const dataWithId = { ...cleanedItem, id: documentId };
                const dataJson = JSON.stringify(dataWithId);

                stmt.run(documentId, dataJson, dataJson);
            } catch (error) {
                success = false;
                errors.push(`Error processing item ${id}: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        }
    });

    try {
        transaction(items);
    } catch (error) {
        success = false;
        errors.push(error instanceof Error ? error.message : "Transaction failed");
    }

    return { success, errors };
}

/**
 * Get one document by ID
 * @param id - Document ID
 * @param collectionName - Name of the collection/table
 * @returns Promise<any> - Document data
 */
export async function getOne(id: string | number, collectionName: string): Promise<any> {
    try {
        const sanitizedCollectionName = sanitizeCollectionName(collectionName);
        createTableIfNotExists(sanitizedCollectionName);

        const selectSQL = `SELECT data FROM ${sanitizedCollectionName} WHERE id = ?`;
        const stmt = sqlite_db.prepare(selectSQL);
        const row = stmt.get(String(id)) as any;

        if (!row) {
            throw new Error("No such document!");
        }

        return parseJsonFields(JSON.parse(row.data));
    } catch (error) {
        console.error("Error getting document:", error);
        throw error;
    }
}

/**
 * Get limited number of documents
 * @param limitNumber - Number of documents to fetch
 * @param collectionName - Name of the collection/table
 * @returns Promise<any[]> - Array of documents
 */
export async function getLimitedMany(limitNumber: number, collectionName: string): Promise<any[]> {
    try {
        const sanitizedCollectionName = sanitizeCollectionName(collectionName);
        createTableIfNotExists(sanitizedCollectionName);

        const selectSQL = `SELECT data FROM ${sanitizedCollectionName} ORDER BY created_at DESC LIMIT ?`;
        const stmt = sqlite_db.prepare(selectSQL);
        const rows = stmt.all(limitNumber);

        return rows.map(row => parseJsonFields(JSON.parse((row as any).data)));
    } catch (error) {
        console.error("Error getting documents:", error);
        throw error;
    }
}

/**
 * Get all documents from a collection
 * @param collectionName - Name of the collection/table
 * @returns Promise<any[]> - Array of all documents
 */
export async function getAll(collectionName: string): Promise<any[]> {
    try {
        const sanitizedCollectionName = sanitizeCollectionName(collectionName);
        createTableIfNotExists(sanitizedCollectionName);

        const selectSQL = `SELECT data FROM ${sanitizedCollectionName} ORDER BY created_at DESC`;
        const stmt = sqlite_db.prepare(selectSQL);
        const rows = stmt.all();

        return rows.map(row => parseJsonFields(JSON.parse((row as any).data)));
    } catch (error) {
        console.error("Error getting documents:", error);
        throw error;
    }
}

/**
 * Get all documents where a field equals a specific value
 * @param collectionName - Name of the collection/table
 * @param attributeName - Field name to filter by
 * @param value - Value to match
 * @returns Promise<any[]> - Array of matching documents
 */
export async function getAllWhereEquals(
    collectionName: string,
    attributeName: string,
    value: any
): Promise<any[]> {
    try {
        const sanitizedCollectionName = sanitizeCollectionName(collectionName);
        createTableIfNotExists(sanitizedCollectionName);

        const selectSQL = `
            SELECT data FROM ${sanitizedCollectionName} 
            WHERE JSON_EXTRACT(data, '$.${attributeName}') = ?
            ORDER BY created_at DESC
        `;

        const stmt = sqlite_db.prepare(selectSQL);
        const rows = stmt.all(value);

        return rows.map(row => parseJsonFields(JSON.parse((row as any).data)));
    } catch (error) {
        console.error("Error getting documents:", error);
        throw error;
    }
}

/**
 * Advanced query function with multiple conditions
 * @param collectionName - Name of the collection/table
 * @param options - Query options including where conditions, ordering, pagination
 * @returns Promise<any[]> - Array of matching documents
 */
export async function queryDocuments(
    collectionName: string,
    options: QueryOptions = {}
): Promise<any[]> {
    try {
        const sanitizedCollectionName = sanitizeCollectionName(collectionName);
        createTableIfNotExists(sanitizedCollectionName);

        let selectSQL = `SELECT data FROM ${sanitizedCollectionName}`;
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
 * Count documents in a collection with optional conditions
 * @param collectionName - Name of the collection/table
 * @param conditions - Optional where conditions
 * @returns Promise<number> - Count of matching documents
 */
export async function countDocuments(
    collectionName: string,
    conditions?: WhereCondition[]
): Promise<number> {
    try {
        const sanitizedCollectionName = sanitizeCollectionName(collectionName);
        createTableIfNotExists(sanitizedCollectionName);

        let countSQL = `SELECT COUNT(*) as count FROM ${sanitizedCollectionName}`;
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
 * Update specific fields in a document
 * @param collectionName - Name of the collection/table
 * @param documentId - ID of document to update
 * @param updates - Object with fields to update
 * @returns Promise<DatabaseResult> - Result with success status
 */
export async function updateDocument(
    collectionName: string,
    documentId: string | number,
    updates: Partial<any>
): Promise<DatabaseResult> {
    try {
        const sanitizedCollectionName = sanitizeCollectionName(collectionName);
        createTableIfNotExists(sanitizedCollectionName);

        // First get the existing document
        const existing = await getOne(documentId, collectionName);
        if (!existing) {
            return { success: false, error: "Document not found" };
        }

        // Merge updates with existing data
        const updatedData = { ...existing, ...removeUndefinedFields(updates) };

        // Use setDetails to perform the update
        return await setDetails(updatedData, collectionName, documentId);
    } catch (error) {
        console.error("Error updating document:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred.",
        };
    }
}

/**
 * Delete multiple documents matching conditions
 * @param collectionName - Name of the collection/table
 * @param conditions - Where conditions for documents to delete
 * @returns Promise<DatabaseResult> - Result with success status and count
 */
export async function deleteMany(
    collectionName: string,
    conditions: WhereCondition[]
): Promise<DatabaseResult<{ deletedCount: number }>> {
    try {
        const sanitizedCollectionName = sanitizeCollectionName(collectionName);
        createTableIfNotExists(sanitizedCollectionName);

        let deleteSQL = `DELETE FROM ${sanitizedCollectionName}`;
        const params: any[] = [];

        if (conditions && conditions.length > 0) {
            const { clause, params: whereParams } = buildWhereClause(conditions);
            deleteSQL += ` ${clause}`;
            params.push(...whereParams);
        } else {
            return { success: false, error: "No conditions provided for delete operation" };
        }

        const stmt = sqlite_db.prepare(deleteSQL);
        const result = stmt.run(...params);

        return {
            success: true,
            data: { deletedCount: result.changes }
        };
    } catch (error) {
        console.error("Error deleting documents:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred.",
        };
    }
}