import { db } from './constants/firebase/config';
import { collection, doc, setDoc } from 'firebase/firestore';
import { COLLECTIONS } from './constants/firebase/collections';
import type { Notification } from '@/models/Notification';


export async function sendNotification(n: Omit<Notification, 'id' | 'createdAt'>) {
    const id = crypto.randomUUID();
    const ref = doc(collection(db, COLLECTIONS.NOTIFICATIONS), id);
    const payload: Notification = { id, createdAt: new Date(), ...n };
    await setDoc(ref, payload);
    return id;
}