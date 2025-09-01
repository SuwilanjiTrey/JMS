//documents components to be used by an admin component via import
//main module : AdminDocuments, component module to be called via import : @/components/exports/documents.tsx

'use client';

import DocumentManager, { 
    DocumentMetadata, 
    DocumentType, 
    DocumentStatus, 
    SignatureStatus 
} from '@/components/exports/documents';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';

interface AdminDocumentsProps {
    className?: string;
}

export default function AdminDocuments({ className = "" }: AdminDocumentsProps) {
    return (
        <DocumentManager
            collections={{
                documents: COLLECTIONS.DOCUMENTS || 'documents',
                cases: COLLECTIONS.CASES || 'cases'
            }}
            className={className}
        />
    );
}

