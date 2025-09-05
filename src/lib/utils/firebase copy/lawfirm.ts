// src/lib/utils/firebase/lawfirm.ts

import { db } from '@/lib/constants/firebase/config';
import { COLLECTIONS } from '@/lib/constants/firebase/collections';
import { doc, getDoc, getDocs, query, where, collection, updateDoc, setDoc } from 'firebase/firestore';

export interface LawFirm {
  id: string;
  name: string;
  lawyers: string[];
  administrators: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface LawyerProfile {
  id: string;
  email: string;
  displayName: string;
  role: string;
  profile?: {
    lawFirmName?: string;
    lawFirmId?: string;
    barNumber?: string;
    specializations?: string[];
  };
}

// Demo data generator for law firm admin
const generateDemoLawFirmData = (lawFirmId: string, lawFirmName: string, userId: string) => {
  const demoLawyers = [
    {
      id: userId,
      email: 'lawfirm.admin@demo.zm',
      displayName: 'John Mwamba',
      role: 'law-firm-admin',
      profile: {
        lawFirmId: lawFirmId,
        lawFirmName: lawFirmName,
        barNumber: 'BAR001',
        specializations: ['Corporate Law', 'Commercial Law']
      }
    },
    {
      id: 'demo-lawyer-2',
      email: 'lawyer2@demo.zm',
      displayName: 'Sarah Banda',
      role: 'lawyer',
      profile: {
        lawFirmId: lawFirmId,
        lawFirmName: lawFirmName,
        barNumber: 'BAR002',
        specializations: ['Criminal Law', 'Family Law']
      }
    },
    {
      id: 'demo-lawyer-3',
      email: 'lawyer3@demo.zm',
      displayName: 'Michael Phiri',
      role: 'lawyer',
      profile: {
        lawFirmId: lawFirmId,
        lawFirmName: lawFirmName,
        barNumber: 'BAR003',
        specializations: ['Civil Law', 'Property Law']
      }
    }
  ];

  const demoCases = [
    {
      id: 'demo-case-1',
      title: 'Contract Dispute Case',
      caseNumber: 'CC/001/2024',
      plaintiff: { name: 'ABC Corporation', lawyerId: 'demo-lawyer-2' },
      defendant: { name: 'XYZ Limited', lawyerId: 'demo-lawyer-3' },
      status: 'active',
      filingDate: new Date('2024-01-15').toISOString(),
      courtType: 'high-court'
    },
    {
      id: 'demo-case-2',
      title: 'Employment Dispute',
      caseNumber: 'ED/002/2024',
      plaintiff: { name: 'Jane Tembo', lawyerId: userId },
      defendant: { name: 'Mining Corp Ltd', lawyerId: 'demo-lawyer-2' },
      status: 'pending',
      filingDate: new Date('2024-02-20').toISOString(),
      courtType: 'local-courts'
    },
    {
      id: 'demo-case-3',
      title: 'Property Rights Case',
      caseNumber: 'PR/003/2024',
      plaintiff: { name: 'Community Group', lawyerId: 'demo-lawyer-3' },
      defendant: { name: 'Development Co', lawyerId: userId },
      status: 'closed',
      filingDate: new Date('2023-12-01').toISOString(),
      courtType: 'high-court'
    },
    {
      id: 'demo-case-4',
      title: 'Commercial Litigation',
      caseNumber: 'CL/004/2024',
      plaintiff: { name: 'Trade Partners', lawyerId: 'demo-lawyer-2' },
      defendant: { name: 'Import Export Ltd', lawyerId: 'demo-lawyer-3' },
      status: 'active',
      filingDate: new Date('2024-03-10').toISOString(),
      courtType: 'high-court'
    },
    {
      id: 'demo-case-5',
      title: 'Family Law Matter',
      caseNumber: 'FL/005/2024',
      plaintiff: { name: 'Mary Sakala', lawyerId: 'demo-lawyer-2' },
      defendant: { name: 'John Sakala', lawyerId: userId },
      status: 'pending',
      filingDate: new Date('2024-01-30').toISOString(),
      courtType: 'local-courts'
    }
  ];

  const firm = {
    id: lawFirmId,
    name: lawFirmName,
    lawyers: demoLawyers.map(l => l.id),
    administrators: [userId],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  };

  return {
    firm,
    lawyers: demoLawyers,
    cases: demoCases
  };
};

// Check if user is demo user
const isDemoUser = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('isDemoUser') === 'true';
  }
  return false;
};

// Get law firm by ID
export const getLawFirmById = async (lawFirmId: string): Promise<LawFirm | null> => {
  try {
    // Handle demo users
    if (isDemoUser()) {
      const demoData = generateDemoLawFirmData(lawFirmId, 'Demo Legal Associates', 'demo-user-id');
      return demoData.firm;
    }

    const firmRef = doc(db, COLLECTIONS.LAW_FIRMS, lawFirmId);
    const firmSnap = await getDoc(firmRef);
    
    if (!firmSnap.exists()) {
      return null;
    }

    const data = firmSnap.data();
    return {
      id: firmSnap.id,
      name: data.name,
      lawyers: data.lawyers || [],
      administrators: data.administrators || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      isActive: data.isActive ?? true
    };
  } catch (error) {
    console.error('Error fetching law firm:', error);
    return null;
  }
};

// Get lawyers by law firm ID
export const getLawyersByFirmId = async (lawFirmId: string): Promise<LawyerProfile[]> => {
  try {
    // Handle demo users
    if (isDemoUser()) {
      const demoData = generateDemoLawFirmData(lawFirmId, 'Demo Legal Associates', 'demo-user-id');
      return demoData.lawyers;
    }

    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('role', '==', 'lawyer'),
      where('profile.lawFirmId', '==', lawFirmId),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const lawyers: LawyerProfile[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      lawyers.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        profile: data.profile
      });
    });
    
    return lawyers;
  } catch (error) {
    console.error('Error fetching lawyers by firm:', error);
    return [];
  }
};

// Get cases by law firm (all cases where lawyers from the firm are involved)
export const getCasesByLawFirm = async (lawFirmId: string): Promise<any[]> => {
  try {
    // Handle demo users
    if (isDemoUser()) {
      const demoData = generateDemoLawFirmData(lawFirmId, 'Demo Legal Associates', 'demo-user-id');
      return demoData.cases;
    }

    // First get all lawyers from the firm
    const lawyers = await getLawyersByFirmId(lawFirmId);
    const lawyerIds = lawyers.map(lawyer => lawyer.id);
    
    if (lawyerIds.length === 0) {
      return [];
    }

    // Get all cases where any of these lawyers are involved
    const casesRef = collection(db, COLLECTIONS.CASES);
    const allCases = await getDocs(casesRef);
    const firmCases: any[] = [];
    
    allCases.forEach((doc) => {
      const caseData = doc.data();
      const isInvolved = lawyerIds.some(lawyerId => 
        caseData.plaintiff?.lawyerId === lawyerId || 
        caseData.defendant?.lawyerId === lawyerId
      );
      
      if (isInvolved) {
        firmCases.push({
          id: doc.id,
          ...caseData
        });
      }
    });
    
    return firmCases;
  } catch (error) {
    console.error('Error fetching cases by law firm:', error);
    return [];
  }
};

// Create law firm if it doesn't exist (for demo users)
const createLawFirmIfNotExists = async (lawFirmId: string, lawFirmName: string): Promise<void> => {
  try {
    if (isDemoUser()) {
      // Demo users don't need to create actual records
      return;
    }

    const firmRef = doc(db, COLLECTIONS.LAW_FIRMS, lawFirmId);
    const firmDoc = await getDoc(firmRef);
    
    if (!firmDoc.exists()) {
      await setDoc(firmRef, {
        id: lawFirmId,
        name: lawFirmName,
        lawyers: [],
        administrators: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      });
    }
  } catch (error) {
    console.error('Error creating law firm:', error);
  }
};

// Get firm statistics
export const getLawFirmStats = async (lawFirmId: string) => {
  try {
    console.log('Getting stats for lawFirmId:', lawFirmId);
    
    // Handle demo users with generated data
    if (isDemoUser()) {
      console.log('Using demo data for law firm stats');
      const demoData = generateDemoLawFirmData(lawFirmId, 'Demo Legal Associates', 'demo-user-id');
      
      const activeCases = demoData.cases.filter(c => c.status === 'active').length;
      const pendingCases = demoData.cases.filter(c => c.status === 'pending').length;
      const closedCases = demoData.cases.filter(c => c.status === 'closed').length;

      return {
        firm: demoData.firm,
        totalLawyers: demoData.lawyers.length,
        totalCases: demoData.cases.length,
        activeCases,
        pendingCases,
        closedCases,
        lawyers: demoData.lawyers,
        cases: demoData.cases
      };
    }

    // For real users, try to get or create the firm
    let firm = await getLawFirmById(lawFirmId);
    
    // If firm doesn't exist, try to create it with a reasonable name
    if (!firm) {
      console.log('Law firm not found, attempting to create...');
      const firmName = lawFirmId.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') + ' Law Firm';
      
      await createLawFirmIfNotExists(lawFirmId, firmName);
      firm = await getLawFirmById(lawFirmId);
    }

    if (!firm) {
      throw new Error(`Law firm with ID "${lawFirmId}" not found and could not be created`);
    }

    const [lawyers, cases] = await Promise.all([
      getLawyersByFirmId(lawFirmId),
      getCasesByLawFirm(lawFirmId)
    ]);

    const activeCases = cases.filter(c => c.status === 'active').length;
    const pendingCases = cases.filter(c => c.status === 'pending').length;
    const closedCases = cases.filter(c => c.status === 'closed').length;

    return {
      firm,
      totalLawyers: lawyers.length,
      totalCases: cases.length,
      activeCases,
      pendingCases,
      closedCases,
      lawyers,
      cases
    };
  } catch (error) {
    console.error('Error getting law firm stats:', error);
    throw error;
  }
};

// Update lawyer's law firm association
export const updateLawyerFirmAssociation = async (
  lawyerId: string, 
  newFirmId: string, 
  newFirmName: string
): Promise<void> => {
  try {
    // Skip for demo users
    if (isDemoUser()) {
      console.log('Skipping lawyer firm association update for demo user');
      return;
    }

    const userRef = doc(db, COLLECTIONS.USERS, lawyerId);
    await updateDoc(userRef, {
      'profile.lawFirmId': newFirmId,
      'profile.lawFirmName': newFirmName,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating lawyer firm association:', error);
    throw error;
  }
};
