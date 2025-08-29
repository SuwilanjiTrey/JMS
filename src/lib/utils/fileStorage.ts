// src/lib/utils/fileStorage.ts

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Base directory for storing uploaded files
const UPLOAD_BASE_DIR = path.join(process.cwd(), 'uploads');

// Subdirectories for different document types
const DOCUMENT_DIRECTORIES = {
    motion: 'motions',
    brief: 'briefs',
    evidence: 'evidence',
    order: 'orders',
    judgment: 'judgments',
    pleading: 'pleadings',
    exhibit: 'exhibits',
    other: 'other'
};

export interface FileUploadResult {
    success: boolean;
    filePath?: string;
    fileName?: string;
    fileSize?: number;
    checksum?: string;
    error?: string;
}

/**
 * Ensure upload directories exist
 */
export async function ensureUploadDirectories(): Promise<void> {
    try {
        // Create base upload directory
        await fs.mkdir(UPLOAD_BASE_DIR, { recursive: true });

        // Create subdirectories for each document type
        for (const dir of Object.values(DOCUMENT_DIRECTORIES)) {
            await fs.mkdir(path.join(UPLOAD_BASE_DIR, dir), { recursive: true });
        }
    } catch (error) {
        console.error('Error creating upload directories:', error);
        throw error;
    }
}

/**
 * Generate a unique filename to prevent conflicts
 */
export function generateUniqueFileName(originalFileName: string, documentType: string): string {
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalFileName);
    const baseName = path.basename(originalFileName, extension);

    return `${documentType}_${timestamp}_${randomSuffix}_${baseName}${extension}`;
}

/**
 * Calculate file checksum for integrity verification
 */
export async function calculateFileChecksum(filePath: string): Promise<string> {
    try {
        const fileBuffer = await fs.readFile(filePath);
        return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error) {
        console.error('Error calculating checksum:', error);
        throw error;
    }
}

/**
 * Save uploaded file to local storage
 */
export async function saveUploadedFile(
    fileBuffer: Buffer,
    originalFileName: string,
    documentType: string,
    caseId?: string
): Promise<FileUploadResult> {
    try {
        // Ensure directories exist
        await ensureUploadDirectories();

        // Generate unique filename
        const uniqueFileName = generateUniqueFileName(originalFileName, documentType);

        // Determine storage path (organize by case if provided)
        let storagePath: string;
        if (caseId) {
            const caseDir = path.join(UPLOAD_BASE_DIR, 'cases', caseId);
            await fs.mkdir(caseDir, { recursive: true });
            storagePath = path.join(caseDir, uniqueFileName);
        } else {
            const typeDir = DOCUMENT_DIRECTORIES[documentType as keyof typeof DOCUMENT_DIRECTORIES] || 'other';
            storagePath = path.join(UPLOAD_BASE_DIR, typeDir, uniqueFileName);
        }

        // Save file
        await fs.writeFile(storagePath, fileBuffer);

        // Calculate checksum
        const checksum = await calculateFileChecksum(storagePath);

        return {
            success: true,
            filePath: storagePath,
            fileName: uniqueFileName,
            fileSize: fileBuffer.length,
            checksum
        };
    } catch (error) {
        console.error('Error saving file:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Delete a file from local storage
 */
export async function deleteFile(filePath: string): Promise<boolean> {
    try {
        await fs.unlink(filePath);
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}

/**
 * Read file from local storage
 */
export async function readFile(filePath: string): Promise<Buffer | null> {
    try {
        return await fs.readFile(filePath);
    } catch (error) {
        console.error('Error reading file:', error);
        return null;
    }
}

/**
 * Verify file integrity using checksum
 */
export async function verifyFileIntegrity(filePath: string, expectedChecksum: string): Promise<boolean> {
    try {
        const actualChecksum = await calculateFileChecksum(filePath);
        return actualChecksum === expectedChecksum;
    } catch (error) {
        console.error('Error verifying file integrity:', error);
        return false;
    }
}

/**
 * Get file statistics
 */
export async function getFileStats(filePath: string) {
    try {
        const stats = await fs.stat(filePath);
        return {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            accessed: stats.atime
        };
    } catch (error) {
        console.error('Error getting file stats:', error);
        return null;
    }
}