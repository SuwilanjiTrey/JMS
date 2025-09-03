// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  CASES: 'cases',
  HEARINGS: 'hearings',
  DOCUMENTS: 'documents',
  RULINGS: 'rulings',
  ROLES: 'roles',
  COURTS: 'courts',
  AUDIT_LOGS: 'audit_logs',
  LAW_FIRMS: 'lawFirms',
  CALENDAR_EVENTS: 'calendarEvents',
  NOTIFICATIONS: 'notifications',
  CALENDAR: 'calendar',
  SEQUENCES: 'sequences',
  STATS: 'stats',
  JUDGES: 'judges',
  AI_QUERIES: 'aiQueries',
  PARLIAMENT_UPDATES: 'parliamentUpdates'
} as const;




export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
