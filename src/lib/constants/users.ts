// Mock data for demonstration
export const users = [
    {
        id: '1',
        name: 'John Banda',
        email: 'john.banda@courts.gov.zm',
        role: 'judge',
        isActive: true,
        lastLogin: '2024-01-30',
        specialization: 'Criminal Law'
    },
    {
        id: '2',
        name: 'Mary Mwansa',
        email: 'mary.mwansa@courts.gov.zm',
        role: 'lawyer',
        isActive: true,
        lastLogin: '2024-01-29',
        specialization: 'Civil Law'
    },
    {
        id: '3',
        name: 'James Phiri',
        email: 'james.phiri@courts.gov.zm',
        role: 'admin',
        isActive: true,
        lastLogin: '2024-01-28',
        specialization: 'System Administration'
    },
    {
        id: '4',
        name: 'Sarah Tembo',
        email: 'sarah.tembo@courts.gov.zm',
        role: 'lawyer',
        isActive: false,
        lastLogin: '2024-01-15',
        specialization: 'Family Law'
    }
];

export function getUserByRole(role: string) {
    return users.find(user => user.role === role);
}