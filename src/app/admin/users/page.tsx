'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus, Eye, EyeOff } from 'lucide-react';
import { users as initialUsers } from '@/lib/constants/users';
import { DEMO_ACCOUNTS } from '@/lib/demoAccounts';

export default function AdminUsers() {
  // Merge users with demo account data
  const enrichedUsers = initialUsers.map(user => {
    const demoAccount = Object.values(DEMO_ACCOUNTS).find(demo =>
      demo.email === user.email ||
      demo.profile.firstName + ' ' + demo.profile.lastName === user.name
    );

    if (demoAccount) {
      return {
        ...user,
        displayName: demoAccount.displayName,
        password: demoAccount.password,
        profile: {
          firstName: demoAccount.profile.firstName,
          lastName: demoAccount.profile.lastName,
          phone: demoAccount.profile.phone || '',
          address: demoAccount.profile.address || '',
          specialization: user.specialization,
          bio: demoAccount.profile.bio || '',
          courtId: demoAccount.profile.courtId || '',
          licenseNumber: demoAccount.profile.licenseNumber || ''
        }
      };
    }

    return {
      ...user,
      displayName: user.name,
      password: 'default123',
      profile: {
        firstName: user.name.split(' ')[0] || '',
        lastName: user.name.split(' ').slice(1).join(' ') || '',
        phone: '',
        address: '',
        specialization: user.specialization,
        bio: '',
        courtId: '',
        licenseNumber: ''
      }
    };
  });

  const [users, setUsers] = useState(enrichedUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'public',
    displayName: '',
    password: '',
    isActive: true,
    profile: {
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      specialization: '',
      bio: '',
      courtId: '',
      licenseNumber: ''
    }
  });

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.profile.specialization.toLowerCase().includes(searchLower) ||
      user.displayName.toLowerCase().includes(searchLower) ||
      user.profile.firstName.toLowerCase().includes(searchLower) ||
      user.profile.lastName.toLowerCase().includes(searchLower) ||
      user.profile.phone.toLowerCase().includes(searchLower);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role) => {
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

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      password: user.password,
      isActive: user.isActive,
      profile: { ...user.profile }
    });
    setIsEditModalOpen(true);
  };

  const openAddModal = () => {
    setEditForm({
      name: '',
      email: '',
      role: 'public',
      displayName: '',
      password: '',
      isActive: true,
      profile: {
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        specialization: '',
        bio: '',
        courtId: '',
        licenseNumber: ''
      }
    });
    setIsAddModalOpen(true);
  };

  const closeModals = () => {
    setIsEditModalOpen(false);
    setIsAddModalOpen(false);
    setSelectedUser(null);
    setShowPassword(false);
  };

  const handleSaveUser = () => {
    const userData = {
      ...editForm,
      name: `${editForm.profile.firstName} ${editForm.profile.lastName}`.trim() || editForm.name,
      specialization: editForm.profile.specialization
    };

    if (selectedUser) {
      // Edit existing user
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === selectedUser.id
            ? {
              ...user,
              ...userData,
              lastLogin: user.lastLogin // Keep original last login
            }
            : user
        )
      );
    } else {
      // Add new user
      const newUser = {
        id: (Math.max(...users.map(u => parseInt(u.id))) + 1).toString(),
        ...userData,
        lastLogin: 'Never'
      };
      setUsers(prevUsers => [...prevUsers, newUser]);
    }
    closeModals();
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    }
  };

  const toggleUserStatus = (userId) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId
          ? { ...user, isActive: !user.isActive }
          : user
      )
    );
  };

  const handleFormChange = (field, value) => {
    if (field.startsWith('profile.')) {
      const profileField = field.replace('profile.', '');
      setEditForm(prev => ({
        ...prev,
        profile: { ...prev.profile, [profileField]: value }
      }));
    } else {
      setEditForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const isFormValid = editForm.profile.firstName.trim() &&
    editForm.profile.lastName.trim() &&
    editForm.email.trim() &&
    editForm.profile.specialization.trim();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zambia-black">User Management</h1>
          <p className="text-zambia-black/70">Manage users and their detailed profiles</p>
        </div>
        <Button
          className="bg-orange-600 hover:bg-orange-700"
          onClick={openAddModal}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border">
        <Input
          placeholder="Search users by name, email, phone, or specialization..."
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

      {/* Results count */}
      <div className="text-sm text-zambia-black/70">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{user.displayName}</CardTitle>
                  <CardDescription className="text-xs text-gray-500">
                    {user.profile.firstName} {user.profile.lastName}
                  </CardDescription>
                </div>
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
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Specialization:</span>
                  <span className="font-medium">{user.profile.specialization}</span>
                </div>
                {user.profile.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{user.profile.phone}</span>
                  </div>
                )}
                {user.profile.courtId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Court ID:</span>
                    <span className="font-medium">{user.profile.courtId}</span>
                  </div>
                )}
                {user.profile.licenseNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">License:</span>
                    <span className="font-medium">{user.profile.licenseNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Login:</span>
                  <span className="font-medium">{user.lastLogin}</span>
                </div>
                {user.profile.bio && (
                  <div className="pt-2">
                    <span className="text-gray-600 text-xs">Bio:</span>
                    <p className="text-xs text-gray-700 mt-1 line-clamp-2">{user.profile.bio}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => openEditModal(user)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => toggleUserStatus(user.id)}
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zambia-black/70">No users found matching your criteria</p>
        </div>
      )}

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zambia-black border-b pb-2">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input
                    id="edit-firstName"
                    value={editForm.profile.firstName}
                    onChange={(e) => handleFormChange('profile.firstName', e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input
                    id="edit-lastName"
                    value={editForm.profile.lastName}
                    onChange={(e) => handleFormChange('profile.lastName', e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-displayName">Display Name</Label>
                <Input
                  id="edit-displayName"
                  value={editForm.displayName}
                  onChange={(e) => handleFormChange('displayName', e.target.value)}
                  placeholder="Enter display name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">Password</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showPassword ? "text" : "password"}
                    value={editForm.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                    placeholder="Enter password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editForm.role} onValueChange={(value) => handleFormChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="judge">Judge</SelectItem>
                    <SelectItem value="lawyer">Lawyer</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={editForm.isActive}
                  onCheckedChange={(checked) => handleFormChange('isActive', checked)}
                />
                <Label htmlFor="edit-active">Active User</Label>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zambia-black border-b pb-2">Contact Information</h3>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={editForm.profile.phone}
                  onChange={(e) => handleFormChange('profile.phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  value={editForm.profile.address}
                  onChange={(e) => handleFormChange('profile.address', e.target.value)}
                  placeholder="Enter address"
                  rows={2}
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zambia-black border-b pb-2">Professional Information</h3>

              <div className="space-y-2">
                <Label htmlFor="edit-specialization">Specialization</Label>
                <Input
                  id="edit-specialization"
                  value={editForm.profile.specialization}
                  onChange={(e) => handleFormChange('profile.specialization', e.target.value)}
                  placeholder="Enter specialization area"
                />
              </div>

              {editForm.role === 'judge' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-courtId">Court ID</Label>
                  <Input
                    id="edit-courtId"
                    value={editForm.profile.courtId}
                    onChange={(e) => handleFormChange('profile.courtId', e.target.value)}
                    placeholder="Enter court identifier"
                  />
                </div>
              )}

              {editForm.role === 'lawyer' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-licenseNumber">License Number</Label>
                  <Input
                    id="edit-licenseNumber"
                    value={editForm.profile.licenseNumber}
                    onChange={(e) => handleFormChange('profile.licenseNumber', e.target.value)}
                    placeholder="Enter license number"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-bio">Biography</Label>
                <Textarea
                  id="edit-bio"
                  value={editForm.profile.bio}
                  onChange={(e) => handleFormChange('profile.bio', e.target.value)}
                  placeholder="Enter professional biography"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={closeModals}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={!isFormValid}
              className="bg-zambia-orange hover:bg-zambia-orange/90"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zambia-black border-b pb-2">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-firstName">First Name</Label>
                  <Input
                    id="add-firstName"
                    value={editForm.profile.firstName}
                    onChange={(e) => handleFormChange('profile.firstName', e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-lastName">Last Name</Label>
                  <Input
                    id="add-lastName"
                    value={editForm.profile.lastName}
                    onChange={(e) => handleFormChange('profile.lastName', e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-displayName">Display Name</Label>
                <Input
                  id="add-displayName"
                  value={editForm.displayName}
                  onChange={(e) => handleFormChange('displayName', e.target.value)}
                  placeholder="Enter display name (e.g., Hon. Judge Smith)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-email">Email Address</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-password">Initial Password</Label>
                <div className="relative">
                  <Input
                    id="add-password"
                    type={showPassword ? "text" : "password"}
                    value={editForm.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                    placeholder="Enter initial password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-role">Role</Label>
                <Select value={editForm.role} onValueChange={(value) => handleFormChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="judge">Judge</SelectItem>
                    <SelectItem value="lawyer">Lawyer</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="add-active"
                  checked={editForm.isActive}
                  onCheckedChange={(checked) => handleFormChange('isActive', checked)}
                />
                <Label htmlFor="add-active">Active User</Label>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zambia-black border-b pb-2">Contact Information</h3>

              <div className="space-y-2">
                <Label htmlFor="add-phone">Phone Number</Label>
                <Input
                  id="add-phone"
                  value={editForm.profile.phone}
                  onChange={(e) => handleFormChange('profile.phone', e.target.value)}
                  placeholder="Enter phone number (e.g., +260 211 123456)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-address">Address</Label>
                <Textarea
                  id="add-address"
                  value={editForm.profile.address}
                  onChange={(e) => handleFormChange('profile.address', e.target.value)}
                  placeholder="Enter address"
                  rows={2}
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zambia-black border-b pb-2">Professional Information</h3>

              <div className="space-y-2">
                <Label htmlFor="add-specialization">Specialization</Label>
                <Input
                  id="add-specialization"
                  value={editForm.profile.specialization}
                  onChange={(e) => handleFormChange('profile.specialization', e.target.value)}
                  placeholder="Enter area of specialization"
                />
              </div>

              {editForm.role === 'judge' && (
                <div className="space-y-2">
                  <Label htmlFor="add-courtId">Court ID</Label>
                  <Input
                    id="add-courtId"
                    value={editForm.profile.courtId}
                    onChange={(e) => handleFormChange('profile.courtId', e.target.value)}
                    placeholder="Enter court identifier (e.g., HC-001)"
                  />
                </div>
              )}

              {editForm.role === 'lawyer' && (
                <div className="space-y-2">
                  <Label htmlFor="add-licenseNumber">License Number</Label>
                  <Input
                    id="add-licenseNumber"
                    value={editForm.profile.licenseNumber}
                    onChange={(e) => handleFormChange('profile.licenseNumber', e.target.value)}
                    placeholder="Enter license number (e.g., LA-2024-001)"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="add-bio">Professional Biography</Label>
                <Textarea
                  id="add-bio"
                  value={editForm.profile.bio}
                  onChange={(e) => handleFormChange('profile.bio', e.target.value)}
                  placeholder="Enter professional background and expertise"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={closeModals}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={!isFormValid}
              className="bg-green-600 hover:bg-green-700"
            >
              {selectedUser ? 'Save Changes' : 'Add User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}