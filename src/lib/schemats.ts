import { z } from 'zod';


export const HearingCreateSchema = z.object({
    caseId: z.string(),
    date: z.string().datetime(),
    startTime: z.string(),
    endTime: z.string(),
    location: z.string(),
    judgeId: z.string(),
    purpose: z.string(),
});


export const HearingUpdateSchema = z.object({
    date: z.string().datetime().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    location: z.string().optional(),
    purpose: z.string().optional(),
    status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled', 'postponed']).optional(),
    notes: z.string().optional(),
    outcome: z.string().optional(),
});


export const DocumentCreateSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    type: z.enum(['motion', 'brief', 'evidence', 'order', 'judgment', 'pleading', 'exhibit', 'other']),
    caseId: z.string().optional(),
    caseNumber: z.string().optional(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    category: z.enum(['pleading', 'evidence', 'motion', 'order', 'correspondence', 'other']).default('other'),
    isPublic: z.boolean().default(false),
    accessLevel: z.enum(['public', 'restricted', 'confidential']).default('restricted'),
    tags: z.array(z.string()).optional(),
    parentDocumentId: z.string().optional(), // versioning
});


export const DocumentSignSchema = z.object({
    signedBy: z.string(), // judge/staff id
    signatureHash: z.string(),
});


export const DocumentSealSchema = z.object({
    sealedBy: z.string(),
    sealType: z.enum(['court', 'judicial', 'administrative']),
});


export const ReportQuerySchema = z.object({
    from: z.string().date().optional(),
    to: z.string().date().optional(),
});