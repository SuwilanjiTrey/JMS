// lib/middleware/auth.ts
import { NextRequest } from 'next/server';
import { auth } from '@/lib/constants/firebase/config';
import { User } from '@/models';

export async function authenticateRequest(request: NextRequest): Promise<{ user: User | null, error?: string }> {
  try {
    console.log('Authenticating request');
    
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header');
      return { user: null, error: 'Authentication required' };
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('Token:', token);
    
    // Handle demo token
    if (token === 'demo-token') {
      console.log('Using demo token');
      
      // For demo users, get user data from a custom header or use a default demo user
      const demoUserData = request.headers.get('x-demo-user');
      
      if (demoUserData) {
        try {
          const user = JSON.parse(decodeURIComponent(demoUserData));
          console.log('Demo user from header:', user);
          return { user };
        } catch (e) {
          console.error('Error parsing demo user data:', e);
        }
      }
      
      // Default demo user if no header provided
      console.log('Using default demo user');
      return { 
        user: {
          id: 'demo-user',
          email: 'demo@example.com',
          displayName: 'Demo User',
          role: 'admin',
          profile: {
            adminType: 'registrar',
            courtType: 'subordinate-magistrate',
            courtLocation: 'Lusaka'
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        } as User
      };
    }

    // For real Firebase users, verify the token
    console.log('Verifying Firebase token');
    const decodedToken = await auth.verifyIdToken(token);
    console.log('Firebase token decoded:', decodedToken.uid);
    
    return { 
      user: {
        id: decodedToken.uid,
        email: decodedToken.email || '',
        displayName: decodedToken.name || '',
        role: decodedToken.role as any,
        profile: decodedToken.profile || {},
        createdAt: new Date(decodedToken.iat * 1000),
        updatedAt: new Date(),
        isActive: true,
      } as User
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error: 'Invalid token' };
  }
}
