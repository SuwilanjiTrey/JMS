import { collection, doc, setDoc, addDoc, serverTimestamp  } from 'firebase/firestore';
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



export interface AuditLogData {
  action: string;
  userId: string;
  targetId: string;
  targetType: string;
  details?: any;
}

export const createAuditLog = async (auditData: AuditLogData) => {
  try {
    const auditLogRef = collection(db, COLLECTIONS.AUDIT_LOGS);
    await addDoc(auditLogRef, {
      ...auditData,
      timestamp: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error creating audit log:', error);
    return false;
  }
};
