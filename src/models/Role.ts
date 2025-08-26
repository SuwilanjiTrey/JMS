export type UserRole = 'admin' | 'judge' | 'lawyer' | 'public';

export interface Role {
  id: string;
  name: UserRole;
  permissions: Permission[];
  description: string;
}

export type Permission = 
  | 'read:cases'
  | 'write:cases'
  | 'delete:cases'
  | 'assign:cases'
  | 'update:rulings'
  | 'manage:users'
  | 'manage:calendar'
  | 'upload:documents'
  | 'read:documents'
  | 'summarize:documents'
  | 'search:cases';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'read:cases',
    'write:cases',
    'delete:cases',
    'assign:cases',
    'update:rulings',
    'manage:users',
    'manage:calendar',
    'upload:documents',
    'read:documents',
    'summarize:documents',
    'search:cases'
  ],
  judge: [
    'read:cases',
    'write:cases',
    'update:rulings',
    'manage:calendar',
    'upload:documents',
    'read:documents',
    'summarize:documents',
    'search:cases'
  ],
  lawyer: [
    'read:cases',
    'write:cases',
    'upload:documents',
    'read:documents',
    'summarize:documents',
    'search:cases'
  ],
  public: [
    'read:cases',
    'search:cases'
  ]
};

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role].includes(permission);
};