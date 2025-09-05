// examples/database-usage.ts
import { 
    type WhereCondition,
    type QueryOptions
} from '@/lib/database';

import { COLLECTIONS } from '@/lib/database/index';

import {
    uploadData,
    setDetails,
    setDetailsOfMany,
    deleteData,
    getOne,
    getAll,
    getAllWhereEquals,
    queryDocuments,
    countDocuments,
    updateDocument,
    deleteMany
} from '@/lib/database/crud';

// Example usage of the database CRUD operations


async function exampleUsage() {
    try {
        // 1. Create a new case
        console.log('Creating a new case...');
        const newCase = {
            id: 'case-001',
            title: 'State vs. John Doe',
            description: 'Criminal case for theft',
            type: 'criminal' as const,
            status: 'filed' as const,
            priority: 'medium' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'judge-001',
            plaintiffs: [
                {
                    id: 'plaintiff-001',
                    name: 'State of Zambia',
                    type: 'organization' as const,
                    contactInfo: {
                        email: 'prosecutor@state.zm',
                        phone: '+260-xxx-xxxx'
                    }
                }
            ],
            defendants: [
                {
                    id: 'defendant-001',
                    name: 'John Doe',
                    type: 'individual' as const,
                    contactInfo: {
                        email: 'john.doe@email.com',
                        phone: '+260-xxx-xxxx'
                    }
                }
            ],
            lawyers: [],
            hearings: [],
            documents: [],
            rulings: [],
            tags: ['theft', 'criminal'],
            statusHistory: [],
            timeline: []
        };

        const uploadSuccess = await uploadData(COLLECTIONS.CASES, newCase);
        console.log('Case created:', uploadSuccess);

        // 2. Update the case
        console.log('\nUpdating case...');
        const updateResult = await setDetails(
            { ...newCase, status: 'summons', updatedAt: new Date() },
            COLLECTIONS.CASES,
            'case-001'
        );
        console.log('Case updated:', updateResult);

        // 3. Get one case by ID
        console.log('\nGetting case by ID...');
        const retrievedCase = await getOne('case-001', COLLECTIONS.CASES);
        console.log('Retrieved case:', retrievedCase);

        // 4. Get all cases
        console.log('\nGetting all cases...');
        const allCases = await getAll(COLLECTIONS.CASES);
        console.log('All cases count:', allCases.length);

        // 5. Query cases with conditions
        console.log('\nQuerying cases with conditions...');
        const queryOptions: QueryOptions = {
            where: [
                { field: 'status', operator: '=', value: 'summons' },
                { field: 'type', operator: '=', value: 'criminal' }
            ],
            limit: 10,
            orderBy: { field: 'createdAt', direction: 'DESC' }
        };
        const queriedCases = await queryDocuments(COLLECTIONS.CASES, queryOptions);
        console.log('Queried cases:', queriedCases.length);

        // 6. Count documents
        console.log('\nCounting documents...');
        const caseCount = await countDocuments(COLLECTIONS.CASES);
        console.log('Total cases count:', caseCount);

        // 7. Get cases where status equals a specific value
        console.log('\nGetting cases by status...');
        const summonsCases = await getAllWhereEquals(COLLECTIONS.CASES, 'status', 'summons');
        console.log('Summons cases:', summonsCases.length);

        // 8. Update specific fields in a document
        console.log('\nUpdating specific fields...');
        const partialUpdate = await updateDocument(COLLECTIONS.CASES, 'case-001', {
            priority: 'high',
            updatedAt: new Date()
        });
        console.log('Partial update result:', partialUpdate);

        // 9. Create a user
        console.log('\nCreating a user...');
        const newUser = {
            id: 'user-001',
            email: 'judge@court.zm',
            displayName: 'Judge Smith',
            role: 'judge' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            profile: {
                firstName: 'John',
                lastName: 'Smith',
                courtType: 'high-court' as const,
                courtLocation: 'Lusaka'
            }
        };

        await uploadData(COLLECTIONS.USERS, newUser);
        console.log('User created');

        // 10. Create multiple documents using transaction
        console.log('\nCreating multiple hearings...');
        const hearings = [
            {
                id: 'hearing-001',
                caseId: 'case-001',
                date: new Date('2025-10-15'),
                startTime: '09:00',
                endTime: '11:00',
                location: 'Courtroom 1',
                judgeId: 'user-001',
                purpose: 'Initial hearing',
                status: 'scheduled' as const
            },
            {
                id: 'hearing-002',
                caseId: 'case-001',
                date: new Date('2025-10-25'),
                startTime: '14:00',
                endTime: '16:00',
                location: 'Courtroom 2',
                judgeId: 'user-001',
                purpose: 'Evidence presentation',
                status: 'scheduled' as const
            }
        ];

        const batchResult = await setDetailsOfMany(hearings, COLLECTIONS.HEARINGS);
        console.log('Batch hearings created:', batchResult);

        // 11. Create a document record
        console.log('\nCreating a document...');
        const newDocument = {
            id: 'doc-001',
            title: 'Case Evidence - Photo 1',
            description: 'Crime scene photograph',
            type: 'evidence' as const,
            status: 'submitted' as const,
            signatureStatus: 'unsigned' as const,
            fileName: 'evidence_001.jpg',
            fileSize: 1024000,
            mimeType: 'image/jpeg',
            caseId: 'case-001',
            uploadedBy: 'user-001',
            uploadedAt: new Date(),
            lastModified: new Date(),
            version: 1,
            tags: ['evidence', 'photograph'],
            isPublic: false,
            accessLevel: 'restricted' as const
        };

        await uploadData(COLLECTIONS.DOCUMENTS, newDocument);
        console.log('Document created');

        // 12. Advanced query with multiple conditions
        console.log('\nAdvanced query example...');
        const advancedQuery: QueryOptions = {
            where: [
                { field: 'caseId', operator: '=', value: 'case-001' },
                { field: 'status', operator: 'IN', value: ['scheduled', 'completed'] }
            ],
            orderBy: { field: 'date', direction: 'ASC' },
            limit: 5
        };

        const advancedResults = await queryDocuments(COLLECTIONS.HEARINGS, advancedQuery);
        console.log('Advanced query results:', advancedResults.length);

        // 13. Count with conditions
        console.log('\nCounting with conditions...');
        const activeHearingsCount = await countDocuments(COLLECTIONS.HEARINGS, [
            { field: 'status', operator: '=', value: 'scheduled' }
        ]);
        console.log('Active hearings count:', activeHearingsCount);

        // 14. Delete a document
        console.log('\nDeleting a document...');
        const deleteResult = await deleteData(COLLECTIONS.DOCUMENTS, 'doc-001');
        console.log('Document deleted:', deleteResult);

        // 15. Delete multiple documents with conditions
        console.log('\nDeleting multiple hearings...');
        const deleteManyResult = await deleteMany(COLLECTIONS.HEARINGS, [
            { field: 'status', operator: '=', value: 'scheduled' }
        ]);
        console.log('Bulk delete result:', deleteManyResult);

        console.log('\n✅ All database operations completed successfully!');

    } catch (error) {
        console.error('❌ Error during database operations:', error);
    }
}

// Example of working with complex legal entities
async function legalEntitiesExample() {
    try {
        console.log('\n📚 Legal Entities Example...');

        // Create a law firm
        const lawFirm = {
            id: 'firm-001',
            name: 'Smith & Associates Legal Services',
            lawyers: ['lawyer-001', 'lawyer-002'],
            administrators: ['admin-001'],
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            description: 'Full-service law firm specializing in criminal and civil law',
            website: 'https://smithassociates.zm',
            address: '123 Independence Avenue, Lusaka',
            phoneNumber: '+260-211-123456'
        };

        await uploadData(COLLECTIONS.LAW_FIRMS, lawFirm);
        console.log('Law firm created');

        // Create lawyers
        const lawyers = [
            {
                id: 'lawyer-001',
                email: 'sarah.smith@smithassociates.zm',
                displayName: 'Sarah Smith',
                role: 'lawyer' as const,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                profile: {
                    firstName: 'Sarah',
                    lastName: 'Smith',
                    lawFirmName: 'Smith & Associates Legal Services',
                    lawFirmId: 'firm-001',
                    barNumber: 'BAR-001-2020',
                    specializations: ['Criminal Law', 'Civil Law'],
                    phoneNumber: '+260-977-123456'
                }
            },
            {
                id: 'lawyer-002',
                email: 'james.wilson@smithassociates.zm',
                displayName: 'James Wilson',
                role: 'lawyer' as const,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                profile: {
                    firstName: 'James',
                    lastName: 'Wilson',
                    lawFirmName: 'Smith & Associates Legal Services',
                    lawFirmId: 'firm-001',
                    barNumber: 'BAR-002-2019',
                    specializations: ['Commercial Law', 'Family Law'],
                    phoneNumber: '+260-977-654321'
                }
            }
        ];

        await setDetailsOfMany(lawyers, COLLECTIONS.USERS);
        console.log('Lawyers created');

        // Query lawyers by specialization
        const criminalLawyers = await queryDocuments(COLLECTIONS.USERS, {
            where: [
                { field: 'role', operator: '=', value: 'lawyer' },
                { field: 'profile.specializations', operator: 'LIKE', value: '%Criminal Law%' }
            ]
        });
        console.log('Criminal lawyers found:', criminalLawyers.length);

        // Create audit log
        const auditLog = {
            id: 'audit-001',
            actorId: 'lawyer-001',
            action: 'CASE_CREATE' as const,
            entityType: 'case' as const,
            entityId: 'case-001',
            timestamp: new Date(),
            details: {
                caseTitle: 'State vs. John Doe',
                changes: { status: 'filed' }
            },
            ip: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };

        await uploadData(COLLECTIONS.AUDIT_LOGS, auditLog);
        console.log('Audit log created');

        console.log('✅ Legal entities example completed!');

    } catch (error) {
        console.error('❌ Error in legal entities example:', error);
    }
}

// Example of search and filtering functionality
async function searchAndFilterExample() {
    try {
        console.log('\n🔍 Search and Filter Example...');

        // Search cases by title (using LIKE operator)
        const searchResults = await queryDocuments(COLLECTIONS.CASES, {
            where: [
                { field: 'title', operator: 'LIKE', value: '%State%' }
            ],
            orderBy: { field: 'createdAt', direction: 'DESC' }
        });
        console.log('Search results for "State":', searchResults.length);

        // Filter cases by multiple criteria
        const filteredCases = await queryDocuments(COLLECTIONS.CASES, {
            where: [
                { field: 'type', operator: '=', value: 'criminal' },
                { field: 'status', operator: 'IN', value: ['filed', 'summons', 'active'] },
                { field: 'priority', operator: '!=', value: 'low' }
            ],
            limit: 10,
            offset: 0
        });
        console.log('Filtered cases:', filteredCases.length);

        // Get cases created in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentCases = await queryDocuments(COLLECTIONS.CASES, {
            where: [
                { field: 'createdAt', operator: '>=', value: thirtyDaysAgo.toISOString() }
            ],
            orderBy: { field: 'createdAt', direction: 'DESC' }
        });
        console.log('Recent cases (last 30 days):', recentCases.length);

        console.log('✅ Search and filter example completed!');

    } catch (error) {
        console.error('❌ Error in search and filter example:', error);
    }
}

// Run all examples
async function runAllExamples() {
    console.log('🚀 Starting Database CRUD Operations Examples\n');

    await exampleUsage();
    await legalEntitiesExample();
    await searchAndFilterExample();

    console.log('\n🎉 All examples completed successfully!');
}

// Export the example functions for use in other files
export {
    exampleUsage,
    legalEntitiesExample,
    searchAndFilterExample,
    runAllExamples
};

// Uncomment the line below to run examples when this file is executed directly
// runAllExamples().catch(console.error);