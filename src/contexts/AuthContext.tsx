'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/constants/firebase/config';
import { User, UserRole } from '@/models';
import { firebaseUserToAppUser } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase auth is not available, skip authentication setup
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const appUser = await firebaseUserToAppUser(firebaseUser);
          if (appUser) {
            setUser(appUser);
            setUserRole(appUser.role);
            // Store in localStorage for easy access (in real app, use secure storage)
            localStorage.setItem('userRole', appUser.role);
            localStorage.setItem('userName', appUser.displayName);
          }
        } catch (error) {
          console.error('Error converting Firebase user:', error);
          setUser(null);
          setUserRole(null);
          localStorage.removeItem('userRole');
          localStorage.removeItem('userName');
        }
      } else {
        setUser(null);
        setUserRole(null);
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    // For demo purposes, set a mock user
    const mockUser = {
      id: '1',
      email,
      displayName: 'Demo User',
      role: 'admin' as UserRole,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    setUser(mockUser);
    setUserRole(mockUser.role);
    localStorage.setItem('userRole', mockUser.role);
    localStorage.setItem('userName', mockUser.displayName);
  };

  const logout = async () => {
    if (auth) {
      await auth.signOut();
    }
    setUser(null);
    setUserRole(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
  };

  const register = async (userData: any) => {
    // This will be implemented with the actual register function
    console.log('Register:', userData);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, login, logout, register }}>
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