// lib/utils/public.ts
import { storage } from '../constants/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, query, where, getDocs, orderBy, startAfter, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../constants/firebase/config';
import { COLLECTIONS } from '../constants/firebase/collections';

// Upload a file to public storage
export const uploadPublicFile = async (file: File, fileName: string): Promise<string> => {
  try {
    // Create a reference to the file location in public storage
    const storageRef = ref(storage, `public/docs/${fileName}`);
    
    // Upload file
    await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

// Create a public case
export const createPublicCase = async (caseData: {
  title: string;
  description: string;
  type: string;
  priority: string;
  plaintiffs: any[];
  defendants: any[];
  documents: any[];
  createdBy: string;
}) => {
  try {
    const casesRef = collection(db, COLLECTIONS.CASES);
    
    // Generate a unique case number
    const caseNumber = `CV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Create new case object
    const newCase = {
      caseNumber,
      title: caseData.title,
      description: caseData.description,
      type: caseData.type,
      status: 'filed', // Initial status
      priority: caseData.priority,
      caseVisibility: 'public', // Public visibility
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: caseData.createdBy,
      plaintiffs: caseData.plaintiffs.map(p => ({
        ...p,
        id: `party-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })),
      defendants: caseData.defendants.map(d => ({
        ...d,
        id: `party-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })),
      documents: caseData.documents,
      hearings: [],
      rulings: [],
      statusHistory: [{
        id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        caseId: '', // Will be set after document creation
        previousStatus: undefined,
        newStatus: 'filed',
        changedBy: caseData.createdBy,
        changedAt: new Date(),
        status: 'filed',
        notes: 'Case filed by public user'
      }],
      timeline: [{
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        caseId: '', // Will be set after document creation
        type: 'status_change',
        title: 'Case Filed',
        description: `Case ${caseNumber} has been filed`,
        createdAt: new Date(),
        createdBy: caseData.createdBy,
        metadata: {
          previousValue: undefined,
          newValue: 'filed'
        }
      }]
    };
    
    // Add case to Firestore
    const docRef = await addDoc(casesRef, newCase);
    
    // Update status history and timeline with case ID
    const updatedCase = {
      ...newCase,
      id: docRef.id,
      statusHistory: newCase.statusHistory.map(h => ({
        ...h,
        caseId: docRef.id
      })),
      timeline: newCase.timeline.map(t => ({
        ...t,
        caseId: docRef.id
      }))
    };
    
    // Send notification to court admin (in a real app, you'd use Firebase Cloud Messaging or similar)
    console.log(`Notification: New case filed - ${caseNumber}`);
    
    return {
      id: docRef.id,
      ...updatedCase
    };
  } catch (error) {
    console.error('Error creating case:', error);
    throw error;
  }
};

// Get public cases without pagination
export const getPublicCases = async () => {
  try {
    const casesQuery = query(
      collection(db, COLLECTIONS.CASES),
      where('caseVisibility', '==', 'public'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(casesQuery);
    
    const cases: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      cases.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    
    return cases;
  } catch (error) {
    console.error('Error fetching public cases:', error);
    throw error;
  }
};

// Get a specific case by ID
export const getCaseById = async (caseId: string) => {
  try {
    const caseRef = doc(db, COLLECTIONS.CASES, caseId);
    const caseDoc = await getDoc(caseRef);
    
    if (!caseDoc.exists()) {
      throw new Error('Case not found');
    }
    
    const data = caseDoc.data();
    return {
      id: caseDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error fetching case by ID:', error);
    throw error;
  }
};

// Get published judgments without pagination
export const getPublishedJudgments = async () => {
  try {
    const judgmentsQuery = query(
      collection(db, COLLECTIONS.JUDGMENTS),
      where('isPublished', '==', true),
      orderBy('issuedDate', 'desc')
    );
    
    const querySnapshot = await getDocs(judgmentsQuery);
    
    const judgments: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      judgments.push({
        id: doc.id,
        ...data,
        issuedDate: data.issuedDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date()
      });
    });
    
    return judgments;
  } catch (error) {
    console.error('Error fetching published judgments:', error);
    throw error;
  }
};

// Get public cause list for a specific date
export const getPublicCauseList = async (date: Date, courtType?: string) => {
  try {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    let hearingsQuery;
    
    if (courtType && courtType !== 'all') {
      hearingsQuery = query(
        collection(db, COLLECTIONS.HEARINGS),
        where('scheduledDate', '>=', startDate),
        where('scheduledDate', '<=', endDate),
        where('courtType', '==', courtType),
        where('isPublic', '==', true),
        orderBy('scheduledTime')
      );
    } else {
      hearingsQuery = query(
        collection(db, COLLECTIONS.HEARINGS),
        where('scheduledDate', '>=', startDate),
        where('scheduledDate', '<=', endDate),
        where('isPublic', '==', true),
        orderBy('scheduledTime')
      );
    }
    
    const querySnapshot = await getDocs(hearingsQuery);
    
    const hearings: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      hearings.push({
        id: doc.id,
        ...data,
        scheduledDate: data.scheduledDate?.toDate() || new Date()
      });
    });
    
    return hearings;
  } catch (error) {
    console.error('Error fetching public cause list:', error);
    throw error;
  }
};

// Delete a file from public storage
export const deletePublicFile = async (fileName: string): Promise<void> => {
  try {
    // Create a reference to the file location in public storage
    const storageRef = ref(storage, `public/docs/${fileName}`);
    
    // Delete file
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
};

// Search public cases by case number, party name, or keywords
export const searchPublicCases = async (searchTerm: string, caseType?: string, dateFrom?: string, dateTo?: string) => {
  try {
    let casesQuery = query(
      collection(db, COLLECTIONS.CASES),
      where('caseVisibility', '==', 'public'),
      orderBy('createdAt', 'desc')
    );
    
    // Apply case type filter if provided
    if (caseType && caseType !== 'all') {
      casesQuery = query(casesQuery, where('type', '==', caseType));
    }
    
    // Apply date range filter if provided
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      casesQuery = query(casesQuery, where('createdAt', '>=', fromDate));
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of the day
      casesQuery = query(casesQuery, where('createdAt', '<=', toDate));
    }
    
    const querySnapshot = await getDocs(casesQuery);
    
    const cases: any[] = [];
    const term = searchTerm.toLowerCase();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Check if the case matches the search term
      const matchesSearch = 
        data.title.toLowerCase().includes(term) ||
        data.caseNumber.toLowerCase().includes(term) ||
        data.description.toLowerCase().includes(term) ||
        data.plaintiffs.some((p: any) => p.name.toLowerCase().includes(term)) ||
        data.defendants.some((d: any) => d.name.toLowerCase().includes(term));
      
      if (matchesSearch) {
        cases.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      }
    });
    
    return cases;
  } catch (error) {
    console.error('Error searching public cases:', error);
    throw error;
  }
};
