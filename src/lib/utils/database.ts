// lib/database.js
import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';
import { User, Case, Hearing, Document, Ruling, CalendarEvent, Notification, AuditLog, SequenceCounter, SystemAlert } from '../models';

const sqlite_db = new Database(path.join(process.cwd(), 'database.sqlite'));
// Enable foreign keys
sqlite_db.pragma('foreign_keys = ON');

// Initialize all tables
sqlite_db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'judge', 'lawyer', 'public')),
    photo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    last_login_at DATETIME,
    profile_data TEXT -- JSON string for UserProfile
  );

  -- Cases table
  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    case_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('civil', 'criminal', 'family', 'commercial', 'constitutional', 'other')),
    status TEXT NOT NULL CHECK (status IN ('filed', 'summons', 'takes_off', 'recording', 'adjournment', 'ruling', 'appeal', 'closed', 'dismissed')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT NOT NULL,
    assigned_to TEXT,
    estimated_duration INTEGER,
    actual_duration INTEGER,
    next_hearing_date DATETIME,
    tags TEXT, -- JSON array
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  );

  -- Case Parties table
  CREATE TABLE IF NOT EXISTS case_parties (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('individual', 'organization')),
    party_type TEXT NOT NULL CHECK (party_type IN ('plaintiff', 'defendant')),
    contact_info TEXT, -- JSON string
    representative TEXT, -- Lawyer ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (representative) REFERENCES users(id)
  );

  -- Case Lawyers table
  CREATE TABLE IF NOT EXISTS case_lawyers (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('plaintiff', 'defendant')),
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Case Status History table
  CREATE TABLE IF NOT EXISTS case_status_history (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    notes TEXT,
    documents TEXT, -- JSON array of document IDs
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id)
  );

  -- Case Events table
  CREATE TABLE IF NOT EXISTS case_events (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('status_change', 'hearing', 'document_upload', 'ruling', 'assignment', 'note', 'party_change', 'process_stage')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT NOT NULL,
    related_entity_id TEXT,
    metadata TEXT, -- JSON string
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  -- Hearings table
  CREATE TABLE IF NOT EXISTS hearings (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    date DATETIME NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    location TEXT NOT NULL,
    judge_id TEXT NOT NULL,
    purpose TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled', 'postponed')),
    outcome TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (judge_id) REFERENCES users(id)
  );

  -- Documents table
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('motion', 'brief', 'evidence', 'order', 'judgment', 'pleading', 'exhibit', 'other')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'sealed')),
    signature_status TEXT NOT NULL CHECK (signature_status IN ('unsigned', 'pending_signature', 'digitally_signed', 'sealed')) DEFAULT 'unsigned',
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    file_path TEXT,
    case_id TEXT,
    case_number TEXT,
    uploaded_by TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    tags TEXT, -- JSON array
    is_public INTEGER DEFAULT 0,
    access_level TEXT NOT NULL CHECK (access_level IN ('public', 'restricted', 'confidential')) DEFAULT 'restricted',
    digital_signature TEXT, -- JSON string
    seal TEXT, -- JSON string
    checksum TEXT,
    parent_document_id TEXT,
    reviewers TEXT, -- JSON array of user IDs
    download_count INTEGER DEFAULT 0,
    last_accessed_at DATETIME,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    FOREIGN KEY (parent_document_id) REFERENCES documents(id)
  );

  -- Rulings table
  CREATE TABLE IF NOT EXISTS rulings (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    judge_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    effective_date DATETIME,
    type TEXT NOT NULL CHECK (type IN ('judgment', 'order', 'injunction', 'dismissal', 'other')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'issued', 'appealed', 'enforced')),
    documents TEXT, -- JSON array of document IDs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (judge_id) REFERENCES users(id)
  );

  -- Calendar Events table
  CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    hearing_id TEXT NOT NULL,
    judge_id TEXT NOT NULL,
    title TEXT NOT NULL,
    start DATETIME NOT NULL,
    end DATETIME NOT NULL,
    location TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (hearing_id) REFERENCES hearings(id) ON DELETE CASCADE,
    FOREIGN KEY (judge_id) REFERENCES users(id)
  );

  -- Notifications table
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    recipient_user_id TEXT NOT NULL,
    recipient_type TEXT CHECK (recipient_type IN ('judge', 'lawyer', 'party', 'staff')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    related_entity_type TEXT CHECK (related_entity_type IN ('case', 'hearing', 'document')),
    related_entity_id TEXT,
    FOREIGN KEY (recipient_user_id) REFERENCES users(id)
  );

  -- Audit Logs table
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('CASE_CREATE', 'CASE_UPDATE', 'CASE_STATUS_UPDATE', 'HEARING_CREATE', 'HEARING_UPDATE', 'DOCUMENT_CREATE', 'DOCUMENT_UPDATE', 'DOCUMENT_SIGN', 'DOCUMENT_SEAL', 'NOTIFICATION_SEND')),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('case', 'hearing', 'document', 'user', 'system')),
    entity_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    details TEXT, -- JSON string
    ip TEXT,
    user_agent TEXT,
    FOREIGN KEY (actor_id) REFERENCES users(id)
  );

  -- Sequence Counters table
  CREATE TABLE IF NOT EXISTS sequence_counters (
    id TEXT PRIMARY KEY,
    current INTEGER NOT NULL DEFAULT 0,
    prefix TEXT,
    year INTEGER NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- System Alerts table
  CREATE TABLE IF NOT EXISTS system_alerts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('error', 'warning', 'info')),
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_resolved INTEGER DEFAULT 0
  );

  -- Indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
  CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to);
  CREATE INDEX IF NOT EXISTS idx_cases_created_by ON cases(created_by);
  CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
  CREATE INDEX IF NOT EXISTS idx_hearings_case_id ON hearings(case_id);
  CREATE INDEX IF NOT EXISTS idx_hearings_judge_id ON hearings(judge_id);
  CREATE INDEX IF NOT EXISTS idx_hearings_date ON hearings(date);
  CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
  CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
  CREATE INDEX IF NOT EXISTS idx_case_parties_case_id ON case_parties(case_id);
  CREATE INDEX IF NOT EXISTS idx_case_lawyers_case_id ON case_lawyers(case_id);
  CREATE INDEX IF NOT EXISTS idx_case_lawyers_user_id ON case_lawyers(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
`);

// Helper function to convert JS object to SQLite compatible format
const toSQLiteDate = (date) => {
    if (!date) return null;
    return date instanceof Date ? date.toISOString() : date;
};

const fromSQLiteDate = (dateString) => {
    return dateString ? new Date(dateString) : null;
};

// CRUD Operations for Users
export const userOperations = {
    create: (userData) => {
        const id = randomUUID();
        const stmt = sqlite_db.prepare(`
      INSERT INTO users (id, email, display_name, role, photo_url, profile_data, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            userData.email,
            userData.displayName,
            userData.role,
            userData.photoURL || null,
            userData.profile ? JSON.stringify(userData.profile) : null,
            userData.isActive !== false ? 1 : 0
        );

        return userOperations.findById(id);
    },

    findById: (id) => {
        const stmt = sqlite_db.prepare('SELECT * FROM users WHERE id = ?');
        const user = stmt.get(id);
        if (!user) return null;

        return {
            ...user,
            isActive: Boolean(user.is_active),
            createdAt: fromSQLiteDate(user.created_at),
            updatedAt: fromSQLiteDate(user.updated_at),
            lastLoginAt: fromSQLiteDate(user.last_login_at),
            profile: user.profile_data ? JSON.parse(user.profile_data) : null
        };
    },

    findByEmail: (email) => {
        const stmt = sqlite_db.prepare('SELECT * FROM users WHERE email = ?');
        const user = stmt.get(email);
        if (!user) return null;

        return userOperations.findById(user.id);
    },

    findAll: (filter = {}) => {
        let query = 'SELECT * FROM users WHERE 1=1';
        const params = [];

        if (filter.role) {
            query += ' AND role = ?';
            params.push(filter.role);
        }

        if (filter.isActive !== undefined) {
            query += ' AND is_active = ?';
            params.push(filter.isActive ? 1 : 0);
        }

        if (filter.search) {
            query += ' AND (display_name LIKE ? OR email LIKE ?)';
            params.push(`%${filter.search}%`, `%${filter.search}%`);
        }

        query += ' ORDER BY created_at DESC';

        const stmt = sqlite_db.prepare(query);
        const users = stmt.all(...params);

        return users.map(user => userOperations.findById(user.id));
    },

    update: (id, updateData) => {
        const updates = [];
        const params = [];

        if (updateData.displayName !== undefined) {
            updates.push('display_name = ?');
            params.push(updateData.displayName);
        }

        if (updateData.role !== undefined) {
            updates.push('role = ?');
            params.push(updateData.role);
        }

        if (updateData.isActive !== undefined) {
            updates.push('is_active = ?');
            params.push(updateData.isActive ? 1 : 0);
        }

        if (updateData.profile !== undefined) {
            updates.push('profile_data = ?');
            params.push(JSON.stringify(updateData.profile));
        }

        if (updateData.photoURL !== undefined) {
            updates.push('photo_url = ?');
            params.push(updateData.photoURL);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const stmt = sqlite_db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...params);

        return userOperations.findById(id);
    },

    delete: (id) => {
        const stmt = sqlite_db.prepare('DELETE FROM users WHERE id = ?');
        return stmt.run(id).changes > 0;
    },

    updateLastLogin: (id) => {
        const stmt = sqlite_db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?');
        stmt.run(id);
    }
};

// CRUD Operations for Cases
export const caseOperations = {
    create: (caseData) => {
        const id = randomUUID();
        const caseNumber = caseData.caseNumber || generateCaseNumber(caseData.type);
        const stmt = sqlite_db.prepare(`
      INSERT INTO cases (id, case_number, title, description, type, status, priority, created_by, assigned_to, estimated_duration, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            caseNumber,
            caseData.title,
            caseData.description || '',
            caseData.type,
            caseData.status || 'filed',
            caseData.priority || 'medium',
            caseData.createdBy,
            caseData.assignedTo || null,
            caseData.estimatedDuration || null,
            caseData.tags ? JSON.stringify(caseData.tags) : null
        );

        // Add case parties if provided
        if (caseData.plaintiffs) {
            caseData.plaintiffs.forEach(plaintiff => {
                casePartyOperations.create({
                    caseId: id,
                    ...plaintiff,
                    partyType: 'plaintiff'
                });
            });
        }

        if (caseData.defendants) {
            caseData.defendants.forEach(defendant => {
                casePartyOperations.create({
                    caseId: id,
                    ...defendant,
                    partyType: 'defendant'
                });
            });
        }

        // Add case lawyers if provided
        if (caseData.lawyers) {
            caseData.lawyers.forEach(lawyer => {
                caseLawyerOperations.create({
                    caseId: id,
                    ...lawyer
                });
            });
        }

        // Create initial case event
        caseEventOperations.create({
            caseId: id,
            type: 'status_change',
            title: 'Case Created',
            description: `Case ${caseNumber} has been created`,
            createdsqlite_dby: caseData.createdsqlite_dby
        });

        return caseOperations.findById(id);
    },

    findById: (id) => {
        const stmt = sqlite_db.prepare('SELECT * FROM cases WHERE id = ?');
        const case_ = stmt.get(id);
        if (!case_) return null;

        // Get related data
        const plaintiffs = casePartyOperations.findByCaseId(id, 'plaintiff');
        const defendants = casePartyOperations.findByCaseId(id, 'defendant');
        const lawyers = caseLawyerOperations.findByCaseId(id);
        const hearings = hearingOperations.findByCaseId(id);
        const documents = documentOperations.findByCaseId(id);
        const rulings = rulingOperations.findByCaseId(id);
        const statusHistory = caseStatusHistoryOperations.findByCaseId(id);
        const timeline = caseEventOperations.findByCaseId(id);

        return {
            ...case_,
            createdAt: fromSQLiteDate(case_.created_at),
            updatedAt: fromSQLiteDate(case_.updated_at),
            nextHearingDate: fromSQLiteDate(case_.next_hearing_date),
            tags: case_.tags ? JSON.parse(case_.tags) : [],
            plaintiffs,
            defendants,
            lawyers,
            hearings,
            documents,
            rulings,
            statusHistory,
            timeline
        };
    },

    findAll: (filter = {}) => {
        let query = 'SELECT * FROM cases WHERE 1=1';
        const params = [];

        if (filter.status) {
            query += ' AND status = ?';
            params.push(filter.status);
        }

        if (filter.type) {
            query += ' AND type = ?';
            params.push(filter.type);
        }

        if (filter.priority) {
            query += ' AND priority = ?';
            params.push(filter.priority);
        }

        if (filter.assignedTo) {
            query += ' AND assigned_to = ?';
            params.push(filter.assignedTo);
        }

        if (filter.createdsqlite_dby) {
            query += ' AND created_by = ?';
            params.push(filter.createdsqlite_dby);
        }

        if (filter.search) {
            query += ' AND (title LIKE ? OR case_number LIKE ? OR description LIKE ?)';
            params.push(`%${filter.search}%`, `%${filter.search}%`, `%${filter.search}%`);
        }

        if (filter.dateRange) {
            query += ' AND created_at BETWEEN ? AND ?';
            params.push(toSQLiteDate(filter.dateRange.start), toSQLiteDate(filter.dateRange.end));
        }

        query += ' ORDER BY created_at DESC';

        const stmt = sqlite_db.prepare(query);
        const cases = stmt.all(...params);

        return cases.map(case_ => ({
            ...case_,
            createdAt: fromSQLiteDate(case_.created_at),
            updatedAt: fromSQLiteDate(case_.updated_at),
            nextHearingDate: fromSQLiteDate(case_.next_hearing_date),
            tags: case_.tags ? JSON.parse(case_.tags) : []
        }));
    },

    update: (id, updateData) => {
        const updates = [];
        const params = [];

        if (updateData.title !== undefined) {
            updates.push('title = ?');
            params.push(updateData.title);
        }

        if (updateData.description !== undefined) {
            updates.push('description = ?');
            params.push(updateData.description);
        }

        if (updateData.status !== undefined) {
            updates.push('status = ?');
            params.push(updateData.status);

            // Record status change in history
            const currentCase = caseOperations.findById(id);
            if (currentCase && currentCase.status !== updateData.status) {
                caseStatusHistoryOperations.create({
                    caseId: id,
                    previousStatus: currentCase.status,
                    newStatus: updateData.status,
                    changedsqlite_dby: updateData.changedsqlite_dby || 'system'
                });
            }
        }

        if (updateData.priority !== undefined) {
            updates.push('priority = ?');
            params.push(updateData.priority);
        }

        if (updateData.assignedTo !== undefined) {
            updates.push('assigned_to = ?');
            params.push(updateData.assignedTo);
        }

        if (updateData.estimatedDuration !== undefined) {
            updates.push('estimated_duration = ?');
            params.push(updateData.estimatedDuration);
        }

        if (updateData.actualDuration !== undefined) {
            updates.push('actual_duration = ?');
            params.push(updateData.actualDuration);
        }

        if (updateData.nextHearingDate !== undefined) {
            updates.push('next_hearing_date = ?');
            params.push(toSQLiteDate(updateData.nextHearingDate));
        }

        if (updateData.tags !== undefined) {
            updates.push('tags = ?');
            params.push(JSON.stringify(updateData.tags));
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const stmt = sqlite_db.prepare(`UPDATE cases SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...params);

        return caseOperations.findById(id);
    },

    delete: (id) => {
        const stmt = sqlite_db.prepare('DELETE FROM cases WHERE id = ?');
        return stmt.run(id).changes > 0;
    }
};

// CRUD Operations for Case Parties
export const casePartyOperations = {
    create: (partyData) => {
        const id = randomUUID();
        const stmt = sqlite_db.prepare(`
      INSERT INTO case_parties (id, case_id, name, type, party_type, contact_info, representative)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            partyData.caseId,
            partyData.name,
            partyData.type,
            partyData.partyType,
            partyData.contactInfo ? JSON.stringify(partyData.contactInfo) : null,
            partyData.representative || null
        );

        return casePartyOperations.findById(id);
    },

    findById: (id) => {
        const stmt = sqlite_db.prepare('SELECT * FROM case_parties WHERE id = ?');
        const party = stmt.get(id);
        if (!party) return null;

        return {
            ...party,
            contactInfo: party.contact_info ? JSON.parse(party.contact_info) : null,
            createdAt: fromSQLiteDate(party.created_at)
        };
    },

    findByCaseId: (caseId, partyType = null) => {
        let query = 'SELECT * FROM case_parties WHERE case_id = ?';
        const params = [caseId];

        if (partyType) {
            query += ' AND party_type = ?';
            params.push(partyType);
        }

        const stmt = sqlite_db.prepare(query);
        const parties = stmt.all(...params);

        return parties.map(party => ({
            ...party,
            contactInfo: party.contact_info ? JSON.parse(party.contact_info) : null,
            createdAt: fromSQLiteDate(party.created_at)
        }));
    },

    update: (id, updateData) => {
        const updates = [];
        const params = [];

        if (updateData.name !== undefined) {
            updates.push('name = ?');
            params.push(updateData.name);
        }

        if (updateData.type !== undefined) {
            updates.push('type = ?');
            params.push(updateData.type);
        }

        if (updateData.contactInfo !== undefined) {
            updates.push('contact_info = ?');
            params.push(JSON.stringify(updateData.contactInfo));
        }

        if (updateData.representative !== undefined) {
            updates.push('representative = ?');
            params.push(updateData.representative);
        }

        params.push(id);

        const stmt = sqlite_db.prepare(`UPDATE case_parties SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...params);

        return casePartyOperations.findById(id);
    },

    delete: (id) => {
        const stmt = sqlite_db.prepare('DELETE FROM case_parties WHERE id = ?');
        return stmt.run(id).changes > 0;
    }
};

// CRUD Operations for Case Lawyers
export const caseLawyerOperations = {
    create: (lawyerData) => {
        const id = randomUUID();
        const stmt = sqlite_db.prepare(`
      INSERT INTO case_lawyers (id, case_id, user_id, role, is_active)
      VALUES (?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            lawyerData.caseId,
            lawyerData.userId,
            lawyerData.role,
            lawyerData.isActive !== false ? 1 : 0
        );

        return caseLawyerOperations.findById(id);
    },

    findById: (id) => {
        const stmt = sqlite_db.prepare('SELECT * FROM case_lawyers WHERE id = ?');
        const lawyer = stmt.get(id);
        if (!lawyer) return null;

        return {
            ...lawyer,
            isActive: Boolean(lawyer.is_active),
            assignedAt: fromSQLiteDate(lawyer.assigned_at)
        };
    },

    findByCaseId: (caseId) => {
        const stmt = sqlite_db.prepare('SELECT * FROM case_lawyers WHERE case_id = ?');
        const lawyers = stmt.all(caseId);

        return lawyers.map(lawyer => ({
            ...lawyer,
            isActive: Boolean(lawyer.is_active),
            assignedAt: fromSQLiteDate(lawyer.assigned_at)
        }));
    },

    update: (id, updateData) => {
        const updates = [];
        const params = [];

        if (updateData.role !== undefined) {
            updates.push('role = ?');
            params.push(updateData.role);
        }

        if (updateData.isActive !== undefined) {
            updates.push('is_active = ?');
            params.push(updateData.isActive ? 1 : 0);
        }

        params.push(id);

        const stmt = sqlite_db.prepare(`UPDATE case_lawyers SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...params);

        return caseLawyerOperations.findById(id);
    },

    delete: (id) => {
        const stmt = sqlite_db.prepare('DELETE FROM case_lawyers WHERE id = ?');
        return stmt.run(id).changes > 0;
    }
};

// CRUD Operations for Case Status History
export const caseStatusHistoryOperations = {
    create: (historyData) => {
        const id = randomUUID();
        const stmt = sqlite_db.prepare(`
      INSERT INTO case_status_history (id, case_id, previous_status, new_status, changed_by, reason, notes, documents)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            historyData.caseId,
            historyData.previousStatus || null,
            historyData.newStatus,
            historyData.changedsqlite_dby,
            historyData.reason || null,
            historyData.notes || null,
            historyData.documents ? JSON.stringify(historyData.documents) : null
        );

        return caseStatusHistoryOperations.findById(id);
    },

    findById: (id) => {
        const stmt = sqlite_db.prepare('SELECT * FROM case_status_history WHERE id = ?');
        const history = stmt.get(id);
        if (!history) return null;

        return {
            ...history,
            changedAt: fromSQLiteDate(history.changed_at),
            documents: history.documents ? JSON.parse(history.documents) : []
        };
    },

    findByCaseId: (caseId) => {
        const stmt = sqlite_db.prepare('SELECT * FROM case_status_history WHERE case_id = ? ORDER BY changed_at DESC');
        const histories = stmt.all(caseId);

        return histories.map(history => ({
            ...history,
            changedAt: fromSQLiteDate(history.changed_at),
            documents: history.documents ? JSON.parse(history.documents) : []
        }));
    }
};

// CRUD Operations for Case Events
export const caseEventOperations = {
    create: (eventData) => {
        const id = randomUUID();
        const stmt = sqlite_db.prepare(`
      INSERT INTO case_events (id, case_id, type, title, description, created_by, related_entity_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            eventData.caseId,
            eventData.type,
            eventData.title,
            eventData.description,
            eventData.createdsqlite_dby,
            eventData.relatedEntityId || null,
            eventData.metadata ? JSON.stringify(eventData.metadata) : null
        );

        return caseEventOperations.findById(id);
    },

    findById: (id) => {
        const stmt = sqlite_db.prepare('SELECT * FROM case_events WHERE id = ?');
        const event = stmt.get(id);
        if (!event) return null;

        return {
            ...event,
            createdAt: fromSQLiteDate(event.created_at),
            metadata: event.metadata ? JSON.parse(event.metadata) : null
        };
    },

    findByCaseId: (caseId) => {
        const stmt = sqlite_db.prepare('SELECT * FROM case_events WHERE case_id = ? ORDER BY created_at DESC');
        const events = stmt.all(caseId);

        return events.map(event => ({
            ...event,
            createdAt: fromSQLiteDate(event.created_at),
            metadata: event.metadata ? JSON.parse(event.metadata) : null
        }));
    }
};

// CRUD Operations for Hearings
export const hearingOperations = {
    create: (hearingData) => {
        const id = randomUUID();
        const stmt = sqlite_db.prepare(`
      INSERT INTO hearings (id, case_id, date, start_time, end_time, location, judge_id, purpose, notes, status, outcome)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            hearingData.caseId,
            toSQLiteDate(hearingData.date),
            hearingData.startTime,
            hearingData.endTime,
            hearingData.location,
            hearingData.judgeId,
            hearingData.purpose,
            hearingData.notes || null,
            hearingData.status || 'scheduled',
            hearingData.outcome || null
        );

        // Create calendar event
        calendarEventOperations.create({
            caseId: hearingData.caseId,
            hearingId: id,
            judgeId: hearingData.judgeId,
            title: `Hearing: ${hearingData.purpose}`,
            start: hearingData.date,
            end: hearingData.date,
            location: hearingData.location
        });

        return hearingOperations.findById(id);
    },

    findById: (id) => {
        const stmt = sqlite_db.prepare('SELECT * FROM hearings WHERE id = ?');
        const hearing = stmt.get(id);
        if (!hearing) return null;

        return {
            ...hearing,
            date: fromSQLiteDate(hearing.date),
            createdAt: fromSQLiteDate(hearing.created_at),
            updatedAt: fromSQLiteDate(hearing.updated_at)
        };
    },

    findByCaseId: (caseId) => {
        const stmt = sqlite_db.prepare('SELECT * FROM hearings WHERE case_id = ? ORDER BY date DESC');
        const hearings = stmt.all(caseId);

        return hearings.map(hearing => ({
            ...hearing,
            date: fromSQLiteDate(hearing.date),
            createdAt: fromSQLiteDate(hearing.created_at),
            updatedAt: fromSQLiteDate(hearing.updated_at)
        }));
    },

    findByJudgeId: (judgeId, dateRange = null) => {
        let query = 'SELECT * FROM hearings WHERE judge_id = ?';
        const params = [judgeId];

        if (dateRange) {
            query += ' AND date BETWEEN ? AND ?';
            params.push(toSQLiteDate(dateRange.start), toSQLiteDate(dateRange.end));
        }

        query += ' ORDER BY date ASC';

        const stmt = sqlite_db.prepare(query);
        const hearings = stmt.all(...params);

        return hearings.map(hearing => ({
            ...hearing,
            date: fromSQLiteDate(hearing.date),
            createdAt: fromSQLiteDate(hearing.created_at),
            updatedAt: fromSQLiteDate(hearing.updated_at)
        }));
    },

    update: (id, updateData) => {
        const updates = [];
        const params = [];

        if (updateData.date !== undefined) {
            updates.push('date = ?');
            params.push(toSQLiteDate(updateData.date));
        }

        if (updateData.startTime !== undefined) {
            updates.push('start_time = ?');
            params.push(updateData.startTime);
        }

        if (updateData.endTime !== undefined) {
            updates.push('end_time = ?');
            params.push(updateData.endTime);
        }

        if (updateData.location !== undefined) {
            updates.push('location = ?');
            params.push(updateData.location);
        }

        if (updateData.purpose !== undefined) {
            updates.push('purpose = ?');
            params.push(updateData.purpose);
        }

        if (updateData.notes !== undefined) {
            updates.push('notes = ?');
            params.push(updateData.notes);
        }

        if (updateData.status !== undefined) {
            updates.push('status = ?');
            params.push(updateData.status);
        }

        if (updateData.outcome !== undefined) {
            updates.push('outcome = ?');
            params.push(updateData.outcome);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const stmt = sqlite_db.prepare(`UPDATE hearings SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...params);

        return hearingOperations.findById(id);
    },

    delete: (id) => {
        const stmt = sqlite_db.prepare('DELETE FROM hearings WHERE id = ?');
        return stmt.run(id).changes > 0;
    }
};

// CRUD Operations for Documents
export const documentOperations = {
    create: (docData) => {
        const id = randomUUID();
        const stmt = sqlite_db.prepare(`
      INSERT INTO documents (id, title, description, type, status, signature_status, file_name, file_size, mime_type, file_path, case_id, case_number, uploaded_by, version, tags, is_public, access_level, checksum, parent_document_id, reviewers)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            docData.title,
            docData.description || null,
            docData.type,
            docData.status || 'draft',
            docData.signatureStatus || 'unsigned',
            docData.fileName,
            docData.fileSize,
            docData.mimeType,
            docData.filePath || null,
            docData.caseId || null,
            docData.caseNumber || null,
            docData.uploadesqlite_dby,
            docData.version || 1,
            docData.tags ? JSON.stringify(docData.tags) : null,
            docData.isPublic ? 1 : 0,
            docData.accessLevel || 'restricted',
            docData.digitalSignature ? JSON.stringify(docData.digitalSignature) : null,
            docData.seal ? JSON.stringify(docData.seal) : null,
            docData.checksum || null,
            docData.parentDocumentId || null,
            docData.reviewers ? JSON.stringify(docData.reviewers) : null
        );

        return documentOperations.finsqlite_dbyId(id);
    },

    finsqlite_dbyId: (id) => {
        const stmt = sqlite_db.prepare('SELECT * FROM documents WHERE id = ?');
        const doc = stmt.get(id);
        if (!doc) return null;

        return {
            ...doc,
            isPublic: Boolean(doc.is_public),
            uploadedAt: fromSQLiteDate(doc.uploaded_at),
            lastModified: fromSQLiteDate(doc.last_modified),
            lastAccessedAt: fromSQLiteDate(doc.last_accessed_at),
            tags: doc.tags ? JSON.parse(doc.tags) : [],
            reviewers: doc.reviewers ? JSON.parse(doc.reviewers) : []
        };
    },

    finsqlite_dbyCaseId: (caseId) => {
        const stmt = sqlite_db.prepare('SELECT * FROM documents WHERE case_id = ? ORDER BY uploaded_at DESC');
        const docs = stmt.all(caseId);

        return docs.map(doc => ({
            ...doc,
            isPublic: Boolean(doc.is_public),
            uploadedAt: fromSQLiteDate(doc.uploaded_at),
            lastModified: fromSQLiteDate(doc.last_modified),
            lastAccessedAt: fromSQLiteDate(doc.last_accessed_at),
            tags: doc.tags ? JSON.parse(doc.tags) : []
        }));
    },

    finsqlite_dbyUploadesqlite_dby: (userId) => {
        const stmt = sqlite_db.prepare('SELECT * FROM documents WHERE uploaded_by = ? ORDER BY uploaded_at DESC');
        const docs = stmt.all(userId);

        return docs.map(doc => documentOperations.finsqlite_dbyId(doc.id));
    },

    update: (id, updateData) => {
        const updates = [];
        const params = [];

        if (updateData.title !== undefined) {
            updates.push('title = ?');
            params.push(updateData.title);
        }

        if (updateData.description !== undefined) {
            updates.push('description = ?');
            params.push(updateData.description);
        }

        if (updateData.status !== undefined) {
            updates.push('status = ?');
            params.push(updateData.status);
        }

        if (updateData.signatureStatus !== undefined) {
            updates.push('signature_status = ?');
            params.push(updateData.signatureStatus);
        }

        if (updateData.tags !== undefined) {
            updates.push('tags = ?');
            params.push(JSON.stringify(updateData.tags));
        }

        if (updateData.isPublic !== undefined) {
            updates.push('is_public = ?');
            params.push(updateData.isPublic ? 1 : 0);
        }

        if (updateData.accessLevel !== undefined) {
            updates.push('access_level = ?');
            params.push(updateData.accessLevel);
        }

        if (updateData.digitalSignature !== undefined) {
            updates.push('digital_signature = ?');
            params.push(JSON.stringify(updateData.digitalSignature));
        }

        if (updateData.seal !== undefined) {
            updates.push('seal = ?');
            params.push(JSON.stringify(updateData.seal));
        }

        if (updateData.reviewers !== undefined) {
            updates.push('reviewers = ?');
            params.push(JSON.stringify(updateData.reviewers));
        }

        updates.push('last_modified = CURRENT_TIMESTAMP');
        params.push(id);

        const stmt = sqlite_db.prepare(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...params);

        return documentOperations.finsqlite_dbyId(id);
    },

    incrementDownloadCount: (id) => {
        const stmt = sqlite_db.prepare('UPDATE documents SET download_count = download_count + 1, last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?');
        stmt.run(id);
    },

    delete: (id) => {
        const stmt = sqlite_db.prepare('DELETE FROM documents WHERE id = ?');
        return stmt.run(id).changes > 0;
    }
};

// CRUD Operations for Rulings
export const rulingOperations = {
    create: (rulingData) => {
        const id = randomUUID();
        const stmt = sqlite_db.prepare(`
      INSERT INTO rulings (id, case_id, judge_id, title, content, issued_at, effective_date, type, status, documents)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            rulingData.caseId,
            rulingData.judgeId,
            rulingData.title,
            rulingData.content,
            toSQLiteDate(rulingData.issuedAt) || toSQLiteDate(new Date()),
            rulingData.effectiveDate || null,
            rulingData.type,
            rulingData.status || 'draft',
            rulingData.documents ? JSON.stringify(rulingData.documents) : null
        );

        return rulingOperations.finsqlite_dbyId(id);
    },

    finsqlite_dbyId: (id) => {
        const stmt = sqlite_db.prepare('SELECT * FROM rulings WHERE id = ?');
        const ruling = stmt.get(id);
        if (!ruling) return null;

        return {
            ...ruling,
            issuedAt: fromSQLiteDate(ruling.issued_at),
            effectiveDate: fromSQLiteDate(ruling.effective_date),
            createdAt: fromSQLiteDate(ruling.created_at),
            updatedAt: fromSQLiteDate(ruling.updated_at),
            documents: ruling.documents ? JSON.parse(ruling.documents) : []
        };
    },

    finsqlite_dbyCaseId: (caseId) => {
        const stmt = sqlite_db.prepare('SELECT * FROM rulings WHERE case_id = ? ORDER BY issued_at DESC');
        const rulings = stmt.all(caseId);

        return rulings.map(ruling => ({
            ...ruling,
            issuedAt: fromSQLiteDate(ruling.issued_at),
            effectiveDate: fromSQLiteDate(ruling.effective_date),
            createdAt: fromSQLiteDate(ruling.created_at),
            updatedAt: fromSQLiteDate(ruling.updated_at),
            documents: ruling.documents ? JSON.parse(ruling.documents) : []
        }));
    },

    finsqlite_dbyJudgeId: (judgeId) => {
        const stmt = sqlite_db.prepare('SELECT * FROM rulings WHERE judge_id = ? ORDER BY issued_at DESC');
        const rulings = stmt.all(judgeId);

        return rulings.map(ruling => rulingOperations.finsqlite_dbyId(ruling.id));
    },

    update: (id, updateData) => {
        const updates = [];
        const params = [];

        if (updateData.title !== undefined) {
            updates.push('title = ?');
            params.push(updateData.title);
        }

        if (updateData.content !== undefined) {
            updates.push('content = ?');
            params.push(updateData.content);
        }

        if (updateData.effectiveDate !== undefined) {
            updates.push('effective_date = ?');
            params.push(toSQLiteDate(updateData.effectiveDate));
        }

        if (updateData.status !== undefined) {
            updates.push('status = ?');
            params.push(updateData.status);
        }

        if (updateData.documents !== undefined) {
            updates.push('documents = ?');
            params.push(JSON.stringify(updateData.documents));
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const stmt = sqlite_db.prepare(`UPDATE rulings SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...params);

        return rulingOperations.finsqlite_dbyId(id);
    },

    delete: (id) => {
        const stmt = sqlite_db.prepare('DELETE FROM rulings WHERE id = ?');
        return stmt.run(id).changes > 0;
    }
};

// CRUD Operations for Calendar Events
export const calendarEventOperations = {
    create: (eventData) => {
        const id = randomUUID();
        const stmt = sqlite_db.prepare(`
      INSERT INTO calendar_events (id, case_id, hearing_id, judge_id, title, start, end, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            eventData.caseId,
            eventData.hearingId,
            eventData.judgeId,
            eventData.title,
            toSQLiteDate(eventData.start),
            toSQLiteDate(eventData.end),
            eventData.location
        );

        return calendarEventOperations.finsqlite_dbyId(id);
    },

    finsqlite_dbyId: (id) => {
        const stmt = sqlite_db.prepare('SELECT * FROM calendar_events WHERE id = ?');
        const event = stmt.get(id);
        if (!event) return null;

        return {
            ...event,
            start: fromSQLiteDate(event.start),
            end: fromSQLiteDate(event.end),
            createdAt: fromSQLiteDate(event.created_at),
            updatedAt: fromSQLiteDate(event.updated_at)
        };
    },

    finsqlite_dbyJudgeId: (judgeId, dateRange = null) => {
        let query = 'SELECT * FROM calendar_events WHERE judge_id = ?';
        const params = [judgeId];

        if (dateRange) {
            query += ' AND start BETWEEN ? AND ?';
            params.push(toSQLiteDate(dateRange.start), toSQLiteDate(dateRange.end));
        }

        query += ' ORDER BY start ASC';

        const stmt = sqlite_db.prepare(query);
        const events = stmt.all(...params);

        return events.map(event => ({
            ...event,
            start: fromSQLiteDate(event.start),
            end: fromSQLiteDate(event.end),
            createdAt: fromSQLiteDate(event.created_at),
            updatedAt: fromSQLiteDate(event.updated_at)
        }));
    },

    update: (id, updateData) => {
        const updates = [];
        const params = [];

        if (updateData.title !== undefined) {
            updates.push('title = ?');
            params.push(updateData.title);
        }

        if (updateData.start !== undefined) {
            updates.push('start = ?');
            params.push(toSQLiteDate(updateData.start));
        }

        if (updateData.end !== undefined) {
            updates.push('end = ?');
            params.push(toSQLiteDate(updateData.end));
        }

        if (updateData.location !== undefined) {
            updates.push('location = ?');
            params.push(updateData.location);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const stmt = sqlite_db.prepare(`UPDATE calendar_events SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...params);

        return calendarEventOperations.finsqlite_dbyId(id);
    },

    delete: (id) => {
        const stmt = sqlite_db.prepare('DELETE FROM calendar_events WHERE id = ?');
        return stmt.run(id).changes > 0;
    }
};

// CRUD Operations for Notifications
export const notificationOperations = {
    create: (notificationData) => {
        const id = randomUUID();
        const stmt = sqlite_db.prepare(`
      INSERT INTO notifications (id, recipient_user_id, recipient_type, title, message, related_entity_type, related_entity_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            notificationData.recipientUserId,
            notificationData.recipientType || null,
            notificationData.title,
            notificationData.message,
            notificationData.relatedEntity?.type || null,
            notificationData.relatedEntity?.id || null
        );

        return notificationOperations.finsqlite_dbyId(id);
    },

    finsqlite_dbyId: (id) => {
        const stmt = sqlite_db.prepare('SELECT * FROM notifications WHERE id = ?');
        const notification = stmt.get(id);
        if (!notification) return null;

        return {
            ...notification,
            createdAt: fromSQLiteDate(notification.created_at),
            readAt: fromSQLiteDate(notification.read_at),
            relatedEntity: notification.related_entity_type ? {
                type: notification.related_entity_type,
                id: notification.related_entity_id
            } : null
        };
    },

    finsqlite_dbyUserId: (userId, unreadOnly = false) => {
        let query = 'SELECT * FROM notifications WHERE recipient_user_id = ?';
        const params = [userId];

        if (unreadOnly) {
            query += ' AND read_at IS NULL';
        }

        query += ' ORDER BY created_at DESC';
        const stmt = sqlite_db.prepare(query);
        const notifications = stmt.all(...params);

        return notifications.map(notification => ({
            ...notification,
            createdAt: fromSQLiteDate(notification.created_at),
            readAt: fromSQLiteDate(notification.read_at),
            relatedEntity: notification.related_entity_type ? {
                type: notification.related_entity_type,
                id: notification.related_entity_id
            } : null
        }));
    },

    markAsRead: (id) => {
        const stmt = sqlite_db.prepare('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ?');
        stmt.run(id);
        return notificationOperations.finsqlite_dbyId(id);
    },

    markAllAsRead: (userId) => {
        const stmt = sqlite_db.prepare('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE recipient_user_id = ? AND read_at IS NULL');
        return stmt.run(userId).changes;
    },

    delete: (id) => {
        const stmt = sqlite_db.prepare('DELETE FROM notifications WHERE id = ?');
        return stmt.run(id).changes > 0;
    }
};

// CRUD Operations for Audit Logs
export const auditLogOperations = {
    create: (auditData) => {
        const id = randomUUID();
        const stmt = sqlite_db.prepare(`
      INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, timestamp, details, ip, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            auditData.actorId,
            auditData.action,
            auditData.entityType,
            auditData.entityId,
            auditData.details ? JSON.stringify(auditData.details) : null,
            auditData.ip || null,
            auditData.userAgent || null
        );

        return auditLogOperations.finsqlite_dbyId(id);
    },

    finsqlite_dbyId: (id) => {
        const stmt = sqlite_db.prepare('SELECT * FROM audit_logs WHERE id = ?');
        const log = stmt.get(id);
        if (!log) return null;

        return {
            ...log,
            timestamp: fromSQLiteDate(log.timestamp),
            details: log.details ? JSON.parse(log.details) : null
        };
    },

    finsqlite_dbyEntity: (entityType, entityId) => {
        const stmt = sqlite_db.prepare('SELECT * FROM audit_logs WHERE entity_type = ? AND entity_id = ? ORDER BY timestamp DESC');
        const logs = stmt.all(entityType, entityId);

        return logs.map(log => ({
            ...log,
            timestamp: fromSQLiteDate(log.timestamp),
            details: log.details ? JSON.parse(log.details) : null
        }));
    },

    finsqlite_dbyActor: (actorId, limit = 100) => {
        const stmt = sqlite_db.prepare('SELECT * FROM audit_logs WHERE actor_id = ? ORDER BY timestamp DESC LIMIT ?');
        const logs = stmt.all(actorId, limit);

        return logs.map(log => auditLogOperations.finsqlite_dbyId(log.id));
    }
};

// CRUD Operations for Sequence Counters
export const sequenceOperations = {
    getNext: (type, year = new Date().getFullYear()) => {
        const id = `${type}_${year}`;

        // Try to get existing counter
        let stmt = sqlite_db.prepare('SELECT * FROM sequence_counters WHERE id = ?');
        let counter = stmt.get(id);

        if (!counter) {
            // Create new counter
            stmt = sqlite_db.prepare('INSERT INTO sequence_counters (id, current, year) VALUES (?, 0, ?)');
            stmt.run(id, year);
            counter = { id, current: 0, year };
        }

        // Increment counter
        stmt = sqlite_db.prepare('UPDATE sequence_counters SET current = current + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        stmt.run(id);

        return counter.current + 1;
    },

    reset: (type, year) => {
        const id = `${type}_${year}`;
        const stmt = sqlite_db.prepare('UPDATE sequence_counters SET current = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        return stmt.run(id).changes > 0;
    }
};

// CRUD Operations for System Alerts
export const systemAlertOperations = {
    create: (alertData) => {
        const id = randomUUID();
        const stmt = sqlite_db.prepare(`
      INSERT INTO system_alerts (id, type, message)
      VALUES (?, ?, ?)
    `);

        stmt.run(id, alertData.type, alertData.message);
        return systemAlertOperations.finsqlite_dbyId(id);
    },

    finsqlite_dbyId: (id) => {
        const stmt = sqlite_db.prepare('SELECT * FROM system_alerts WHERE id = ?');
        const alert = stmt.get(id);
        if (!alert) return null;

        return {
            ...alert,
            timestamp: fromSQLiteDate(alert.timestamp),
            isResolved: Boolean(alert.is_resolved)
        };
    },

    findAll: (includeResolved = false) => {
        let query = 'SELECT * FROM system_alerts';
        if (!includeResolved) {
            query += ' WHERE is_resolved = 0';
        }
        query += ' ORDER BY timestamp DESC';
        const stmt = sqlite_db.prepare(query);
        const alerts = stmt.all();

        return alerts.map(alert => ({
            ...alert,
            timestamp: fromSQLiteDate(alert.timestamp),
            isResolved: Boolean(alert.is_resolved)
        }));
    },

    resolve: (id) => {
        const stmt = sqlite_db.prepare('UPDATE system_alerts SET is_resolved = 1 WHERE id = ?');
        return stmt.run(id).changes > 0;
    },

    delete: (id) => {
        const stmt = sqlite_db.prepare('DELETE FROM system_alerts WHERE id = ?');
        return stmt.run(id).changes > 0;
    }
};

// Utility functions
function generateCaseNumber(type, year = new Date().getFullYear()) {
    const prefixes = {
        civil: 'CIV',
        criminal: 'CR',
        family: 'FAM',
        commercial: 'COM',
        constitutional: 'CON',
        other: 'OTH'
    };

    const prefix = prefixes[type] || 'OTH';
    const sequence = sequenceOperations.getNext(`CASE_${type.toUpperCase()}`, year);

    return `${prefix}/${sequence.toString().padStart(4, '0')}/${year}`;
}

// Dashboard and Report Operations
export const reportOperations = {
    getCaseloadReport: () => {
        const stmt = sqlite_db.prepare(`
      SELECT status, COUNT(*) as total
      FROM cases
      GROUP BY status
      ORDER BY total DESC
    `);
        return stmt.all();
    },

    getPerformanceMetrics: () => {
        const stmt = sqlite_db.prepare(`
      SELECT 
        u.id as judgeId,
        u.display_name as judgeName,
        COUNT(c.id) as totalCases,
        COUNT(CASE WHEN c.status IN ('closed', 'dismissed') THEN 1 END) as casesClosed,
        AVG(CASE WHEN c.actual_duration IS NOT NULL THEN c.actual_duration END) as avgResolutionDays
      FROM users u
      LEFT JOIN cases c ON c.assigned_to = u.id
      WHERE u.role = 'judge'
      GROUP BY u.id, u.display_name
      ORDER BY totalCases DESC
    `);
        return stmt.all();
    },

    getTrendData: (days = 30) => {
        const stmt = sqlite_db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as casesCreated,
        (SELECT COUNT(*) FROM cases WHERE status IN ('closed', 'dismissed') AND DATE(updated_at) = DATE(c.created_at)) as casesClosed,
        (SELECT COUNT(*) FROM hearings WHERE DATE(date) = DATE(c.created_at)) as hearingsScheduled
      FROM cases c
      WHERE created_at >= date('now', '-${days} days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
        return stmt.all();
    },

    getDashboardStats: () => {
        const totalCases = sqlite_db.prepare('SELECT COUNT(*) as count FROM cases').get().count;
        const activeCases = sqlite_db.prepare('SELECT COUNT(*) as count FROM cases WHERE status NOT IN ("closed", "dismissed")').get().count;
        const pendingHearings = sqlite_db.prepare('SELECT COUNT(*) as count FROM hearings WHERE status = "scheduled" AND date >= datetime("now")').get().count;
        const documentsProcessed = sqlite_db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
        const aiQueriesHandled = 0; // Placeholder - implement if you have AI query tracking

        return {
            totalCases,
            activeCases,
            pendingHearings,
            documentsProcessed,
            aiQueriesHandled
        };
    }
};

// Search Operations
export const searchOperations = {
    searchCases: (query, filters = {}) => {
        let sql = `
      SELECT c.*
      FROM cases c
      WHERE (
        c.title LIKE ? OR 
        c.description LIKE ? OR 
        c.case_number LIKE ?
      )
    `;
        const params = [`%${query}%`, `%${query}%`, `%${query}%`];

        if (filters.status) {
            sql += ' AND c.status = ?';
            params.push(filters.status);
        }

        if (filters.type) {
            sql += ' AND c.type = ?';
            params.push(filters.type);
        }

        if (filters.assignedTo) {
            sql += ' AND c.assigned_to = ?';
            params.push(filters.assignedTo);
        }

        if (filters.createsqlite_dby) {
            sql += ' AND c.created_by = ?';
            params.push(filters.createsqlite_dby);
        }

        sql += ' ORDER BY c.updated_at DESC LIMIT 50';

        const stmt = sqlite_db.prepare(sql);
        const results = stmt.all(...params);

        return results.map(case_ => ({
            ...case_,
            createdAt: fromSQLiteDate(case_.created_at),
            updatedAt: fromSQLiteDate(case_.updated_at),
            nextHearingDate: fromSQLiteDate(case_.next_hearing_date),
            tags: case_.tags ? JSON.parse(case_.tags) : []
        }));
    },

    searchDocuments: (query, filters = {}) => {
        let sql = `
      SELECT d.*
      FROM documents d
      WHERE (
        d.title LIKE ? OR 
        d.description LIKE ? OR 
        d.file_name LIKE ?
      )
    `;
        const params = [`%${query}%`, `%${query}%`, `%${query}%`];

        if (filters.type) {
            sql += ' AND d.type = ?';
            params.push(filters.type);
        }

        if (filters.caseId) {
            sql += ' AND d.case_id = ?';
            params.push(filters.caseId);
        }

        if (filters.uploadedBy) {
            sql += ' AND d.uploaded_by = ?';
            params.push(filters.uploadedBy);
        }

        sql += ' ORDER BY d.uploaded_at DESC LIMIT 50';

        const stmt = sqlite_db.prepare(sql);
        const results = stmt.all(...params);

        return results.map(doc => documentOperations.finsqlite_dbyId(doc.id));
    },

    searchUsers: (query, filters = {}) => {
        let sql = `
      SELECT u.*
      FROM users u
      WHERE (
        u.display_name LIKE ? OR 
        u.email LIKE ?
      )
    `;
        const params = [`%${query}%`, `%${query}%`];

        if (filters.role) {
            sql += ' AND u.role = ?';
            params.push(filters.role);
        }

        if (filters.isActive !== undefined) {
            sql += ' AND u.is_active = ?';
            params.push(filters.isActive ? 1 : 0);
        }

        sql += ' ORDER BY u.display_name ASC LIMIT 50';

        const stmt = sqlite_db.prepare(sql);
        const results = stmt.all(...params);

        return results.map(user => userOperations.finsqlite_dbyId(user.id));
    }
};

// Bulk Operations
export const bulkOperations = {
    createCases: (casesData) => {
        const results = [];
        const transaction = sqlite_db.transaction((cases) => {
            for (const caseData of cases) {
                results.push(caseOperations.create(caseData));
            }
        });

        transaction(casesData);
        return results;
    },

    updateCaseStatuses: (updates) => {
        const transaction = sqlite_db.transaction((statusUpdates) => {
            const stmt = sqlite_db.prepare('UPDATE cases SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
            for (const { caseId, status, changesqlite_dby } of statusUpdates) {
                stmt.run(status, caseId);

                // Record in status history
                caseStatusHistoryOperations.create({
                    caseId,
                    newStatus: status,
                    changesqlite_dby: changesqlite_dby || 'system'
                });
            }
        });

        transaction(updates);
    },

    deleteDocuments: (documentIds) => {
        const transaction = sqlite_db.transaction((ids) => {
            const stmt = sqlite_db.prepare('DELETE FROM documents WHERE id = ?');
            for (const id of ids) {
                stmt.run(id);
            }
        });

        transaction(documentIds);
    }
};

// Transaction wrapper for complex operations
export const withTransaction = (callback) => {
    const transaction = sqlite_db.transaction(callback);
    return transaction;
};

// Database maintenance operations
export const maintenanceOperations = {
    vacuum: () => {
        sqlite_db.exec('VACUUM');
    },

    analyze: () => {
        sqlite_db.exec('ANALYZE');
    },

    integrity_check: () => {
        const result = sqlite_db.prepare('PRAGMA integrity_check').all();
        return result;
    },

    backup: (backupPath) => {
        const backup = sqlite_db.backup(backupPath);
        return backup;
    },

    getTableInfo: (tableName) => {
        const stmt = sqlite_db.prepare('PRAGMA table_info(?)');
        return stmt.all(tableName);
    },

    getIndexes: (tableName) => {
        const stmt = sqlite_db.prepare('PRAGMA index_list(?)');
        return stmt.all(tableName);
    }
};

// Close database connection
export const closeDatabase = () => {
    sqlite_db.close();
};

// Export the database instance for direct access if needed
export { sqlite_db };

export default sqlite_db;