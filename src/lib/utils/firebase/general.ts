// src/lib/utils/general.ts
import { randomUUID } from 'crypto';
import { db } from '@/lib/database'; // Import our SQLite database instance

// Helper function to remove undefined values from objects
const removeUndefinedFields = (obj: any): any => {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => removeUndefinedFields(item));
    }
    if (obj instanceof Date) {
        return obj;
    }
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                // Recursively clean nested objects
                const cleanedNested = removeUndefinedFields(value);
                if (Object.keys(cleanedNested).length > 0) {
                    cleaned[key] = cleanedNested;
                }
            } else {
                cleaned[key] = value;
            }
        }
    }
    return cleaned;
};

// CRUD Operations using SQLite
export async function uploadData(collectionName: string, data: any): Promise<boolean> {
    let uploaded = false;
    try {
        // Clean the data before uploading
        const cleanedData = removeUndefinedFields(data);

        // Map collection name to corresponding SQLite operation
        switch (collectionName) {
            case 'users':
                await userOperations.create(cleanedData);
                break;
            case 'cases':
                await caseOperations.create(cleanedData);
                break;
            case 'hearings':
                await hearingOperations.create(cleanedData);
                break;
            case 'documents':
                await documentOperations.create(cleanedData);
                break;
            case 'rulings':
                await rulingOperations.create(cleanedData);
                break;
            case 'calendarEvents':
                await calendarEventOperations.create(cleanedData);
                break;
            case 'notifications':
                await notificationOperations.create(cleanedData);
                break;
            case 'auditLogs':
                await auditLogOperations.create(cleanedData);
                break;
            default:
                throw new Error(`Unsupported collection: ${collectionName}`);
        }
        uploaded = true;
    } catch (e) {
        console.error("Error adding document: ", e);
    }
    return uploaded;
}

export async function setDetails(item: any, collectionName: string, id: string | number) {
    if (!collectionName || !id) {
        console.error("Collection name or document ID is missing.");
        return { success: false, error: "Invalid collection name or document ID." };
    }
    try {
        // Clean the data before setting
        const cleanedItem = removeUndefinedFields(item);

        // Map collection name to corresponding SQLite operation
        switch (collectionName) {
            case 'users':
                await userOperations.update(id, cleanedItem);
                break;
            case 'cases':
                await caseOperations.update(id, cleanedItem);
                break;
            case 'hearings':
                await hearingOperations.update(id, cleanedItem);
                break;
            case 'documents':
                await documentOperations.update(id, cleanedItem);
                break;
            case 'rulings':
                await rulingOperations.update(id, cleanedItem);
                break;
            case 'calendarEvents':
                await calendarEventOperations.update(id, cleanedItem);
                break;
            case 'notifications':
                await notificationOperations.update(id, cleanedItem);
                break;
            case 'auditLogs':
                await auditLogOperations.update(id, cleanedItem);
                break;
            default:
                throw new Error(`Unsupported collection: ${collectionName}`);
        }
        return { success: true, id };
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error setting document: ", error.message);
            return { success: false, error: error.message };
        } else {
            console.error("Unknown error setting document: ", error);
            return { success: false, error: "Unknown error occurred." };
        }
    }
}

/**
 * Deletes a document from a specified collection in SQLite.
 * @param {string} collectionName - The name of the collection.
 * @param {string} documentId - The ID of the document to delete.
 * @returns {Promise<{ success: boolean, error?: string }>} - Result of the deletion operation.
 */
export async function deleteData(
    collectionName: string,
    documentId: string | number
): Promise<{ success: boolean, error?: string }> {
    // Validate inputs
    if (!collectionName || !documentId) {
        console.error("Collection name or document ID is missing.");
        return { success: false, error: "Invalid collection name or document ID." };
    }

    try {
        // Map collection name to corresponding SQLite operation
        switch (collectionName) {
            case 'users':
                await userOperations.delete(documentId);
                break;
            case 'cases':
                await caseOperations.delete(documentId);
                break;
            case 'hearings':
                await hearingOperations.delete(documentId);
                break;
            case 'documents':
                await documentOperations.delete(documentId);
                break;
            case 'rulings':
                await rulingOperations.delete(documentId);
                break;
            case 'calendarEvents':
                await calendarEventOperations.delete(documentId);
                break;
            case 'notifications':
                await notificationOperations.delete(documentId);
                break;
            case 'auditLogs':
                await auditLogOperations.delete(documentId);
                break;
            default:
                throw new Error(`Unsupported collection: ${collectionName}`);
        }
        return { success: true };
    } catch (error) {
        console.error("Error deleting document:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred."
        };
    }
}

export async function fetchData(collectionName: string, count?: number) {
    try {
        // Map collection name to corresponding SQLite operation
        let data: any[] = [];

        switch (collectionName) {
            case 'users':
                data = await userOperations.findAll();
                break;
            case 'cases':
                data = await caseOperations.findAll();
                break;
            case 'hearings':
                data = await hearingOperations.findAll();
                break;
            case 'documents':
                data = await documentOperations.findAll();
                break;
            case 'rulings':
                data = await rulingOperations.findAll();
                break;
            case 'calendarEvents':
                data = await calendarEventOperations.findAll();
                break;
            case 'notifications':
                data = await notificationOperations.findAll();
                break;
            case 'auditLogs':
                data = await auditLogOperations.findAll();
                break;
            default:
                throw new Error(`Unsupported collection: ${collectionName}`);
        }

        return data;
    } catch (error) {
        console.error("Error getting documents:", error);
        throw error;
    }
}

export async function setDetailsOfMany(items: any[], collectionName: string) {
    let success = true;
    let errors: string[] = [];

    try {
        // Map collection name to corresponding SQLite operation
        switch (collectionName) {
            case 'users':
                await userOperations.setDetailsOfMany(items, collectionName);
                break;
            case 'cases':
                await caseOperations.setDetailsOfMany(items, collectionName);
                break;
            case 'hearings':
                await hearingOperations.setDetailsOfMany(items, collectionName);
                break;
            case 'documents':
                await documentOperations.setDetailsOfMany(items, collectionName);
                break;
            case 'rulings':
                await rulingOperations.setDetailsOfMany(items, collectionName);
                break;
            case 'calendarEvents':
                await calendarEventOperations.setDetailsOfMany(items, collectionName);
                break;
            case 'notifications':
                await notificationOperations.setDetailsOfMany(items, collectionName);
                break;
            case 'auditLogs':
                await auditLogOperations.setDetailsOfMany(items, collectionName);
                break;
            default:
                throw new Error(`Unsupported collection: ${collectionName}`);
        }
    } catch (error) {
        success = false;
        errors.push(error instanceof Error ? error.message : "Unknown error occurred.");
    }
    return { success, errors };
}

export async function getOne(id: string | number, collectionName: string) {
    try {
        // Map collection name to corresponding SQLite operation
        switch (collectionName) {
            case 'users':
                return await userOperations.findById(id);
            case 'cases':
                return await caseOperations.findById(id);
            case 'hearings':
                return await hearingOperations.findById(id);
            case 'documents':
                return await documentOperations.findById(id);
            case 'rulings':
                return await rulingOperations.findById(id);
            case 'calendarEvents':
                return await calendarEventOperations.findById(id);
            case 'notifications':
                return await notificationOperations.findById(id);
            case 'auditLogs':
                return await auditLogOperations.findById(id);
            default:
                throw new Error(`Unsupported collection: ${collectionName}`);
        }
    } catch (error) {
        console.error("Error getting document:", error);
        throw error;
    }
}

export async function getLimitedMany(limitNumber: number, collectionName: string) {
    try {
        // Map collection name to corresponding SQLite operation
        switch (collectionName) {
            case 'users':
                return await userOperations.findLimited(limitNumber);
            case 'cases':
                return await caseOperations.findLimited(limitNumber);
            case 'hearings':
                return await hearingOperations.findLimited(limitNumber);
            case 'documents':
                return await documentOperations.findLimited(limitNumber);
            case 'rulings':
                return await rulingOperations.findLimited(limitNumber);
            case 'calendarEvents':
                return await calendarEventOperations.findLimited(limitNumber);
            case 'notifications':
                return await notificationOperations.findLimited(limitNumber);
            case 'auditLogs':
                return await auditLogOperations.findLimited(limitNumber);
            default:
                throw new Error(`Unsupported collection: ${collectionName}`);
        }
    } catch (error) {
        console.error("Error getting documents:", error);
        throw error;
    }
}

export async function getAll(collectionName: string) {
    try {
        // Map collection name to corresponding SQLite operation
        switch (collectionName) {
            case 'users':
                return await userOperations.findAll();
            case 'cases':
                return await caseOperations.findAll();
            case 'hearings':
                return await hearingOperations.findAll();
            case 'documents':
                return await documentOperations.findAll();
            case 'rulings':
                return await rulingOperations.findAll();
            case 'calendarEvents':
                return await calendarEventOperations.findAll();
            case 'notifications':
                return await notificationOperations.findAll();
            case 'auditLogs':
                return await auditLogOperations.findAll();
            default:
                throw new Error(`Unsupported collection: ${collectionName}`);
        }
    } catch (error) {
        console.error("Error getting documents:", error);
        throw error;
    }
}

export async function getAllWhereEquals(collectionName: string, attributeName: string, value: any) {
    try {
        // Map collection name to corresponding SQLite operation
        switch (collectionName) {
            case 'users':
                return await userOperations.findAllWhere(attributeName, value);
            case 'cases':
                return await caseOperations.findAllWhere(attributeName, value);
            case 'hearings':
                return await hearingOperations.findAllWhere(attributeName, value);
            case 'documents':
                return await documentOperations.findAllWhere(attributeName, value);
            case 'rulings':
                return await rulingOperations.findAllWhere(attributeName, value);
            case 'calendarEvents':
                return await calendarEventOperations.findAllWhere(attributeName, value);
            case 'notifications':
                return await notificationOperations.findAllWhere(attributeName, value);
            case 'auditLogs':
                return await auditLogOperations.findAllWhere(attributeName, value);
            default:
                throw new Error(`Unsupported collection: ${collectionName}`);
        }
    } catch (error) {
        console.error("Error getting documents:", error);
        throw error;
    }
}