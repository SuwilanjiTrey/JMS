import { db } from './constants/firebase/config';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from './constants/firebase/collections';
import type { AuditLog, AuditAction } from '../models/Audit';


export async function writeAudit(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const id = crypto.randomUUID();
    const ref = doc(collection(db, COLLECTIONS.AUDIT_LOGS), id);
    const payload = { ...log, id, timestamp: new Date() } as AuditLog;
    await setDoc(ref, payload);
    return id;
}