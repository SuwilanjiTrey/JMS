'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
    Upload,
    Search,
    Eye,
    Download,
    FileText,
    Image,
    File,
    Trash2,
    Clock,
    User,
    Tag,
    AlertCircle,
    CheckCircle,
    Loader2,
    Plus,
    Filter,
    Calendar,
    Signature,
    Shield,
    RefreshCw,
    MoreVertical
} from 'lucide-react';
import {
    uploadData,
    getAll,
    setDetails,
    deleteData,
    getAllWhereEquals
} from '@/lib/utils/firebase/general';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';

// Document types
export type DocumentType = 'motion' | 'brief' | 'evidence' | 'order' | 'judgment' | 'pleading' | 'exhibit' | 'other';
export type DocumentStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'sealed';
export type SignatureStatus = 'unsigned' | 'pending_signature' | 'digitally_signed' | 'sealed';

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
    caseId?: string;
    caseNumber?: string;
    uploadedBy: string;
    uploadedAt: Date;
    lastModified: Date;
    version: number;
    tags: string[];
    isPublic: boolean;
    accessLevel: 'public' | 'restricted' | 'confidential';
    digitalSignature?: {
        signedBy: string;
        signedAt: Date;
        signatureHash: string;
    };
    seal?: {
        sealedBy: string;
        sealedAt: Date;
        sealType: 'court' | 'judicial' | 'administrative';
    };
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

// Document Card Component
interface DocumentCardProps {
    document: DocumentMetadata;
    onView: (document: DocumentMetadata) => void;
    onDownload: (document: DocumentMetadata) => void;
    onSign: (documentId: string) => void;
    onSeal: (documentId: string, sealType: 'court' | 'judicial' | 'administrative') => void;
    onUpdateStatus: (documentId: string, status: DocumentStatus) => void;
    onDelete: (documentId: string) => void;
}

function DocumentCard({ 
    document, 
    onView, 
    onDownload, 
    onSign, 
    onSeal, 
    onUpdateStatus, 
    onDelete 
}: DocumentCardProps) {
    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
        if (mimeType.includes('pdf')) return <FileText className="w-4 h-4" />;
        return <File className="w-4 h-4" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Card key={document.id} className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        {getFileIcon(document.mimeType)}
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-semibold text-gray-900 line-clamp-1">
                                {document.title}
                            </CardTitle>
                            <CardDescription className="text-sm mt-1 line-clamp-1">
                                {document.fileName}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Badge className={`text-xs ${STATUS_COLORS[document.status]}`}>
                            {document.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={`text-xs ${SIGNATURE_COLORS[document.signatureStatus]}`}>
                            {document.signatureStatus.replace('_', ' ')}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3 text-gray-400" />
                        <span className="font-medium">{DOCUMENT_TYPE_LABELS[document.type]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <File className="w-3 h-3 text-gray-400" />
                        <span className="font-medium">{formatFileSize(document.fileSize)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="font-medium">{document.uploadedAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Shield className="w-3 h-3 text-gray-400" />
                        <span className="font-medium capitalize">{document.accessLevel}</span>
                    </div>
                </div>
                {document.caseNumber && (
                    <div className="bg-blue-50 p-2 rounded text-sm">
                        <span className="text-blue-700 font-medium">Case: {document.caseNumber}</span>
                    </div>
                )}
                {document.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {document.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                        {document.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{document.tags.length - 3} more
                            </Badge>
                        )}
                    </div>
                )}
                <Separator />
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onView(document)}
                        className="flex-1"
                    >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownload(document)}
                        className="flex-1"
                    >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                    </Button>
                </div>
                {/* Quick Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                    {document.signatureStatus === 'unsigned' && (
                        <Button
                            size="sm"
                            onClick={() => onSign(document.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Signature className="w-3 h-3 mr-1" />
                            Sign
                        </Button>
                    )}
                    {document.status === 'approved' && document.signatureStatus !== 'sealed' && (
                        <Select onValueChange={(sealType: 'court' | 'judicial' | 'administrative') => onSeal(document.id, sealType)}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Seal Document" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="court">Court Seal</SelectItem>
                                <SelectItem value="judicial">Judicial Seal</SelectItem>
                                <SelectItem value="administrative">Administrative Seal</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                    <Select onValueChange={(status: DocumentStatus) => onUpdateStatus(document.id, status)}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(document.id)}
                    className="w-full"
                >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete Document
                </Button>
            </CardContent>
        </Card>
    );
}

// Document Filters Component
interface DocumentFiltersProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    typeFilter: string;
    setTypeFilter: (filter: string) => void;
    statusFilter: string;
    setStatusFilter: (filter: string) => void;
    accessFilter: string;
    setAccessFilter: (filter: string) => void;
    onRefresh: () => void;
    loading: boolean;
    onUpload: () => void;
}

function DocumentFilters({
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    accessFilter,
    setAccessFilter,
    onRefresh,
    loading,
    onUpload
}: DocumentFiltersProps) {
    return (
        <Card className="p-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 flex-1">
                    <Search className="w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-0 shadow-none focus-visible:ring-0"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="sealed">Sealed</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={accessFilter} onValueChange={setAccessFilter}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Access" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Access</SelectItem>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="restricted">Restricted</SelectItem>
                            <SelectItem value="confidential">Confidential</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={onRefresh}
                        disabled={loading}
                        className="w-full sm:w-auto"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={onUpload}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Documents
                    </Button>
                </div>
            </div>
        </Card>
    );
}

// Document Upload Dialog Component
interface DocumentUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cases: any[];
    uploadForm: {
        title: string;
        description: string;
        type: DocumentType;
        caseId: string;
        tags: string;
        isPublic: boolean;
        accessLevel: 'public' | 'restricted' | 'confidential';
        files: FileList | null;
    };
    setUploadForm: (form: any) => void;
    uploading: boolean;
    onSubmit: () => void;
    onCancel: () => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
}

function DocumentUploadDialog({
    open,
    onOpenChange,
    cases,
    uploadForm,
    setUploadForm,
    uploading,
    onSubmit,
    onCancel,
    fileInputRef
}: DocumentUploadDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upload Documents</DialogTitle>
                    <DialogDescription>
                        Upload new documents to the system. Multiple files can be uploaded at once.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="files">Select Files *</Label>
                        <Input
                            id="files"
                            type="file"
                            ref={fileInputRef}
                            multiple
                            onChange={(e) => setUploadForm(prev => ({ ...prev, files: e.target.files }))}
                            className="cursor-pointer"
                        />
                        <p className="text-sm text-gray-500">
                            Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, etc.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Document Title *</Label>
                            <Input
                                id="title"
                                value={uploadForm.title}
                                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter document title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Document Type</Label>
                            <Select
                                value={uploadForm.type}
                                onValueChange={(value: DocumentType) => setUploadForm(prev => ({ ...prev, type: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={uploadForm.description}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter document description"
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="caseId">Related Case (Optional)</Label>
                            <Select
                                value={uploadForm.caseId}
                                onValueChange={(value) => setUploadForm(prev => ({ ...prev, caseId: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a case" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="None">No case selected</SelectItem>
                                    {cases.map((caseItem) => (
                                        <SelectItem key={caseItem.id} value={caseItem.id}>
                                            {caseItem.caseNumber} - {caseItem.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="accessLevel">Access Level</Label>
                            <Select
                                value={uploadForm.accessLevel}
                                onValueChange={(value: 'public' | 'restricted' | 'confidential') => setUploadForm(prev => ({ ...prev, accessLevel: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">Public</SelectItem>
                                    <SelectItem value="restricted">Restricted</SelectItem>
                                    <SelectItem value="confidential">Confidential</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                            id="tags"
                            value={uploadForm.tags}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="e.g., urgent, motion, evidence"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="isPublic"
                            checked={uploadForm.isPublic}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="isPublic" className="text-sm">
                            Make this document publicly accessible
                        </Label>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onSubmit}
                            disabled={uploading || !uploadForm.files || uploadForm.files.length === 0}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Documents
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Document Details Dialog Component
interface DocumentDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    document: DocumentMetadata | null;
    onDownload: (document: DocumentMetadata) => void;
    onSign: (documentId: string) => void;
    onSeal: (documentId: string, sealType: 'court' | 'judicial' | 'administrative') => void;
    onUpdateStatus: (documentId: string, status: DocumentStatus) => void;
    onDelete: (documentId: string) => void;
}

function DocumentDetailsDialog({
    open,
    onOpenChange,
    document,
    onDownload,
    onSign,
    onSeal,
    onUpdateStatus,
    onDelete
}: DocumentDetailsDialogProps) {
    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <Image className="w-5 h-5" />;
        if (mimeType.includes('pdf')) return <FileText className="w-5 h-5" />;
        return <File className="w-5 h-5" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!document) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-3">
                                {getFileIcon(document.mimeType)}
                                {document.title}
                            </DialogTitle>
                            <DialogDescription className="text-base mt-1">
                                {document.fileName} • {formatFileSize(document.fileSize)}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <Badge className={STATUS_COLORS[document.status]}>
                                {document.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={SIGNATURE_COLORS[document.signatureStatus]}>
                                {document.signatureStatus.replace('_', ' ')}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>
                <div className="space-y-6">
                    {/* Document Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-4">
                            <h4 className="font-semibold mb-3 text-blue-700 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Document Info
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Type:</span>
                                    <span className="font-medium">{DOCUMENT_TYPE_LABELS[document.type]}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Version:</span>
                                    <span className="font-medium">v{document.version}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Access:</span>
                                    <span className="font-medium capitalize">{document.accessLevel}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Public:</span>
                                    <span className="font-medium">{document.isPublic ? 'Yes' : 'No'}</span>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <h4 className="font-semibold mb-3 text-green-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Timeline
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Uploaded:</span>
                                    <span className="font-medium">
                                        {document.uploadedAt.toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Modified:</span>
                                    <span className="font-medium">
                                        {document.lastModified.toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">By:</span>
                                    <span className="font-medium">{document.uploadedBy}</span>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <h4 className="font-semibold mb-3 text-purple-700 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Security
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span className="font-medium capitalize">{document.status.replace('_', ' ')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Signature:</span>
                                    <span className="font-medium capitalize">{document.signatureStatus.replace('_', ' ')}</span>
                                </div>
                                {document.digitalSignature && (
                                    <div className="bg-green-50 p-2 rounded mt-2">
                                        <p className="text-xs text-green-800">
                                            Signed by {document.digitalSignature.signedBy} on{' '}
                                            {document.digitalSignature.signedAt.toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                                {document.seal && (
                                    <div className="bg-purple-50 p-2 rounded mt-2">
                                        <p className="text-xs text-purple-800">
                                            {document.seal.sealType} seal applied by {document.seal.sealedBy} on{' '}
                                            {document.seal.sealedAt.toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                    {/* Description */}
                    {document.description && (
                        <Card className="p-4">
                            <h4 className="font-semibold mb-3 text-gray-800">Description</h4>
                            <p className="text-gray-700 leading-relaxed">{document.description}</p>
                        </Card>
                    )}
                    {/* Case Information */}
                    {document.caseId && (
                        <Card className="p-4">
                            <h4 className="font-semibold mb-3 text-blue-700">Related Case</h4>
                            <div className="bg-blue-50 p-3 rounded">
                                <p className="font-medium text-blue-900">{document.caseNumber}</p>
                                <p className="text-sm text-blue-700">Case ID: {document.caseId}</p>
                            </div>
                        </Card>
                    )}
                    {/* Tags */}
                    {document.tags.length > 0 && (
                        <Card className="p-4">
                            <h4 className="font-semibold mb-3 text-gray-800">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                                {document.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="bg-gray-100">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </Card>
                    )}
                    {/* Actions */}
                    <Card className="p-4">
                        <h4 className="font-semibold mb-3 text-gray-800">Actions</h4>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={() => onDownload(document)}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                            {document.signatureStatus === 'unsigned' && (
                                <Button
                                    onClick={() => onSign(document.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <Signature className="w-4 h-4 mr-2" />
                                    Digital Sign
                                </Button>
                            )}
                            {document.status === 'approved' && document.signatureStatus !== 'sealed' && (
                                <Select onValueChange={(sealType: 'court' | 'judicial' | 'administrative') => onSeal(document.id, sealType)}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Apply Seal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="court">Court Seal</SelectItem>
                                        <SelectItem value="judicial">Judicial Seal</SelectItem>
                                        <SelectItem value="administrative">Administrative Seal</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                            <Select onValueChange={(status: DocumentStatus) => onUpdateStatus(document.id, status)}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Change Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Set to Draft</SelectItem>
                                    <SelectItem value="submitted">Set to Submitted</SelectItem>
                                    <SelectItem value="under_review">Set to Under Review</SelectItem>
                                    <SelectItem value="approved">Set to Approved</SelectItem>
                                    <SelectItem value="rejected">Set to Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={() => onDelete(document.id)}
                                variant="destructive"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Document
                            </Button>
                        </div>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Main Document Manager Component
interface DocumentManagerProps {
    collections?: {
        documents: string;
        cases: string;
    };
    initialDocuments?: DocumentMetadata[];
    allowedDocumentTypes?: DocumentType[];
    hideActions?: boolean;
    className?: string;
}

export default function DocumentManager({
    collections = { documents: COLLECTIONS.DOCUMENTS || 'documents', cases: COLLECTIONS.CASES || 'cases' },
    initialDocuments,
    allowedDocumentTypes,
    hideActions = false,
    className = ""
}: DocumentManagerProps) {
    const [documents, setDocuments] = useState<DocumentMetadata[]>(initialDocuments || []);
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(!initialDocuments);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [accessFilter, setAccessFilter] = useState('all');
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [showDocumentDialog, setShowDocumentDialog] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Upload form state
    const [uploadForm, setUploadForm] = useState({
        title: '',
        description: '',
        type: 'other' as DocumentType,
        caseId: '',
        tags: '',
        isPublic: false,
        accessLevel: 'restricted' as 'public' | 'restricted' | 'confidential',
        files: null as FileList | null
    });

    useEffect(() => {
        if (!initialDocuments) {
            loadDocuments();
        }
        loadCases();
    }, [initialDocuments]);

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const documentsData = await getAll(collections.documents);
            const processedDocuments = documentsData.map((doc: any) => ({
                ...doc,
                uploadedAt: doc.uploadedAt?.toDate ? doc.uploadedAt.toDate() : new Date(doc.uploadedAt),
                lastModified: doc.lastModified?.toDate ? doc.lastModified.toDate() : new Date(doc.lastModified),
                digitalSignature: doc.digitalSignature ? {
                    ...doc.digitalSignature,
                    signedAt: doc.digitalSignature.signedAt?.toDate ? doc.digitalSignature.signedAt.toDate() : new Date(doc.digitalSignature.signedAt)
                } : undefined,
                seal: doc.seal ? {
                    ...doc.seal,
                    sealedAt: doc.seal.sealedAt?.toDate ? doc.seal.sealedAt.toDate() : new Date(doc.seal.sealedAt)
                } : undefined
            }));
            setDocuments(processedDocuments as DocumentMetadata[]);
        } catch (error) {
            console.error('Error loading documents:', error);
            setError('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const loadCases = async () => {
        try {
            const casesData = await getAll(collections.cases);
            setCases(casesData);
        } catch (error) {
            console.error('Error loading cases:', error);
        }
    };

    const handleFileUpload = async () => {
        if (!uploadForm.files || uploadForm.files.length === 0) {
            setError('Please select at least one file to upload');
            return;
        }
        if (!uploadForm.title.trim()) {
            setError('Please enter a document title');
            return;
        }
        setUploading(true);
        setError(null);
        try {
            const uploadPromises = Array.from(uploadForm.files).map(async (file) => {
                // Create document metadata
                const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const metadata: DocumentMetadata = {
                    id: documentId,
                    title: uploadForm.files!.length > 1 ? `${uploadForm.title} - ${file.name}` : uploadForm.title,
                    description: uploadForm.description,
                    type: uploadForm.type,
                    status: 'draft',
                    signatureStatus: 'unsigned',
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type,
                    caseId: uploadForm.caseId || undefined,
                    caseNumber: uploadForm.caseId ? cases.find(c => c.id === uploadForm.caseId)?.caseNumber : undefined,
                    uploadedBy: 'current_user_id', // Replace with actual user ID
                    uploadedAt: new Date(),
                    lastModified: new Date(),
                    version: 1,
                    tags: uploadForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                    isPublic: uploadForm.isPublic,
                    accessLevel: uploadForm.accessLevel
                };
                // In a real implementation, you would upload the file to your local storage here
                // For now, we'll just save the metadata to Firebase
                console.log(`Would upload file: ${file.name} (${file.size} bytes)`);
                const success = await uploadData(collections.documents, metadata);
                if (success) {
                    return metadata;
                } else {
                    throw new Error(`Failed to upload ${file.name}`);
                }
            });
            const uploadedDocs = await Promise.all(uploadPromises);
            setDocuments(prev => [...prev, ...uploadedDocs]);
            setSuccess(`Successfully uploaded ${uploadedDocs.length} document(s)`);
            setShowUploadDialog(false);
            resetUploadForm();
        } catch (error) {
            console.error('Error uploading documents:', error);
            setError('Failed to upload documents');
        } finally {
            setUploading(false);
        }
    };

    const resetUploadForm = () => {
        setUploadForm({
            title: '',
            description: '',
            type: 'other',
            caseId: '',
            tags: '',
            isPublic: false,
            accessLevel: 'restricted',
            files: null
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const updateDocumentStatus = async (documentId: string, newStatus: DocumentStatus) => {
        try {
            const document = documents.find(d => d.id === documentId);
            if (!document) return;
            const updatedDocument = {
                ...document,
                status: newStatus,
                lastModified: new Date()
            };
            const result = await setDetails(updatedDocument, collections.documents, documentId);
            if (result.success) {
                setDocuments(prev => prev.map(d => d.id === documentId ? updatedDocument : d));
                setSuccess(`Document status updated to ${newStatus}`);
            } else {
                setError('Failed to update document status');
            }
        } catch (error) {
            console.error('Error updating document status:', error);
            setError('Error updating document status');
        }
    };

    const signDocument = async (documentId: string) => {
        try {
            const document = documents.find(d => d.id === documentId);
            if (!document) return;
            const updatedDocument = {
                ...document,
                signatureStatus: 'digitally_signed' as SignatureStatus,
                digitalSignature: {
                    signedBy: 'current_user_id', // Replace with actual user ID
                    signedAt: new Date(),
                    signatureHash: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                },
                lastModified: new Date()
            };
            const result = await setDetails(updatedDocument, collections.documents, documentId);
            if (result.success) {
                setDocuments(prev => prev.map(d => d.id === documentId ? updatedDocument : d));
                setSuccess('Document digitally signed');
            } else {
                setError('Failed to sign document');
            }
        } catch (error) {
            console.error('Error signing document:', error);
            setError('Error signing document');
        }
    };

    const sealDocument = async (documentId: string, sealType: 'court' | 'judicial' | 'administrative') => {
        try {
            const document = documents.find(d => d.id === documentId);
            if (!document) return;
            const updatedDocument = {
                ...document,
                signatureStatus: 'sealed' as SignatureStatus,
                seal: {
                    sealedBy: 'current_user_id', // Replace with actual user ID
                    sealedAt: new Date(),
                    sealType
                },
                lastModified: new Date()
            };
            const result = await setDetails(updatedDocument, collections.documents, documentId);
            if (result.success) {
                setDocuments(prev => prev.map(d => d.id === documentId ? updatedDocument : d));
                setSuccess(`Document sealed with ${sealType} seal`);
            } else {
                setError('Failed to seal document');
            }
        } catch (error) {
            console.error('Error sealing document:', error);
            setError('Error sealing document');
        }
    };

    const deleteDocument = async (documentId: string) => {
        if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            return;
        }
        try {
            const result = await deleteData(collections.documents, documentId);
            if (result.success) {
                setDocuments(prev => prev.filter(d => d.id !== documentId));
                setSuccess('Document deleted successfully');
            } else {
                setError('Failed to delete document');
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            setError('Error deleting document');
        }
    };

    const handleViewDocument = (document: DocumentMetadata) => {
        setSelectedDocument(document);
        setShowDocumentDialog(true);
    };

    const handleDownloadDocument = (document: DocumentMetadata) => {
        alert('Download functionality would be implemented here');
    };

    // Filter documents
    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || doc.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
        const matchesAccess = accessFilter === 'all' || doc.accessLevel === accessFilter;
        return matchesSearch && matchesType && matchesStatus && matchesAccess;
    });

    return (
        <div className={`container mx-auto p-4 sm:p-6 space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Document Management</h1>
                    <p className="text-gray-600">
                        {loading ? 'Loading documents...' : `Manage all court documents (${filteredDocuments.length} documents)`}
                    </p>
                </div>
            </div>
            
            {/* Messages */}
            {success && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
            )}
            
            {/* Filters */}
            <DocumentFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                accessFilter={accessFilter}
                setAccessFilter={setAccessFilter}
                onRefresh={loadDocuments}
                loading={loading}
                onUpload={() => setShowUploadDialog(true)}
            />
            
            {/* Documents Grid */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-lg">Loading documents...</span>
                </div>
            ) : filteredDocuments.length === 0 ? (
                <Card className="p-8 sm:p-12 text-center">
                    <div className="max-w-md mx-auto space-y-4">
                        <FileText className="w-16 h-16 mx-auto text-gray-400" />
                        <h3 className="text-xl font-semibold text-gray-900">No Documents Found</h3>
                        <p className="text-gray-600">
                            {documents.length === 0
                                ? "No documents have been uploaded yet. Click 'Upload Documents' to get started."
                                : "No documents match your current filters. Try adjusting your search criteria."
                            }
                        </p>
                        <Button
                            onClick={() => setShowUploadDialog(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Documents
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDocuments.map((document) => (
                        <DocumentCard
                            key={document.id}
                            document={document}
                            onView={handleViewDocument}
                            onDownload={handleDownloadDocument}
                            onSign={signDocument}
                            onSeal={sealDocument}
                            onUpdateStatus={updateDocumentStatus}
                            onDelete={deleteDocument}
                        />
                    ))}
                </div>
            )}
            
            {/* Upload Dialog */}
            <DocumentUploadDialog
                open={showUploadDialog}
                onOpenChange={setShowUploadDialog}
                cases={cases}
                uploadForm={uploadForm}
                setUploadForm={setUploadForm}
                uploading={uploading}
                onSubmit={handleFileUpload}
                onCancel={() => {
                    setShowUploadDialog(false);
                    resetUploadForm();
                }}
                fileInputRef={fileInputRef}
            />
            
            {/* Document Details Dialog */}
            <DocumentDetailsDialog
                open={showDocumentDialog}
                onOpenChange={setShowDocumentDialog}
                document={selectedDocument}
                onDownload={handleDownloadDocument}
                onSign={signDocument}
                onSeal={sealDocument}
                onUpdateStatus={updateDocumentStatus}
                onDelete={deleteDocument}
            />
        </div>
    );
}


export type {
    DocumentMetadata,
    DocumentType,
    DocumentStatus,
    SignatureStatus
};
