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
        // Check for existing user (demo or Firebase)
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setUserRole(currentUser.role);
          setIsDemoUser(localStorage.getItem('isDemoUser') === 'true');
          
          // Store user info for easy access
          localStorage.setItem('userRole', currentUser.role);
          localStorage.setItem('userName', currentUser.displayName);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initialize auth state
    initializeAuth();

    // Set up Firebase auth state listener (only for non-demo users)
    let unsubscribe: (() => void) | undefined;
    
    if (auth && localStorage.getItem('isDemoUser') !== 'true') {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser && localStorage.getItem('isDemoUser') !== 'true') {
          try {
            const appUser = await firebaseUserToAppUser(firebaseUser);
            if (appUser) {
              setUser(appUser);
              setUserRole(appUser.role);
              setIsDemoUser(false);
              
              // Store in localStorage for easy access
              localStorage.setItem('userRole', appUser.role);
              localStorage.setItem('userName', appUser.displayName);
            }
          } catch (error) {
            console.error('Error converting Firebase user:', error);
            handleAuthError();
          }
        } else if (!firebaseUser && localStorage.getItem('isDemoUser') !== 'true') {
          // Only clear state if it's not a demo user
          handleAuthError();
        }
        
        if (!loading) {
          setLoading(false);
        }
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loading]);

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
      await logoutUser();
      
      setUser(null);
      setUserRole(null);
      setIsDemoUser(false);
      
      // Clear all auth-related localStorage items
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('isDemoUser');
      localStorage.removeItem('demoUserData');
      
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
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
