import { registerUser } from './auth';
import { UserCreationData, UserRole } from '@/models';

export const DEMO_ACCOUNTS = {
  admin: {
    email: 'admin@courts.gov.zm',
    password: 'admin123',
    displayName: 'System Administrator',
    role: 'admin' as UserRole,
    profile: {
      courtId: 'SC-001',
      licenseNumber: 'SA-2024-001',
      firstName: 'John',
      lastName: 'Banda',
      phone: '+260 211 123456',
      address: 'Supreme Court, Lusaka',
      specialization: 'System Administration',
      bio: 'System administrator for the Judicial Management System'
    }
  },
  judge: {
    email: 'judge@courts.gov.zm',
    password: 'judge123',
    displayName: 'Hon. Judge Mwansa',
    role: 'judge' as UserRole,
    profile: {
      courtId: 'HC-001',
      licenseNumber: 'JA-2024-001',
      firstName: 'Mary',
      lastName: 'Mwansa',
      phone: '+260 211 234567',
      address: 'High Court, Lusaka',
      specialization: 'Criminal Law',
      bio: 'High Court Judge specializing in criminal cases'
    }
  },
  lawyer: {
    email: 'lawyer@courts.gov.zm',
    password: 'lawyer123',
    displayName: 'Advocate Phiri',
    role: 'lawyer' as UserRole,
    profile: {
      courtId: 'LC-001',
      licenseNumber: 'LA-2024-001',
      firstName: 'James',
      lastName: 'Phiri',
      phone: '+260 211 345678',
      address: 'Legal Chambers, Lusaka',
      specialization: 'Civil Law',
      bio: 'Senior Advocate with expertise in civil litigation'
    }
  },
  public: {
    email: 'public@courts.gov.zm',
    password: 'public123',
    displayName: 'Public User',
    role: 'public' as UserRole,
    profile: {
      courtId: 'PC-001',
      licenseNumber: 'PU-2024-001',
      firstName: 'Sarah',
      lastName: 'Tembo',
      phone: '+260 211 456789',
      address: 'Lusaka, Zambia',
      bio: 'Member of the public with access to case information'
    }
  }
};

export const createDemoAccounts = async () => {
  const createdAccounts: any[] = [];
  
  for (const [role, accountData] of Object.entries(DEMO_ACCOUNTS)) {
    try {
      const user = await registerUser(accountData as UserCreationData);
      createdAccounts.push({ role, user, success: true });
      console.log(`Successfully created ${role} account:`, user.email);
    } catch (error) {
      console.error(`Failed to create ${role} account:`, error);
      createdAccounts.push({ role, error, success: false });
    }
  }
  
  return createdAccounts;
};

export const getDemoCredentials = (role: UserRole) => {
  return DEMO_ACCOUNTS[role];
};

export const getAllDemoCredentials = () => {
  return DEMO_ACCOUNTS;
};