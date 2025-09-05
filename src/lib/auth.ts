import { 
  auth, 
  db, 
} from '../lib/constants/firebase/config';
import { COLLECTIONS } from '../lib/constants/firebase/collections';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { User, UserCreationData, UserUpdateData, UserRole, CourtType } from '@/models';
import { demoCredentials } from '@/lib/constants/credentials';

// Court types mapping
const courtTypes = [
  { value: 'small-claims', label: 'Small Claims Court' },
  { value: 'specialized-tribunals', label: 'Specialized Tribunals' },
  { value: 'local-courts', label: 'Local Courts' },
  { value: 'subordinate-magistrate', label: 'Subordinate/Magistrate Courts' },
  { value: 'high-court', label: 'High Court' },
  { value: 'constitutional-court', label: 'Constitutional Court' },
  { value: 'supreme-court', label: 'Supreme Court' }
];




// Law firm management functions
export const createLawFirm = async (firmData: {
  name: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
}) => {
  try {
    const lawFirmRef = collection(db, COLLECTIONS.LAW_FIRMS);
    const newFirm = {
      name: firmData.name,
      address: firmData.address,
      contactEmail: firmData.contactEmail,
      contactPhone: firmData.contactPhone,
      lawyers: [],
      administrators: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    };
    
    const docRef = await addDoc(lawFirmRef, newFirm);
    return {
      id: docRef.id,
      ...newFirm,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error creating law firm:', error);
    throw error;
  }
};

export const getAllLawFirms = async () => {
  try {
    const lawFirmsRef = collection(db, COLLECTIONS.LAW_FIRMS);
    const q = query(lawFirmsRef, where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    const lawFirms: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      lawFirms.push({
        id: doc.id,
        name: data.name,
        address: data.address,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        lawyers: data.lawyers || [],
        administrators: data.administrators || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    
    return lawFirms;
  } catch (error) {
    console.error('Error fetching law firms:', error);
    throw error;
  }
};

export const getLawFirmById = async (lawFirmId: string) => {
  try {
    const lawFirmRef = doc(db, COLLECTIONS.LAW_FIRMS, lawFirmId);
    const lawFirmDoc = await getDoc(lawFirmRef);
    
    if (!lawFirmDoc.exists()) {
      throw new Error('Law firm not found');
    }
    
    const data = lawFirmDoc.data();
    return {
      id: lawFirmDoc.id,
      name: data.name,
      address: data.address,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      lawyers: data.lawyers || [],
      administrators: data.administrators || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error fetching law firm:', error);
    throw error;
  }
};

export const updateLawFirm = async (lawFirmId: string, updateData: any) => {
  try {
    const lawFirmRef = doc(db, COLLECTIONS.LAW_FIRMS, lawFirmId);
    await updateDoc(lawFirmRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    return await getLawFirmById(lawFirmId);
  } catch (error) {
    console.error('Error updating law firm:', error);
    throw error;
  }
};

export const deleteLawFirm = async (lawFirmId: string) => {
  try {
    const lawFirmRef = doc(db, COLLECTIONS.LAW_FIRMS, lawFirmId);
    
    // Soft delete - mark as inactive instead of actually deleting
    await updateDoc(lawFirmRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting law firm:', error);
    throw error;
  }
};

// User management functions
export const deleteUserAccount = async (userId: string) => {
  try {
    // First, get the Firebase user
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    // Remove user from any law firms they're associated with
    if (userData.profile?.lawFirmId) {
      await removeUserFromLawFirm(userId, userData.profile.lawFirmId);
    }
    
    // Mark user as inactive in Firestore
    await updateDoc(userRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
    
    // Note: We're not actually deleting the Firebase Auth user here
    // because it requires admin privileges and can't be done client-side
    // In a real app, you'd want to handle this through a Cloud Function
    
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Updated linkUserToLawFirm function
export const linkUserToLawFirm = async (userId: string, lawFirmId: string, role: 'lawyer' | 'admin') => {
  try {
    const lawFirmRef = doc(db, COLLECTIONS.LAW_FIRMS, lawFirmId);
    const lawFirmDoc = await getDoc(lawFirmRef);
    
    if (!lawFirmDoc.exists()) {
      throw new Error('Law firm not found');
    }
    
    const currentData = lawFirmDoc.data();
    const updateData: any = {
      updatedAt: serverTimestamp()
    };
    
    if (role === 'lawyer') {
      updateData.lawyers = [...(currentData.lawyers || []), userId];
    } else if (role === 'admin') {
      updateData.administrators = [...(currentData.administrators || []), userId];
    }
    
    await updateDoc(lawFirmRef, updateData);
    
    // Also update the user profile with the law firm ID
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      'profile.lawFirmId': lawFirmId,
      updatedAt: serverTimestamp()
    });
    
    return await getLawFirmById(lawFirmId);
  } catch (error) {
    console.error('Error linking user to law firm:', error);
    throw error;
  }
};

export const removeUserFromLawFirm = async (userId: string, lawFirmId: string) => {
  try {
    const lawFirmRef = doc(db, COLLECTIONS.LAW_FIRMS, lawFirmId);
    const lawFirmDoc = await getDoc(lawFirmRef);
    
    if (!lawFirmDoc.exists()) {
      throw new Error('Law firm not found');
    }
    
    const currentData = lawFirmDoc.data();
    const updateData: any = {
      updatedAt: serverTimestamp()
    };
    
    // Remove user from lawyers array
    if (currentData.lawyers?.includes(userId)) {
      updateData.lawyers = currentData.lawyers.filter((id: string) => id !== userId);
    }
    
    // Remove user from administrators array
    if (currentData.administrators?.includes(userId)) {
      updateData.administrators = currentData.administrators.filter((id: string) => id !== userId);
    }
    
    await updateDoc(lawFirmRef, updateData);
    
    // Also remove law firm ID from user profile
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      'profile.lawFirmId': null,
      updatedAt: serverTimestamp()
    });
    
    return await getLawFirmById(lawFirmId);
  } catch (error) {
    console.error('Error removing user from law firm:', error);
    throw error;
  }
};

// Convert Firebase user to app user
export const firebaseUserToAppUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
    
    if (!userDoc.exists()) {
      return null;
    }
    const userData = userDoc.data();
    
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || userData.displayName || '',
      role: userData.role,
      photoURL: firebaseUser.photoURL || userData.photoURL || '',
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
      isActive: userData.isActive ?? true,
      lastLoginAt: userData.lastLoginAt?.toDate(),
      profile: userData.profile
    };
  } catch (error) {
    console.error('Error converting Firebase user to app user:', error);
    return null;
  }
};

// Check if credentials match demo accounts
const isDemoCredential = (email: string, password: string): { isDemo: boolean; role?: UserRole; displayName?: string } => {
  const demoUser = demoCredentials.find(cred => cred.email === email && cred.password === password);
  if (demoUser) {
    return { 
      isDemo: true, 
      role: demoUser.role, 
      displayName: demoUser.displayName || email.split('@')[0] 
    };
  }
  return { isDemo: false };
};

// Create demo user object
const createDemoUser = (email: string, role: UserRole, displayName: string): User => {
  return {
    id: `demo-${role}-${Date.now()}`,
    email,
    displayName,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    lastLoginAt: new Date(),
    profile: getDemoProfile(role)
  };
};

// Get demo profile based on role
const getDemoProfile = (role: UserRole): any => {
  switch (role) {
    case 'judge':
      return {
        courtType: 'high-court',
        courtLocation: 'Lusaka'
      };
    case 'lawyer':
      return {
        lawFirmName: 'Demo Legal Associates',
        barNumber: 'BAR12345',
        specialization: ['Criminal Law', 'Civil Law']
      };
    case 'admin':
    case 'super-admin':
    case 'law-firm-admin':
      return {}; // Empty profile for admin roles
    default:
      return {};
  }
};

// Updated login function that handles both demo and real authentication
export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    // First check if it's a demo credential
    const demoCheck = isDemoCredential(email, password);
    
    if (demoCheck.isDemo && demoCheck.role && demoCheck.displayName) {
      // Return demo user without Firebase authentication
      const demoUser = createDemoUser(email, demoCheck.role, demoCheck.displayName);
      
      // Store demo flag in localStorage for AuthContext
      localStorage.setItem('isDemoUser', 'true');
      localStorage.setItem('demoUserData', JSON.stringify(demoUser));
      
      return demoUser;
    }
    
    // Remove demo flags if they exist
    localStorage.removeItem('isDemoUser');
    localStorage.removeItem('demoUserData');
    
    // If not demo, proceed with Firebase authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Update last login
    await updateDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    const appUser = await firebaseUserToAppUser(firebaseUser);
    if (!appUser) {
      throw new Error('User not found in database');
    }
    
    return appUser;
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

// Updated registration function
export const registerUserWithProfile = async (userData: UserCreationData): Promise<User> => {
  try {
    // Check if trying to register with demo email
    const isDemoEmail = demoCredentials.some(cred => cred.email === userData.email);
    if (isDemoEmail) {
      throw new Error('Cannot register with demo credentials. Please use a different email address.');
    }
    
    // Create Firebase auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    const firebaseUser = userCredential.user;
    
    // Update profile with display name
    await updateProfile(firebaseUser, {
      displayName: userData.displayName
    });
    
    // Create user document in Firestore
    const newUser: Omit<User, 'id'> = {
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      profile: userData.profile
    };
    
    await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
      ...newUser,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Link user to law firm if applicable
    if (userData.role === 'lawyer' && userData.profile?.lawFirmId) {
      await linkUserToLawFirm(firebaseUser.uid, userData.profile.lawFirmId, 'lawyer');
    } else if (userData.role === 'law-firm-admin' && userData.profile?.lawFirmId) {
      await linkUserToLawFirm(firebaseUser.uid, userData.profile.lawFirmId, 'admin');
    }
    
    // If it's a judge, create/update court record
    if (userData.role === 'judge') {
  await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
    ...newUser,
    profile: {
      ...userData.profile,
      assignedCases: [],
      assignedDocuments: [],
      assignedEvents: []
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}
    
    return {
      id: firebaseUser.uid,
      ...newUser
    };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Helper function to create or update court records
const createOrUpdateCourtRecord = async (userId: string, userData: UserCreationData) => {
  if (!userData.profile?.courtType) return;
  const courtId = `${userData.profile.courtType}-${userData.profile.courtLocation?.toLowerCase().replace(/\s+/g, '-')}`;
  const courtRef = doc(db, COLLECTIONS.COURTS, courtId);
  
  try {
    const courtDoc = await getDoc(courtRef);
    
    if (!courtDoc.exists()) {
      // Create new court record
      await setDoc(courtRef, {
        id: courtId,
        type: userData.profile.courtType,
        location: userData.profile.courtLocation,
        name: `${courtTypes.find(c => c.value === userData.profile?.courtType)?.label} - ${userData.profile.courtLocation}`,
        judges: userData.role === 'judge' ? [userId] : [],
        administrators: userData.role === 'admin' ? [userId] : [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      });
    } else {
      // Update existing court record
      const currentData = courtDoc.data();
      const updateData: any = {
        updatedAt: serverTimestamp()
      };
      if (userData.role === 'judge') {
        updateData.judges = [...(currentData.judges || []), userId];
      } else if (userData.role === 'admin') {
        updateData.administrators = [...(currentData.administrators || []), userId];
      }
      await updateDoc(courtRef, updateData);
    }
  } catch (error) {
    console.error('Error creating/updating court record:', error);
  }
};

// Updated logout function
// lib/auth.ts
// Update the logoutUser function
export const logoutUser = async (): Promise<void> => {
  try {
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isDemoUser');
    
    // Sign out from Firebase if it's a real user
    const isDemoUser = localStorage.getItem('isDemoUser') === 'true';
    if (!isDemoUser) {
      await signOut(auth);
    }
  } catch (error) {
    console.error('Error logging out user:', error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    // Check if it's a demo email
    const isDemoEmail = demoCredentials.some(cred => cred.email === email);
    if (isDemoEmail) {
      throw new Error('Password reset is not available for demo accounts. Demo credentials are fixed.');
    }
    
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// Updated getCurrentUser function
// lib/auth.ts
// Update the getCurrentUser function
export const getCurrentUser = async (): Promise<User | null> => {
  // Check if it's a demo user first
  const isDemoUser = localStorage.getItem('isDemoUser') === 'true';
  if (isDemoUser) {
    const demoUserData = localStorage.getItem('user');
    if (demoUserData) {
      try {
        return JSON.parse(demoUserData);
      } catch (error) {
        console.error('Error parsing demo user data:', error);
        localStorage.removeItem('isDemoUser');
        localStorage.removeItem('user');
      }
    }
  }
  
  // Check for stored user data
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
    }
  }
  
  // Otherwise, get current Firebase user
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    return null;
  }
  
  return await firebaseUserToAppUser(firebaseUser);
};

// Update user
export const updateUser = async (userId: string, updateData: UserUpdateData): Promise<void> => {
  try {
    // Check if it's a demo user
    const isDemoUser = localStorage.getItem('isDemoUser') === 'true';
    if (isDemoUser) {
      // For demo users, just update localStorage
      const demoUserData = localStorage.getItem('demoUserData');
      if (demoUserData) {
        const user = JSON.parse(demoUserData);
        const updatedUser = {
          ...user,
          ...updateData,
          updatedAt: new Date()
        };
        localStorage.setItem('demoUserData', JSON.stringify(updatedUser));
      }
      return;
    }
    
    const updatePayload: any = {
      ...updateData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), updatePayload);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Get users by role
export const getUsersByRole = async (role: UserRole): Promise<User[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('role', '==', role),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        photoURL: data.photoURL,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isActive: data.isActive,
        lastLoginAt: data.lastLoginAt?.toDate(),
        profile: data.profile
      });
    });
    
    return users;
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
};

// Get users by law firm
export const getUsersByLawFirm = async (lawFirmId: string): Promise<User[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('profile.lawFirmId', '==', lawFirmId),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        photoURL: data.photoURL,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isActive: data.isActive,
        lastLoginAt: data.lastLoginAt?.toDate(),
        profile: data.profile
      });
    });
    
    return users;
  } catch (error) {
    console.error('Error getting users by law firm:', error);
    throw error;
  }
};



// Court management functions
export const createCourt = async (courtData: {
  type: CourtType;
  location: string;
  name: string;
  description?: string;
}) => {
  try {
    const courtId = `${courtData.type}-${courtData.location.toLowerCase().replace(/\s+/g, '-')}`;
    const courtRef = doc(db, COLLECTIONS.COURTS, courtId);
    
    const newCourt = {
      id: courtId,
      type: courtData.type,
      location: courtData.location,
      name: courtData.name,
      description: courtData.description || '',
      judges: [],
      administrators: [],
      cases: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    };
    
    await setDoc(courtRef, newCourt);
    return {
      ...newCourt,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error creating court:', error);
    throw error;
  }
};

export const getAllCourts = async () => {
  try {
    const courtsRef = collection(db, COLLECTIONS.COURTS);
    const q = query(courtsRef, where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    const courts: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      courts.push({
        id: doc.id,
        name: data.name,
        type: data.type,
        location: data.location,
        description: data.description,
        judges: data.judges || [],
        administrators: data.administrators || [],
        cases: data.cases || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    
    return courts;
  } catch (error) {
    console.error('Error fetching courts:', error);
    throw error;
  }
};

export const getCourtById = async (courtId: string) => {
  try {
    const courtRef = doc(db, COLLECTIONS.COURTS, courtId);
    const courtDoc = await getDoc(courtRef);
    
    if (!courtDoc.exists()) {
      throw new Error('Court not found');
    }
    
    const data = courtDoc.data();
    return {
      id: courtDoc.id,
      name: data.name,
      type: data.type,
      location: data.location,
      description: data.description,
      judges: data.judges || [],
      administrators: data.administrators || [],
      cases: data.cases || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error fetching court:', error);
    throw error;
  }
};

export const updateCourt = async (courtId: string, updateData: any) => {
  try {
    const courtRef = doc(db, COLLECTIONS.COURTS, courtId);
    await updateDoc(courtRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    return await getCourtById(courtId);
  } catch (error) {
    console.error('Error updating court:', error);
    throw error;
  }
};

export const deleteCourt = async (courtId: string) => {
  try {
    const courtRef = doc(db, COLLECTIONS.COURTS, courtId);
    
    // Soft delete - mark as inactive instead of actually deleting
    await updateDoc(courtRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting court:', error);
    throw error;
  }
};

export const assignJudgeToCourt = async (courtId: string, judgeId: string) => {
  try {
    const courtRef = doc(db, COLLECTIONS.COURTS, courtId);
    const courtDoc = await getDoc(courtRef);
    
    if (!courtDoc.exists()) {
      throw new Error('Court not found');
    }
    
    const currentData = courtDoc.data();
    const judges = currentData.judges || [];
    
    if (!judges.includes(judgeId)) {
      await updateDoc(courtRef, {
        judges: [...judges, judgeId],
        updatedAt: serverTimestamp()
      });
    }
    
    // Also update the user's profile with the court information
    const userRef = doc(db, COLLECTIONS.USERS, judgeId);
    await updateDoc(userRef, {
      'profile.courtId': courtId,
      updatedAt: serverTimestamp()
    });
    
    return await getCourtById(courtId);
  } catch (error) {
    console.error('Error assigning judge to court:', error);
    throw error;
  }
};

export const removeJudgeFromCourt = async (courtId: string, judgeId: string) => {
  try {
    const courtRef = doc(db, COLLECTIONS.COURTS, courtId);
    const courtDoc = await getDoc(courtRef);
    
    if (!courtDoc.exists()) {
      throw new Error('Court not found');
    }
    
    const currentData = courtDoc.data();
    const judges = currentData.judges || [];
    
    if (judges.includes(judgeId)) {
      await updateDoc(courtRef, {
        judges: judges.filter(id => id !== judgeId),
        updatedAt: serverTimestamp()
      });
    }
    
    // Also remove court ID from user's profile
    const userRef = doc(db, COLLECTIONS.USERS, judgeId);
    await updateDoc(userRef, {
      'profile.courtId': null,
      updatedAt: serverTimestamp()
    });
    
    return await getCourtById(courtId);
  } catch (error) {
    console.error('Error removing judge from court:', error);
    throw error;
  }
};

// Case management functions
// lib/auth.ts
// Update the createCase function
export const createCase = async (caseData: {
  title: string;
  description: string;
  type: 'civil' | 'criminal' | 'family' | 'commercial' | 'constitutional' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  plaintiffs: Omit<CaseParty, 'id'>[];
  defendants: Omit<CaseParty, 'id'>[];
  lawyers?: Omit<CaseLawyer, 'id' | 'assignedAt' | 'isActive'>[];
  estimatedDuration?: number;
  tags?: string[];
  courtId: string;
  createdBy: string;
}) => {
  try {
    const casesRef = collection(db, COLLECTIONS.CASES);
    
    // Generate a unique case number
    const caseNumber = `CV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Create new case object
    const newCase: Omit<Case, 'id'> = {
      caseNumber,
      title: caseData.title,
      description: caseData.description,
      type: caseData.type,
      status: 'filed', // Initial status
      priority: caseData.priority,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: caseData.createdBy,
      plaintiffs: caseData.plaintiffs.map(p => ({
        ...p,
        id: `party-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })),
      defendants: caseData.defendants.map(d => ({
        ...d,
        id: `party-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })),
      lawyers: caseData.lawyers?.map(l => ({
        ...l,
        id: `lawyer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assignedAt: new Date(),
        isActive: true
      })) || [],
      hearings: [],
      documents: [],
      rulings: [],
      tags: caseData.tags || [],
      estimatedDuration: caseData.estimatedDuration,
      statusHistory: [{
        id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        caseId: '', // Will be set after document creation
        previousStatus: undefined,
        newStatus: 'filed',
        changedBy: caseData.createdBy,
        changedAt: new Date(),
        status: 'filed',
        notes: 'Case filed'
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
    const docRef = await addDoc(casesRef, {
      ...newCase,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
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
    
    // Add case to court
    const courtRef = doc(db, COLLECTIONS.COURTS, caseData.courtId);
    const courtDoc = await getDoc(courtRef);
    
    if (courtDoc.exists()) {
      const currentData = courtDoc.data();
      const cases = currentData.cases || [];
      
      await updateDoc(courtRef, {
        cases: [...cases, docRef.id],
        updatedAt: serverTimestamp()
      });
    }
    
    return {
      id: docRef.id,
      ...updatedCase
    };
  } catch (error) {
    console.error('Error creating case:', error);
    throw error;
  }
};


export const getCasesByCourt = async (courtId: string) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.CASES),
      where('courtId', '==', courtId),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const cases: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      cases.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        filingDate: data.filingDate?.toDate() || new Date()
      });
    });
    
    return cases;
  } catch (error) {
    console.error('Error fetching cases by court:', error);
    throw error;
  }
};

// Update the assignCaseToJudge function to store document references
export const assignCaseToJudge = async (caseId: string, judgeId: string) => {
  try {
    const caseRef = doc(db, COLLECTIONS.CASES, caseId);
    const judgeRef = doc(db, COLLECTIONS.USERS, judgeId);
    
    // Update the case with judge ID
    await updateDoc(caseRef, {
      judgeId,
      updatedAt: serverTimestamp()
    });
    
    // Update the judge's profile with a reference to the case
    const judgeDoc = await getDoc(judgeRef);
    if (judgeDoc.exists()) {
      const currentData = judgeDoc.data();
      const assignedCases = currentData.profile?.assignedCases || [];
      
      // Check if case is already assigned
      const caseExists = assignedCases.some((ref: any) => ref.id === caseId);
      
      if (!caseExists) {
        await updateDoc(judgeRef, {
          'profile.assignedCases': [...assignedCases, caseRef],
          updatedAt: serverTimestamp()
        });
      }
    }
    
    return await getCaseById(caseId);
  } catch (error) {
    console.error('Error assigning case to judge:', error);
    throw error;
  }
};


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
      updatedAt: data.updatedAt?.toDate() || new Date(),
      filingDate: data.filingDate?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error fetching case:', error);
    throw error;
  }
};

// Update the createCalendarEvent function to ensure it properly stores the judge's UID when provided
//updayte the createCalendarEvent function to store document references
export const createCalendarEvent = async (eventData: {
  title: string;
  description: string;
  courtId: string;
  judgeId?: string;
  caseId?: string;
  startTime: Date;
  endTime: Date;
  location: string;
  eventType: 'hearing' | 'trial' | 'meeting' | 'other';
}) => {
  try {
    const eventsRef = collection(db, COLLECTIONS.CALENDAR_EVENTS);
    const newEvent = {
      ...eventData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    };
    
    const docRef = await addDoc(eventsRef, newEvent);
    
    // If a judge is assigned, update the judge's profile with a reference to the event
    if (eventData.judgeId) {
      const judgeRef = doc(db, COLLECTIONS.USERS, eventData.judgeId);
      const judgeDoc = await getDoc(judgeRef);
      
      if (judgeDoc.exists()) {
        const currentData = judgeDoc.data();
        const assignedEvents = currentData.profile?.assignedEvents || [];
        
        // Check if event is already assigned
        const eventExists = assignedEvents.some((ref: any) => ref.id === docRef.id);
        
        if (!eventExists) {
          await updateDoc(judgeRef, {
            'profile.assignedEvents': [...assignedEvents, docRef],
            updatedAt: serverTimestamp()
          });
        }
      }
    }
    
    return {
      id: docRef.id,
      ...newEvent,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

// Add a function to get or create a court
export const getOrCreateCourt = async (courtType: string, courtLocation: string) => {
  try {
    // Generate court ID
    const courtId = `${courtType}-${courtLocation.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Try to get the court
    const courtRef = doc(db, COLLECTIONS.COURTS, courtId);
    const courtDoc = await getDoc(courtRef);
    
    if (courtDoc.exists()) {
      // Court exists, return it
      const data = courtDoc.data();
      return {
        id: courtId,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    } else {
      // Court doesn't exist, create it
      const courtName = `${courtTypes.find(c => c.value === courtType)?.label || courtType} - ${courtLocation}`;
      
      const newCourt = {
        id: courtId,
        type: courtType,
        location: courtLocation,
        name: courtName,
        judges: [],
        administrators: [],
        cases: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };
      
      await setDoc(courtRef, newCourt);
      
      return {
        ...newCourt,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  } catch (error) {
    console.error('Error getting or creating court:', error);
    throw error;
  }
};


// Add a function to assign documents to judges
export const assignDocumentToJudge = async (documentId: string, judgeId: string) => {
  try {
    const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    const judgeRef = doc(db, COLLECTIONS.USERS, judgeId);
    
    // Update the document with judge ID
    await updateDoc(docRef, {
      judgeId,
      updatedAt: serverTimestamp()
    });
    
    // Update the judge's profile with a reference to the document
    const judgeDoc = await getDoc(judgeRef);
    if (judgeDoc.exists()) {
      const currentData = judgeDoc.data();
      const assignedDocuments = currentData.profile?.assignedDocuments || [];
      
      // Check if document is already assigned
      const docExists = assignedDocuments.some((ref: any) => ref.id === documentId);
      
      if (!docExists) {
        await updateDoc(judgeRef, {
          'profile.assignedDocuments': [...assignedDocuments, docRef],
          updatedAt: serverTimestamp()
        });
      }
    }
    
    return await getDocumentById(documentId);
  } catch (error) {
    console.error('Error assigning document to judge:', error);
    throw error;
  }
};

// Helper function to get document by ID
const getDocumentById = async (documentId: string) => {
  try {
    const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    const docSnapshot = await getDoc(docRef);
    
    if (!docSnapshot.exists()) {
      throw new Error('Document not found');
    }
    
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      uploadDate: data.uploadDate?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
};

//judge functions start here====================================================================================//
export const getCalendarEventsByCourt = async (courtId: string) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.CALENDAR_EVENTS),
      where('courtId', '==', courtId),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const events: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    
    return events;
  } catch (error) {
    console.error('Error fetching calendar events by court:', error);
    throw error;
  }
};


// New function to get cases by judge - using document references
export const getCasesByJudge = async (judgeId: string) => {
  try {
    // First get the judge's document to retrieve assigned case references
    const judgeRef = doc(db, COLLECTIONS.USERS, judgeId);
    const judgeDoc = await getDoc(judgeRef);
    
    if (!judgeDoc.exists()) {
      throw new Error('Judge not found');
    }
    
    const judgeData = judgeDoc.data();
    const assignedCases = judgeData.profile?.assignedCases || [];
    
    if (assignedCases.length === 0) {
      return [];
    }
    
    // Fetch each case document individually
    const cases: any[] = [];
    for (const caseRef of assignedCases) {
      const caseSnapshot = await getDoc(caseRef);
      if (caseSnapshot.exists() && caseSnapshot.data().isActive) {
        const data = caseSnapshot.data();
        cases.push({
          id: caseSnapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          filingDate: data.filingDate?.toDate() || new Date()
        });
      }
    }
    
    return cases;
  } catch (error) {
    console.error('Error fetching cases by judge:', error);
    throw error;
  }
};

// New function to get documents by judge - using document references
export const getDocumentsByJudge = async (judgeId: string) => {
  try {
    // First get the judge's document to retrieve assigned document references
    const judgeRef = doc(db, COLLECTIONS.USERS, judgeId);
    const judgeDoc = await getDoc(judgeRef);
    
    if (!judgeDoc.exists()) {
      throw new Error('Judge not found');
    }
    
    const judgeData = judgeDoc.data();
    const assignedDocuments = judgeData.profile?.assignedDocuments || [];
    
    if (assignedDocuments.length === 0) {
      return [];
    }
    
    // Fetch each document individually
    const documents: any[] = [];
    for (const docRef of assignedDocuments) {
      const docSnapshot = await getDoc(docRef);
      if (docSnapshot.exists() && docSnapshot.data().isActive) {
        const data = docSnapshot.data();
        documents.push({
          id: docSnapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          uploadDate: data.uploadDate?.toDate() || new Date()
        });
      }
    }
    
    return documents;
  } catch (error) {    
    console.error('Error fetching documents by judge:', error);
    throw error;
  }
};

// New function to get calendar events by judge - using document references
export const getCalendarEventsByJudge = async (judgeId: string) => {
  try {
    // First get the judge's document to retrieve assigned event references
    const judgeRef = doc(db, COLLECTIONS.USERS, judgeId);
    const judgeDoc = await getDoc(judgeRef);
    
    if (!judgeDoc.exists()) {
      throw new Error('Judge not found');
    }
    
    const judgeData = judgeDoc.data();
    const assignedEvents = judgeData.profile?.assignedEvents || [];
    
    if (assignedEvents.length === 0) {
      return [];
    }
    
    // Fetch each event individually
    const events: any[] = [];
    for (const eventRef of assignedEvents) {
      const eventSnapshot = await getDoc(eventRef);
      if (eventSnapshot.exists() && eventSnapshot.data().isActive) {
        const data = eventSnapshot.data();
        events.push({
          id: eventSnapshot.id,
          ...data,
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      }
    }
    
    return events;
  } catch (error) {
    console.error('Error fetching calendar events by judge:', error);
    throw error;
  }
};


//===========================//judge functions end here //=================================================//



// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    // First check for demo user
    const isDemoUser = localStorage.getItem('isDemoUser') === 'true';
    if (isDemoUser) {
      const demoUserData = localStorage.getItem('demoUserData');
      if (demoUserData) {
        try {
          const user = JSON.parse(demoUserData);
          callback(user);
          return;
        } catch (error) {
          console.error('Error parsing demo user data:', error);
          localStorage.removeItem('isDemoUser');
          localStorage.removeItem('demoUserData');
        }
      }
    }
    
    if (firebaseUser) {
      const appUser = await firebaseUserToAppUser(firebaseUser);
      callback(appUser);
    } else {
      callback(null);
    }
  });
};
