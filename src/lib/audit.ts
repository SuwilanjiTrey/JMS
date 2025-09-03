import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from './constants/firebase/config';
import { COLLECTIONS } from './constants/firebase/collections';
import type { AuditLog } from '../models/Audit';

export async function writeAudit(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const id = crypto.randomUUID();
    const ref = doc(collection(db, COLLECTIONS.AUDIT_LOGS), id);
    const payload = { ...log, id, timestamp: new Date() } as AuditLog;
    await setDoc(ref, payload);
    return id;
}