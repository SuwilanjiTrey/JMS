// File: components/exports/RegistrationForm.tsx - Reusable registration form component

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Scale, Building, Users } from 'lucide-react';
import { UserRole, CourtType } from '@/models';

interface RegistrationFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ 
  onSubmit, 
  isLoading 
}) => {
  const [activeTab, setActiveTab] = useState('judge');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'judge' as UserRole,
    // Judge fields
    courtType: '',
    courtLocation: '',
    // Lawyer fields
    lawFirmName: '',
    barNumber: '',
    specialization: [] as string[],
    // Admin fields
    adminType: ''
  });

  const courtTypes = [
    { value: 'small-claims', label: 'Small Claims Court' },
    { value: 'specialized-tribunals', label: 'Specialized Tribunals' },
    { value: 'local-courts', label: 'Local Courts' },
    { value: 'subordinate-magistrate', label: 'Subordinate/Magistrate Courts' },
    { value: 'high-court', label: 'High Court' },
    { value: 'constitutional-court', label: 'Constitutional Court' },
    { value: 'supreme-court', label: 'Supreme Court' }
  ];

  const specializations = [
    'Criminal Law', 'Civil Law', 'Family Law', 'Commercial Law', 
    'Constitutional Law', 'Labour Law', 'Tax Law', 'Environmental Law'
  ];

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    // Role-specific validation
    if (formData.role === 'judge' && (!formData.courtType || !formData.courtLocation)) {
      alert('Court type and location are required for judges');
      return;
    }

    if (formData.role === 'lawyer' && (!formData.lawFirmName || !formData.barNumber)) {
      alert('Law firm name and bar number are required for lawyers');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        setFormData(prev => ({ ...prev, role: value as UserRole }));
      }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="judge" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Judge
          </TabsTrigger>
          <TabsTrigger value="lawyer" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Lawyer
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Admin
          </TabsTrigger>
        </TabsList>

        <div className="space-y-4 mt-6">
          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter first name"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter password (min 6 characters)"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Role-specific Fields */}
          <TabsContent value="judge" className="space-y-4 mt-0">
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Judge Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="courtType">Court Type *</Label>
                  <Select onValueChange={(value) => handleInputChange('courtType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select court type" />
                    </SelectTrigger>
                    <SelectContent>
                      {courtTypes.map(court => (
                        <SelectItem key={court.value} value={court.value}>
                          {court.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="courtLocation">Court Location *</Label>
                  <Input
                    id="courtLocation"
                    value={formData.courtLocation}
                    onChange={(e) => handleInputChange('courtLocation', e.target.value)}
                    placeholder="Enter court location (e.g., Lusaka, Kitwe)"
                    required
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="lawyer" className="space-y-4 mt-0">
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Lawyer Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="lawFirmName">Law Firm Name *</Label>
                  <Input
                    id="lawFirmName"
                    value={formData.lawFirmName}
                    onChange={(e) => handleInputChange('lawFirmName', e.target.value)}
                    placeholder="Enter law firm name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="barNumber">Bar Registration Number *</Label>
                  <Input
                    id="barNumber"
                    value={formData.barNumber}
                    onChange={(e) => handleInputChange('barNumber', e.target.value)}
                    placeholder="Enter bar registration number"
                    required
                  />
                </div>

                <div>
                  <Label>Areas of Specialization</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {specializations.map(spec => (
                      <Button
                        key={spec}
                        type="button"
                        variant={formData.specialization.includes(spec) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const current = formData.specialization;
                          const updated = current.includes(spec)
                            ? current.filter(s => s !== spec)
                            : [...current, spec];
                          handleInputChange('specialization', updated);
                        }}
                      >
                        {spec}
                      </Button>
                    ))}
                  </div>
                  {formData.specialization.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.specialization.map(spec => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-4 mt-0">
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Administrator Information</h3>
              <div>
                <Label htmlFor="adminType">Administrative Role</Label>
                <Select onValueChange={(value) => handleInputChange('adminType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select administrative role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super-admin">System Administrator</SelectItem>
                    {courtTypes.map(court => (
                      <SelectItem key={court.value} value={court.value}>
                        {court.label} Administrator
                      </SelectItem>
                    ))}
                    <SelectItem value="law-firm-admin">Law Firm Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <div className="border-t pt-4">
            <Button
              onClick={handleSubmit}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : `Register ${activeTab === 'judge' ? 'Judge' : activeTab === 'lawyer' ? 'Lawyer' : 'Administrator'}`}
            </Button>
          </div>
        </div>
      </Tabs>
    </div>
  );
};
