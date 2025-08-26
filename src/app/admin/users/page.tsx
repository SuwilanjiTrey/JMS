'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Mock data for demonstration
  const users = [
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-zambia-orange text-white';
      case 'judge':
        return 'bg-zambia-green text-white';
      case 'lawyer':
        return 'bg-blue-100 text-blue-800';
      case 'public':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zambia-black">User Management</h1>
          <p className="text-zambia-black/70">Manage users and their roles</p>
        </div>
        <Button className="bg-zambia-orange hover:bg-zambia-orange/90">
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border">
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="judge">Judge</SelectItem>
            <SelectItem value="lawyer">Lawyer</SelectItem>
            <SelectItem value="public">Public</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{user.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role}
                  </Badge>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Specialization:</span>
                  <span className="text-sm font-medium">{user.specialization}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Login:</span>
                  <span className="text-sm font-medium">{user.lastLogin}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1">
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}