//lib/notifications.ts

import { db } from './constants/firebase/config';
import { COLLECTIONS } from './constants/firebase/collections';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export interface NotificationData {
  type: string;
  recipientIds: string[];
  title: string;
  message: string;
  data?: any;
}

export const emitNotification = async (notificationData: NotificationData) => {
  try {
    const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    
    // Create a notification for each recipient
    for (const recipientId of notificationData.recipientIds) {
      await addDoc(notificationsRef, {
        type: notificationData.type,
        recipientId,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        read: false,
        createdAt: serverTimestamp(),
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error emitting notification:', error);
    return false;
  }
};
