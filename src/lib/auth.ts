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
  updateProfile
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
  serverTimestamp
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
      await createOrUpdateCourtRecord(firebaseUser.uid, userData);
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
export const logoutUser = async (): Promise<void> => {
  try {
    // Check if it's a demo user
    const isDemoUser = localStorage.getItem('isDemoUser') === 'true';
    
    if (isDemoUser) {
      // Just clear localStorage for demo users
      localStorage.removeItem('isDemoUser');
      localStorage.removeItem('demoUserData');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
    } else {
      // Sign out from Firebase for real users
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
export const getCurrentUser = async (): Promise<User | null> => {
  // Check if it's a demo user first
  const isDemoUser = localStorage.getItem('isDemoUser') === 'true';
  if (isDemoUser) {
    const demoUserData = localStorage.getItem('demoUserData');
    if (demoUserData) {
      try {
        return JSON.parse(demoUserData);
      } catch (error) {
        console.error('Error parsing demo user data:', error);
        localStorage.removeItem('isDemoUser');
        localStorage.removeItem('demoUserData');
      }
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
