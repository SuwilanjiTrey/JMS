'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/constants/firebase/config';
import { User, UserRole } from '@/models';
import { 
  firebaseUserToAppUser, 
  loginUser, 
  logoutUser, 
  registerUserWithProfile,
  getCurrentUser 
} from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  isDemoUser: boolean;
  login: (email: string, password: string) => Promise<User>; // 👈 return User
  logout: () => Promise<void>;
  register: (userData: any) => Promise<User>; // 👈 also return User
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

useEffect(() => {
  const initializeAuth = async () => {
    try {
      setUser(null);
      setUserRole(null);
      setIsDemoUser(false);

      const isDemo = localStorage.getItem('isDemoUser') === 'true';
      
      if (isDemo) {
        const demoData = localStorage.getItem('demoUserData');
        if (demoData) {
          const parsedUser = JSON.parse(demoData);
          setUser(parsedUser);
          setUserRole(parsedUser.role);
          setIsDemoUser(true);
          localStorage.setItem('userRole', parsedUser.role);
          localStorage.setItem('userName', parsedUser.displayName);
        } else {
          localStorage.removeItem('isDemoUser');
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      localStorage.removeItem('isDemoUser');
      localStorage.removeItem('demoUserData');
    } finally {
      setLoading(false);
    }
  };

  initializeAuth();

  let unsubscribe: (() => void) | undefined;

  if (auth && localStorage.getItem('isDemoUser') !== 'true') {
    unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const isDemoNow = localStorage.getItem('isDemoUser') === 'true';
      if (isDemoNow) return;

      if (firebaseUser) {
        try {
          const appUser = await firebaseUserToAppUser(firebaseUser);
          if (appUser) {
            setUser(appUser);
            setUserRole(appUser.role);
            setIsDemoUser(false);
            localStorage.setItem('userRole', appUser.role);
            localStorage.setItem('userName', appUser.displayName);
            if (appUser.profile?.adminType) {
              localStorage.setItem('adminType', appUser.profile.adminType);
            }
          }
        } catch (error) {
          console.error('Error converting Firebase user:', error);
          handleAuthError();
        }
      } else {
        handleAuthError();
      }
    });
  }

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}, []); // 👈 Empty dependency array

  const handleAuthError = () => {
    setUser(null);
    setUserRole(null);
    setIsDemoUser(false);
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('isDemoUser');
    localStorage.removeItem('demoUserData');
  };

const login = async (email: string, password: string): Promise<User> => {
  try {
    setLoading(true);
    const loggedInUser = await loginUser(email, password);

    setUser(loggedInUser);
    setUserRole(loggedInUser.role);
    setIsDemoUser(localStorage.getItem('isDemoUser') === 'true');

    // Store user info
    localStorage.setItem('userRole', loggedInUser.role);
    localStorage.setItem('userName', loggedInUser.displayName);
    if (loggedInUser.profile?.adminType) {
      localStorage.setItem('adminType', loggedInUser.profile.adminType);
    }

    return loggedInUser; // 👈 return the user object
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};


const logout = async () => {
  try {
    setLoading(true);

    // Call your existing logout logic
    await logoutUser(); // This already handles demo vs Firebase

    // Manually clear all possible auth traces
    setUser(null);
    setUserRole(null);
    setIsDemoUser(false);

    // Wipe localStorage completely for auth
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('isDemoUser');
    localStorage.removeItem('demoUserData');
    localStorage.removeItem('adminType'); // if you added this

    // Optional: Clear sessionStorage too, just in case
    sessionStorage.clear();

    console.log('Logout complete - localStorage cleared');
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear state even if error
    setUser(null);
    setUserRole(null);
    setIsDemoUser(false);
    localStorage.clear(); // Nuclear option (optional)
  } finally {
    setLoading(false);
  }
};

const register = async (userData: any): Promise<User> => {
  try {
    setLoading(true);
    const newUser = await registerUserWithProfile(userData);

    setUser(newUser);
    setUserRole(newUser.role);
    setIsDemoUser(false);

    // Store user info
    localStorage.setItem('userRole', newUser.role);
    localStorage.setItem('userName', newUser.displayName);
    if (newUser.profile?.adminType) {
      localStorage.setItem('adminType', newUser.profile.adminType);
    }

    return newUser; // 👈 return the new user
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRole, 
      loading, 
      isDemoUser,
      login, 
      logout, 
      register 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
