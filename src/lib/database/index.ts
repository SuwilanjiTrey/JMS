// lib/database/index.ts

// Export database connection and types
export {
    sqlite_db,
    createTableIfNotExists,
    closeDatabase,
    type WhereCondition,
    type QueryOptions,
    type DatabaseResult
} from '../database';

// Export all CRUD operations
export {
    uploadData,
    setDetails,
    deleteData,
    fetchData,
    setDetailsOfMany,
    getOne,
    getLimitedMany,
    getAll,
    getAllWhereEquals,
    queryDocuments,
    countDocuments,
    updateDocument,
    deleteMany
} from './crud';

// Export helper functions
export {
    removeUndefinedFields,
    parseJsonFields,
    buildWhereClause,
    validateCollectionName,
    sanitizeCollectionName
} from './helpers';

// Re-export collections for convenience
export { COLLECTIONS } from '@/lib/constants/firebase/collections'