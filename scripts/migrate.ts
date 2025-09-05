// scripts/migrate.ts
import { sqlite_db, createTableIfNotExists } from '@/lib/database';
import { COLLECTIONS } from '@/lib/database/index';
import path from 'path';
import fs from 'fs';

/**
 * Database migration script to initialize all tables
 */
async function runMigrations() {
    console.log('🚀 Starting database migrations...');

    try {
        // Create database directory if it doesn't exist
        const dbDir = path.dirname(path.join(process.cwd(), 'database.sqlite'));
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Create all tables from collections
        console.log('\n📊 Creating tables for all collections...');

        const collectionEntries = Object.entries(COLLECTIONS);

        for (const [collectionKey, collectionName] of collectionEntries) {
            try {
                createTableIfNotExists(collectionName);
                console.log(`✅ Table created/verified: ${collectionName} (${collectionKey})`);
            } catch (error) {
                console.error(`❌ Error creating table ${collectionName}:`, error);
            }
        }

        // Create additional indexes for performance
        console.log('\n🔍 Creating additional indexes...');

        const additionalIndexes = [
            // Cases table indexes
            `CREATE INDEX IF NOT EXISTS idx_cases_status ON ${COLLECTIONS.CASES}(JSON_EXTRACT(data, '$.status'))`,
            `CREATE INDEX IF NOT EXISTS idx_cases_type ON ${COLLECTIONS.CASES}(JSON_EXTRACT(data, '$.type'))`,
            `CREATE INDEX IF NOT EXISTS idx_cases_priority ON ${COLLECTIONS.CASES}(JSON_EXTRACT(data, '$.priority'))`,
            `CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON ${COLLECTIONS.CASES}(JSON_EXTRACT(data, '$.assignedTo'))`,
            `CREATE INDEX IF NOT EXISTS idx_cases_created_by ON ${COLLECTIONS.CASES}(JSON_EXTRACT(data, '$.createdBy'))`,

            // Users table indexes
            `CREATE INDEX IF NOT EXISTS idx_users_email ON ${COLLECTIONS.USERS}(JSON_EXTRACT(data, '$.email'))`,
            `CREATE INDEX IF NOT EXISTS idx_users_role ON ${COLLECTIONS.USERS}(JSON_EXTRACT(data, '$.role'))`,
            `CREATE INDEX IF NOT EXISTS idx_users_active ON ${COLLECTIONS.USERS}(JSON_EXTRACT(data, '$.isActive'))`,

            // Hearings table indexes
            `CREATE INDEX IF NOT EXISTS idx_hearings_case_id ON ${COLLECTIONS.HEARINGS}(JSON_EXTRACT(data, '$.caseId'))`,
            `CREATE INDEX IF NOT EXISTS idx_hearings_judge_id ON ${COLLECTIONS.HEARINGS}(JSON_EXTRACT(data, '$.judgeId'))`,
            `CREATE INDEX IF NOT EXISTS idx_hearings_date ON ${COLLECTIONS.HEARINGS}(JSON_EXTRACT(data, '$.date'))`,
            `CREATE INDEX IF NOT EXISTS idx_hearings_status ON ${COLLECTIONS.HEARINGS}(JSON_EXTRACT(data, '$.status'))`,

            // Documents table indexes
            `CREATE INDEX IF NOT EXISTS idx_documents_case_id ON ${COLLECTIONS.DOCUMENTS}(JSON_EXTRACT(data, '$.caseId'))`,
            `CREATE INDEX IF NOT EXISTS idx_documents_type ON ${COLLECTIONS.DOCUMENTS}(JSON_EXTRACT(data, '$.type'))`,
            `CREATE INDEX IF NOT EXISTS idx_documents_status ON ${COLLECTIONS.DOCUMENTS}(JSON_EXTRACT(data, '$.status'))`,
            `CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON ${COLLECTIONS.DOCUMENTS}(JSON_EXTRACT(data, '$.uploadedBy'))`,

            // Audit logs table indexes
            `CREATE INDEX IF NOT EXISTS idx_audit_actor ON ${COLLECTIONS.AUDIT_LOGS}(JSON_EXTRACT(data, '$.actorId'))`,
            `CREATE INDEX IF NOT EXISTS idx_audit_entity ON ${COLLECTIONS.AUDIT_LOGS}(JSON_EXTRACT(data, '$.entityType'), JSON_EXTRACT(data, '$.entityId'))`,
            `CREATE INDEX IF NOT EXISTS idx_audit_action ON ${COLLECTIONS.AUDIT_LOGS}(JSON_EXTRACT(data, '$.action'))`,
            `CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON ${COLLECTIONS.AUDIT_LOGS}(JSON_EXTRACT(data, '$.timestamp'))`,

            // Notifications table indexes
            `CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON ${COLLECTIONS.NOTIFICATIONS}(JSON_EXTRACT(data, '$.recipientUserId'))`,
            `CREATE INDEX IF NOT EXISTS idx_notifications_read ON ${COLLECTIONS.NOTIFICATIONS}(JSON_EXTRACT(data, '$.readAt'))`,

            // Law firms table indexes
            `CREATE INDEX IF NOT EXISTS idx_law_firms_active ON ${COLLECTIONS.LAW_FIRMS}(JSON_EXTRACT(data, '$.isActive'))`,

            // Calendar events table indexes
            `CREATE INDEX IF NOT EXISTS idx_calendar_case ON ${COLLECTIONS.CALENDAR_EVENTS}(JSON_EXTRACT(data, '$.caseId'))`,
            `CREATE INDEX IF NOT EXISTS idx_calendar_judge ON ${COLLECTIONS.CALENDAR_EVENTS}(JSON_EXTRACT(data, '$.judgeId'))`,
            `CREATE INDEX IF NOT EXISTS idx_calendar_start ON ${COLLECTIONS.CALENDAR_EVENTS}(JSON_EXTRACT(data, '$.start'))`
        ];

        for (const indexSQL of additionalIndexes) {
            try {
                sqlite_db.exec(indexSQL);
            } catch (error) {
                console.error(`Error creating index: ${indexSQL}`, error);
            }
        }

        console.log(`✅ Created ${additionalIndexes.length} additional indexes`);

        // Optimize database
        console.log('\n⚡ Optimizing database...');
        sqlite_db.exec('ANALYZE');
        sqlite_db.exec('VACUUM');

        console.log('✅ Database optimization completed');

        // Display database info
        console.log('\n📊 Database Information:');
        const tableInfo = sqlite_db.prepare(`
            SELECT name, sql 
            FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `).all();

        console.log(`📋 Total tables: ${tableInfo.length}`);
        tableInfo.forEach((table: any) => {
            console.log(`   - ${table.name}`);
        });

        const indexInfo = sqlite_db.prepare(`
            SELECT name 
            FROM sqlite_master 
            WHERE type='index' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `).all();

        console.log(`🔍 Total indexes: ${indexInfo.length}`);

        // Get database file size
        const dbPath = path.join(process.cwd(), 'database.sqlite');
        if (fs.existsSync(dbPath)) {
            const stats = fs.statSync(dbPath);
            const fileSizeInBytes = stats.size;
            const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
            console.log(`💾 Database file size: ${fileSizeInMB} MB`);
        }

        console.log('\n🎉 Database migrations completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('   1. Run: npm run db:example (to test CRUD operations)');
        console.log('   2. Start your application and begin using the database');
        console.log('   3. The database file is located at: ./database.sqlite');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        // Close the database connection
        sqlite_db.close();
    }
}

/**
 * Reset database (delete and recreate)
 */
async function resetDatabase() {
    console.log('🗑️  Resetting database...');

    try {
        const dbPath = path.join(process.cwd(), 'database.sqlite');

        // Delete existing database file
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log('✅ Existing database file deleted');
        }

        // Run migrations to recreate
        await runMigrations();

    } catch (error) {
        console.error('❌ Database reset failed:', error);
        process.exit(1);
    }
}

/**
 * Backup database
 */
async function backupDatabase() {
    try {
        const dbPath = path.join(process.cwd(), 'database.sqlite');
        const backupDir = path.join(process.cwd(), 'backups');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `database-backup-${timestamp}.sqlite`);

        if (!fs.existsSync(dbPath)) {
            console.log('❌ Database file does not exist');
            return;
        }

        // Create backup directory
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // Copy database file
        fs.copyFileSync(dbPath, backupPath);

        console.log(`✅ Database backup created: ${backupPath}`);

        const stats = fs.statSync(backupPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`💾 Backup file size: ${fileSizeInMB} MB`);

    } catch (error) {
        console.error('❌ Database backup failed:', error);
    }
}

// Handle command line arguments
const command = process.argv[2];

switch (command) {
    case 'migrate':
        runMigrations();
        break;
    case 'reset':
        resetDatabase();
        break;
    case 'backup':
        backupDatabase();
        break;
    default:
        console.log('Usage:');
        console.log('  tsx scripts/migrate.ts migrate  - Run migrations');
        console.log('  tsx scripts/migrate.ts reset    - Reset database');
        console.log('  tsx scripts/migrate.ts backup   - Backup database');
        break;
}

export { runMigrations, resetDatabase, backupDatabase };