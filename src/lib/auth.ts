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
  collection 
} from 'firebase/firestore';
import { User, UserCreationData, UserUpdateData, UserRole, CourtType } from '@/models';


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

// Update the registerUser function to handle the new profile structure
export const registerUserWithProfile = async (userData: UserCreationData): Promise<User> => {
  try {
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
    
    // Create user document in Firestore with enhanced profile
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
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // If it's a court admin or judge, also create/update court record
    if (userData.role === 'judge' || (userData.role === 'admin' && userData.profile?.adminType !== 'super-admin')) {
      await createOrUpdateCourtRecord(firebaseUser.uid, userData);
    }

    // If it's a lawyer, create/update law firm record
    if (userData.role === 'lawyer' && userData.profile?.lawFirmName) {
      await createOrUpdateLawFirmRecord(firebaseUser.uid, userData);
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
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      });
    } else {
      // Update existing court record
      const currentData = courtDoc.data();
      const updateData: any = {
        updatedAt: new Date()
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

// Helper function to create or update law firm records
const createOrUpdateLawFirmRecord = async (userId: string, userData: UserCreationData) => {
  if (!userData.profile?.lawFirmName) return;

  const lawFirmId = userData.profile.lawFirmName.toLowerCase().replace(/\s+/g, '-');
  const lawFirmRef = doc(db, COLLECTIONS.LAW_FIRMS, lawFirmId);
  
  try {
    const lawFirmDoc = await getDoc(lawFirmRef);
    
    if (!lawFirmDoc.exists()) {
      // Create new law firm record
      await setDoc(lawFirmRef, {
        id: lawFirmId,
        name: userData.profile.lawFirmName,
        lawyers: [userId],
        administrators: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      });
    } else {
      // Update existing law firm record
      const currentData = lawFirmDoc.data();
      await updateDoc(lawFirmRef, {
        lawyers: [...(currentData.lawyers || []), userId],
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error creating/updating law firm record:', error);
  }
};

// Login user
export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Update last login
    await updateDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
      lastLoginAt: new Date(),
      updatedAt: new Date()
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

// Logout user
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out user:', error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    return null;
  }
  
  return await firebaseUserToAppUser(firebaseUser);
};

// Update user
export const updateUser = async (userId: string, updateData: UserUpdateData): Promise<void> => {
  try {
    const updatePayload: any = {
      ...updateData,
      updatedAt: new Date()
    };
    
    // Convert Date objects to Firestore timestamps
    if (updatePayload.updatedAt) {
      updatePayload.updatedAt = new Date();
    }
    
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

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const appUser = await firebaseUserToAppUser(firebaseUser);
      callback(appUser);
    } else {
      callback(null);
    }
  });
};
