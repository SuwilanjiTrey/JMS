// src/models/Document.ts

export type DocumentType = 'motion' | 'brief' | 'evidence' | 'order' | 'judgment' | 'pleading' | 'exhibit' | 'other';
export type DocumentStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'sealed';
export type SignatureStatus = 'unsigned' | 'pending_signature' | 'digitally_signed' | 'sealed';
export type AccessLevel = 'public' | 'restricted' | 'confidential';
export type SealType = 'court' | 'judicial' | 'administrative';

export interface DigitalSignature {
    signedBy: string;
    signedAt: Date;
    signatureHash: string;
}

export interface DocumentSeal {
    sealedBy: string;
    sealedAt: Date;
    sealType: SealType;
}

export interface DocumentMetadata {
    id: string;
    title: string;
    description: string;
    type: DocumentType;
    status: DocumentStatus;
    signatureStatus: SignatureStatus;
    fileName: string;
    fileSize: number;
    mimeType: string;
    filePath?: string; // Local storage path
    caseId?: string;
    caseNumber?: string;
    uploadedBy: string;
    uploadedAt: Date;
    lastModified: Date;
    version: number;
    tags: string[];
    isPublic: boolean;
    accessLevel: AccessLevel;
    digitalSignature?: DigitalSignature;
    seal?: DocumentSeal;
    checksum?: string; // For file integrity verification
    parentDocumentId?: string; // For document versioning
    reviewers?: string[]; // User IDs who can review this document
    downloadCount?: number;
    lastAccessedAt?: Date;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    motion: 'Motion',
    brief: 'Brief',
    evidence: 'Evidence',
    order: 'Court Order',
    judgment: 'Judgment',
    pleading: 'Pleading',
    exhibit: 'Exhibit',
    other: 'Other'
};

export const STATUS_COLORS: Record<DocumentStatus, string> = {
    draft: 'bg-gray-100 text-gray-800 border-gray-200',
    submitted: 'bg-blue-100 text-blue-800 border-blue-200',
    under_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    sealed: 'bg-purple-100 text-purple-800 border-purple-200'
};

export const SIGNATURE_COLORS: Record<SignatureStatus, string> = {
    unsigned: 'bg-gray-100 text-gray-800',
    pending_signature: 'bg-orange-100 text-orange-800',
    digitally_signed: 'bg-green-100 text-green-800',
    sealed: 'bg-purple-100 text-purple-800'
};