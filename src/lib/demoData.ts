import { User, UserRole, Case, CaseStatus, CasePriority, CaseType } from '@/models';

// Demo user accounts
export const demoUsers: (User & { password: string })[] = [
  {
    id: 'demo-admin-001',
    email: 'admin@courts.gov.zm',
    password: 'admin123',
    displayName: 'System Administrator',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true,
    profile: {
      firstName: 'John',
      lastName: 'Banda',
      phone: '+260-211-123456',
      address: 'Judicial Headquarters, Lusaka',
      specialization: 'System Administration',
      bio: 'System Administrator for the Judicial Management System'
    }
  },
  {
    id: 'demo-judge-001',
    email: 'judge@courts.gov.zm',
    password: 'judge123',
    displayName: 'Honorable Judge Mwansa',
    role: 'judge',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true,
    profile: {
      firstName: 'Mary',
      lastName: 'Mwansa',
      phone: '+260-211-234567',
      address: 'High Court, Lusaka',
      specialization: 'Criminal Law',
      courtId: 'HC-001',
      bio: 'High Court Judge with 15 years of experience'
    }
  },
  {
    id: 'demo-judge-002',
    email: 'judge2@courts.gov.zm',
    password: 'judge123',
    displayName: 'Honorable Judge Phiri',
    role: 'judge',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true,
    profile: {
      firstName: 'James',
      lastName: 'Phiri',
      phone: '+260-211-345678',
      address: 'High Court, Ndola',
      specialization: 'Civil Law',
      courtId: 'HC-002',
      bio: 'High Court Judge specializing in civil litigation'
    }
  },
  {
    id: 'demo-lawyer-001',
    email: 'lawyer@courts.gov.zm',
    password: 'lawyer123',
    displayName: 'Legal Practitioner Tembo',
    role: 'lawyer',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true,
    profile: {
      firstName: 'Sarah',
      lastName: 'Tembo',
      phone: '+260-211-456789',
      address: 'Tembo & Associates, Lusaka',
      specialization: 'Corporate Law',
      licenseNumber: 'LP-001-2024',
      bio: 'Senior Partner at Tembo & Associates'
    }
  },
  {
    id: 'demo-lawyer-002',
    email: 'lawyer2@courts.gov.zm',
    password: 'lawyer123',
    displayName: 'Legal Practitioner Chileshe',
    role: 'lawyer',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true,
    profile: {
      firstName: 'David',
      lastName: 'Chileshe',
      phone: '+260-211-567890',
      address: 'Chileshe Law Firm, Kitwe',
      specialization: 'Family Law',
      licenseNumber: 'LP-002-2024',
      bio: 'Family law practitioner with 10 years of experience'
    }
  },
  {
    id: 'demo-public-001',
    email: 'public@courts.gov.zm',
    password: 'public123',
    displayName: 'Public User',
    role: 'public',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true,
    profile: {
      firstName: 'Public',
      lastName: 'User',
      phone: '+260-211-987654',
      address: 'Lusaka, Zambia',
      bio: 'General public user accessing court information'
    }
  }
];

// Demo cases
export const demoCases: Case[] = [
  {
    id: 'demo-case-001',
    caseNumber: 'CV-2024-001',
    title: 'Smith vs. Johnson - Contract Dispute',
    description: 'Breach of contract case involving failure to deliver goods as per agreement.',
    type: 'civil',
    status: 'active',
    priority: 'high',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'demo-admin-001',
    assignedTo: 'demo-judge-001',
    plaintiffs: [
      {
        id: 'party-001',
        name: 'John Smith',
        type: 'individual',
        contactInfo: {
          email: 'john.smith@email.com',
          phone: '+260-977-123456',
          address: 'Lusaka, Zambia'
        }
      }
    ],
    defendants: [
      {
        id: 'party-002',
        name: 'ABC Corporation',
        type: 'organization',
        contactInfo: {
          email: 'legal@abccorp.com',
          phone: '+260-211-111111',
          address: 'Lusaka, Zambia'
        },
        representative: 'demo-lawyer-001'
      }
    ],
    lawyers: [
      {
        id: 'lawyer-001',
        userId: 'demo-lawyer-001',
        role: 'plaintiff',
        assignedAt: new Date('2024-01-16'),
        isActive: true
      }
    ],
    hearings: [
      {
        id: 'hearing-001',
        caseId: 'demo-case-001',
        date: new Date('2024-02-01'),
        startTime: '09:00',
        endTime: '11:00',
        location: 'Courtroom 1, High Court Lusaka',
        judgeId: 'demo-judge-001',
        purpose: 'Initial hearing and case management conference',
        status: 'scheduled'
      }
    ],
    documents: [
      {
        id: 'doc-001',
        caseId: 'demo-case-001',
        name: 'Contract Agreement.pdf',
        type: 'pdf',
        size: 2450000,
        uploadedBy: 'demo-lawyer-001',
        uploadedAt: new Date('2024-01-16'),
        url: '/cases/demo-case-001/documents/contract.pdf',
        category: 'evidence',
        isConfidential: false,
        description: 'Original contract agreement between parties',
        tags: ['contract', 'evidence', 'plaintiff']
      }
    ],
    rulings: [],
    tags: ['contract', 'breach', 'civil', 'commercial'],
    estimatedDuration: 90,
    nextHearingDate: new Date('2024-02-01')
  },
  {
    id: 'demo-case-002',
    caseNumber: 'CR-2024-002',
    title: 'State vs. Banda - Theft Case',
    description: 'Criminal case involving theft of company property.',
    type: 'criminal',
    status: 'pending',
    priority: 'urgent',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-25'),
    createdBy: 'demo-admin-001',
    assignedTo: 'demo-judge-002',
    plaintiffs: [
      {
        id: 'party-003',
        name: 'The State',
        type: 'organization',
        contactInfo: {
          email: 'director@npa.gov.zm',
          phone: '+260-211-222222',
          address: 'National Prosecutions Authority, Lusaka'
        }
      }
    ],
    defendants: [
      {
        id: 'party-004',
        name: 'Joseph Banda',
        type: 'individual',
        contactInfo: {
          email: 'joseph.banda@email.com',
          phone: '+260-977-234567',
          address: 'Kitwe, Zambia'
        },
        representative: 'demo-lawyer-002'
      }
    ],
    lawyers: [
      {
        id: 'lawyer-002',
        userId: 'demo-lawyer-002',
        role: 'defendant',
        assignedAt: new Date('2024-01-21'),
        isActive: true
      }
    ],
    hearings: [
      {
        id: 'hearing-002',
        caseId: 'demo-case-002',
        date: new Date('2024-02-01'),
        startTime: '14:00',
        endTime: '16:00',
        location: 'Courtroom 2, High Court Ndola',
        judgeId: 'demo-judge-002',
        purpose: 'Plea and bail application',
        status: 'scheduled'
      }
    ],
    documents: [
      {
        id: 'doc-002',
        caseId: 'demo-case-002',
        name: 'Police Report.pdf',
        type: 'pdf',
        size: 1200000,
        uploadedBy: 'demo-admin-001',
        uploadedAt: new Date('2024-01-20'),
        url: '/cases/demo-case-002/documents/police-report.pdf',
        category: 'evidence',
        isConfidential: false,
        description: 'Police investigation report',
        tags: ['police', 'report', 'evidence']
      }
    ],
    rulings: [],
    tags: ['theft', 'criminal', 'state', 'urgent'],
    estimatedDuration: 60,
    nextHearingDate: new Date('2024-02-01')
  },
  {
    id: 'demo-case-003',
    caseNumber: 'FA-2024-003',
    title: 'Chileshe vs. Chileshe - Divorce Proceedings',
    description: 'Divorce case involving custody of minor children and property division.',
    type: 'family',
    status: 'active',
    priority: 'medium',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-30'),
    createdBy: 'demo-admin-001',
    assignedTo: 'demo-judge-001',
    plaintiffs: [
      {
        id: 'party-005',
        name: 'Mary Chileshe',
        type: 'individual',
        contactInfo: {
          email: 'mary.chileshe@email.com',
          phone: '+260-977-345678',
          address: 'Lusaka, Zambia'
        },
        representative: 'demo-lawyer-001'
      }
    ],
    defendants: [
      {
        id: 'party-006',
        name: 'David Chileshe',
        type: 'individual',
        contactInfo: {
          email: 'david.chileshe@email.com',
          phone: '+260-977-456789',
          address: 'Lusaka, Zambia'
        },
        representative: 'demo-lawyer-002'
      }
    ],
    lawyers: [
      {
        id: 'lawyer-003',
        userId: 'demo-lawyer-001',
        role: 'plaintiff',
        assignedAt: new Date('2024-01-26'),
        isActive: true
      },
      {
        id: 'lawyer-004',
        userId: 'demo-lawyer-002',
        role: 'defendant',
        assignedAt: new Date('2024-01-27'),
        isActive: true
      }
    ],
    hearings: [
      {
        id: 'hearing-003',
        caseId: 'demo-case-003',
        date: new Date('2024-02-02'),
        startTime: '10:30',
        endTime: '12:30',
        location: 'Courtroom 3, High Court Lusaka',
        judgeId: 'demo-judge-001',
        purpose: 'Mediation session',
        status: 'scheduled'
      }
    ],
    documents: [
      {
        id: 'doc-003',
        caseId: 'demo-case-003',
        name: 'Marriage Certificate.pdf',
        type: 'pdf',
        size: 890000,
        uploadedBy: 'demo-lawyer-001',
        uploadedAt: new Date('2024-01-26'),
        url: '/cases/demo-case-003/documents/marriage-certificate.pdf',
        category: 'evidence',
        isConfidential: true,
        description: 'Original marriage certificate',
        tags: ['marriage', 'certificate', 'confidential']
      }
    ],
    rulings: [],
    tags: ['divorce', 'custody', 'family', 'property'],
    estimatedDuration: 120,
    nextHearingDate: new Date('2024-02-02')
  }
];

// Function to initialize demo data
export const initializeDemoData = async () => {
  // This function would be used to populate Firebase with demo data
  // In a real implementation, this would be called once during setup
  
  console.log('Demo data initialized successfully');
  console.log('Demo users:', demoUsers.length);
  console.log('Demo cases:', demoCases.length);
  
  return {
    users: demoUsers,
    cases: demoCases
  };
};

// Demo credentials helper
export const getDemoCredentials = () => {
  return {
    admin: { email: 'admin@courts.gov.zm', password: 'admin123' },
    judge: { email: 'judge@courts.gov.zm', password: 'judge123' },
    lawyer: { email: 'lawyer@courts.gov.zm', password: 'lawyer123' },
    public: { email: 'public@courts.gov.zm', password: 'public123' }
  };
};