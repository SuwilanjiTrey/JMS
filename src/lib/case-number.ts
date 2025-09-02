import { db } from './constants/firebase/config';
import { collection, doc, getDoc, runTransaction, setDoc, updateDoc } from 'firebase/firestore';
import { COLLECTIONS } from './constants/firebase/collections';
import type { SequenceCounter } from '@/models/Sequence';
import { buildCaseNumber } from './ids';


export async function nextCaseNumber(typePrefix = 'GEN', courtCode = 'LUS-HC') {
    const year = new Date().getFullYear();
    const id = `CASE_NUMBER_${year}`;
    const ref = doc(collection(db, COLLECTIONS.SEQUENCES), id);
    return await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        let seq = 1;
        if (!snap.exists()) {
            const payload: SequenceCounter = { id, current: 1, prefix: typePrefix, year, updatedAt: new Date() };
            tx.set(ref, payload as any);
        } else {
            const current = (snap.data() as any).current ?? 0;
            seq = current + 1;
            tx.update(ref, { current: seq, updatedAt: new Date() });
        }
        const caseNumber = buildCaseNumber(seq, typePrefix, courtCode);
        return { seq, caseNumber };
    });
}