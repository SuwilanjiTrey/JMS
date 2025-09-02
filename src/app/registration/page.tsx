'use client';
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gavel, Users, Building, Scale, Eye, EyeOff, AlertCircle } from 'lucide-react';

// Types
type UserRole = 'admin' | 'judge' | 'lawyer';
type CourtType = 
  | 'small-claims' 
  | 'specialized-tribunals' 
  | 'local-courts' 
  | 'subordinate-magistrate' 
  | 'high-court' 
  | 'constitutional-court' 
  | 'supreme-court';

interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  // Judge specific
  courtType?: CourtType;
  courtLocation?: string;
  // Law firm specific
  lawFirmName?: string;
  barNumber?: string;
  specialization?: string[];
}

const RegistrationSystem = () => {
  // UI State - only essential states
  const [activeTab, setActiveTab] = useState<UserRole>('judge');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  
  // Form refs - uncontrolled inputs
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const courtTypeRef = useRef<HTMLSelectElement>(null);
  const courtLocationRef = useRef<HTMLInputElement>(null);
  const lawFirmNameRef = useRef<HTMLInputElement>(null);
  const barNumberRef = useRef<HTMLInputElement>(null);
  const adminTypeRef = useRef<HTMLSelectElement>(null);

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

  // Toggle password visibility using DOM manipulation (no React state)
  const togglePasswordVisibility = (inputRef: React.RefObject<HTMLInputElement>) => {
    if (inputRef.current) {
      const input = inputRef.current;
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  };

  // Toggle specialization selection
  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations(prev => 
      prev.includes(spec) 
        ? prev.filter(s => s !== spec)
        : [...prev, spec]
    );
  };

  // Collect form data from refs
  const getFormData = (): RegistrationFormData => {
    return {
      firstName: firstNameRef.current?.value || '',
      lastName: lastNameRef.current?.value || '',
      email: emailRef.current?.value || '',
      password: passwordRef.current?.value || '',
      confirmPassword: confirmPasswordRef.current?.value || '',
      role: activeTab,
      courtType: activeTab === 'judge' ? courtTypeRef.current?.value : 
                activeTab === 'admin' ? adminTypeRef.current?.value : undefined,
      courtLocation: activeTab === 'judge' ? courtLocationRef.current?.value : undefined,
      lawFirmName: activeTab === 'lawyer' ? lawFirmNameRef.current?.value : undefined,
      barNumber: activeTab === 'lawyer' ? barNumberRef.current?.value : undefined,
      specialization: activeTab === 'lawyer' ? selectedSpecializations : undefined,
    };
  };

  // Reset form
  const resetForm = () => {
    if (firstNameRef.current) firstNameRef.current.value = '';
    if (lastNameRef.current) lastNameRef.current.value = '';
    if (emailRef.current) emailRef.current.value = '';
    if (passwordRef.current) {
      passwordRef.current.value = '';
      passwordRef.current.type = 'password'; // Reset to password type
    }
    if (confirmPasswordRef.current) {
      confirmPasswordRef.current.value = '';
      confirmPasswordRef.current.type = 'password'; // Reset to password type
    }
    if (courtTypeRef.current) courtTypeRef.current.value = '';
    if (courtLocationRef.current) courtLocationRef.current.value = '';
    if (lawFirmNameRef.current) lawFirmNameRef.current.value = '';
    if (barNumberRef.current) barNumberRef.current.value = '';
    if (adminTypeRef.current) adminTypeRef.current.value = '';
    setSelectedSpecializations([]);
    setErrors({});
  };

  // Validate form
  const validateForm = (data: RegistrationFormData): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Common validations
    if (!data.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!data.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!data.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = 'Please enter a valid email';
    
    if (!data.password) newErrors.password = 'Password is required';
    else if (data.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (!data.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (data.password !== data.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    // Role-specific validations
    if (data.role === 'judge') {
      if (!data.courtType) newErrors.courtType = 'Court type is required';
      if (!data.courtLocation?.trim()) newErrors.courtLocation = 'Court location is required';
    } else if (data.role === 'lawyer') {
      if (!data.lawFirmName?.trim()) newErrors.lawFirmName = 'Law firm name is required';
      if (!data.barNumber?.trim()) newErrors.barNumber = 'Bar registration number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get form data from refs
    const formData = getFormData();
    
    // Validate form
    if (!validateForm(formData)) return;
    
    setIsLoading(true);
    try {
      // Generate display name from first and last name
      const displayName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // Here you would call your registerUser function
      console.log('Registration data:', { ...formData, displayName });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`${activeTab} registered successfully!`);
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Common form fields
  const CommonFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            ref={firstNameRef}
            type="text"
            placeholder="Enter first name"
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && (
            <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
              <AlertCircle className="h-3 w-3" />
              {errors.firstName}
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="lastName">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            ref={lastNameRef}
            type="text"
            placeholder="Enter last name"
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && (
            <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
              <AlertCircle className="h-3 w-3" />
              {errors.lastName}
            </div>
          )}
        </div>
      </div>
      
      <div>
        <Label htmlFor="email">
          Email Address <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          ref={emailRef}
          type="email"
          placeholder="Enter email address"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
            <AlertCircle className="h-3 w-3" />
            {errors.email}
          </div>
        )}
      </div>
      
      <div>
        <Label htmlFor="password">
          Password <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="password"
            ref={passwordRef}
            type="password"
            placeholder="Enter password (min 6 characters)"
            className={errors.password ? 'border-red-500' : ''}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => togglePasswordVisibility(passwordRef)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
        {errors.password && (
          <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
            <AlertCircle className="h-3 w-3" />
            {errors.password}
          </div>
        )}
      </div>
      
      <div>
        <Label htmlFor="confirmPassword">
          Confirm Password <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            ref={confirmPasswordRef}
            type="password"
            placeholder="Confirm password"
            className={errors.confirmPassword ? 'border-red-500' : ''}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => togglePasswordVisibility(confirmPasswordRef)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
        {errors.confirmPassword && (
          <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
            <AlertCircle className="h-3 w-3" />
            {errors.confirmPassword}
          </div>
        )}
      </div>
    </>
  );

  // Judge-specific fields
  const JudgeFields = () => (
    <>
      <div>
        <Label htmlFor="courtType">
          Court Type <span className="text-red-500">*</span>
        </Label>
        <select 
          id="courtType"
          ref={courtTypeRef}
          className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.courtType ? 'border-red-500' : ''}`}
        >
          <option value="">Select court type</option>
          {courtTypes.map(court => (
            <option key={court.value} value={court.value}>
              {court.label}
            </option>
          ))}
        </select>
        {errors.courtType && (
          <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
            <AlertCircle className="h-3 w-3" />
            {errors.courtType}
          </div>
        )}
      </div>
      
      <div>
        <Label htmlFor="courtLocation">
          Court Location <span className="text-red-500">*</span>
        </Label>
        <Input
          id="courtLocation"
          ref={courtLocationRef}
          type="text"
          placeholder="Enter court location (e.g., Lusaka, Kitwe)"
          className={errors.courtLocation ? 'border-red-500' : ''}
        />
        {errors.courtLocation && (
          <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
            <AlertCircle className="h-3 w-3" />
            {errors.courtLocation}
          </div>
        )}
      </div>
    </>
  );

  // Lawyer-specific fields
  const LawyerFields = () => (
    <>
      <div>
        <Label htmlFor="lawFirmName">
          Law Firm Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="lawFirmName"
          ref={lawFirmNameRef}
          type="text"
          placeholder="Enter law firm name"
          className={errors.lawFirmName ? 'border-red-500' : ''}
        />
        {errors.lawFirmName && (
          <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
            <AlertCircle className="h-3 w-3" />
            {errors.lawFirmName}
          </div>
        )}
      </div>
      
      <div>
        <Label htmlFor="barNumber">
          Bar Registration Number <span className="text-red-500">*</span>
        </Label>
        <Input
          id="barNumber"
          ref={barNumberRef}
          type="text"
          placeholder="Enter bar registration number"
          className={errors.barNumber ? 'border-red-500' : ''}
        />
        {errors.barNumber && (
          <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
            <AlertCircle className="h-3 w-3" />
            {errors.barNumber}
          </div>
        )}
      </div>
      
      <div>
        <Label htmlFor="specialization">Areas of Specialization</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {specializations.map(spec => (
            <Button
              key={spec}
              type="button"
              variant={selectedSpecializations.includes(spec) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSpecialization(spec)}
            >
              {spec}
            </Button>
          ))}
        </div>
        {selectedSpecializations.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedSpecializations.map(spec => (
              <Badge key={spec} variant="secondary" className="text-xs">
                {spec}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </>
  );

  // Admin-specific fields
  const AdminFields = () => (
    <div>
      <Label htmlFor="adminType">Administrative Role</Label>
      <select 
        id="adminType"
        ref={adminTypeRef}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Select administrative role</option>
        <option value="super-admin">System Administrator</option>
        {courtTypes.map(court => (
          <option key={court.value} value={court.value}>
            {court.label} Administrator
          </option>
        ))}
        <option value="law-firm-admin">Law Firm Administrator</option>
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center relative">
          <div className="absolute top-0 right-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/login'}
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              Back to Login
            </Button>
          </div>
          <div className="flex items-center justify-center mb-4">
            <Gavel className="h-12 w-12 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-orange-600">User Registration</h1>
          <p className="text-green-600 mt-2">Judicial Management System - Republic of Zambia</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Register New User
            </CardTitle>
            <CardDescription>
              Select user type and complete registration form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Tabs value={activeTab} onValueChange={(value) => {
                setActiveTab(value as UserRole);
                setErrors({});
              }}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="judge" className="flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Judges
                  </TabsTrigger>
                  <TabsTrigger value="lawyer" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Lawyers
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Administrators
                  </TabsTrigger>
                </TabsList>
                
                <div className="space-y-4 mt-6">
                  <CommonFields />
                  
                  {activeTab === 'judge' && (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-4 text-orange-600">Judge Information</h3>
                      <JudgeFields />
                    </div>
                  )}
                  
                  {activeTab === 'lawyer' && (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-4 text-orange-600">Lawyer Information</h3>
                      <LawyerFields />
                    </div>
                  )}
                  
                  {activeTab === 'admin' && (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-4 text-orange-600">Administrator Information</h3>
                      <AdminFields />
                    </div>
                  )}
                  
                  <div className="border-t pt-4 space-y-3">
                    <Button
                      type="submit"
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating Account...' : `Register ${activeTab === 'judge' ? 'Judge' : activeTab === 'lawyer' ? 'Lawyer' : 'Administrator'}`}
                    </Button>
                    
                    <div className="text-center text-sm text-gray-600">
                      Already have an account?{' '}
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-orange-600 hover:text-orange-700"
                        onClick={() => window.location.href = '/login'}
                      >
                        Sign in here
                      </Button>
                    </div>
                  </div>
                </div>
              </Tabs>
            </form>
          </CardContent>
        </Card>
        
        {/* Registration Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registration Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                <div>
                  <strong>Judges:</strong> Will be assigned to specific courts based on their level and jurisdiction
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                <div>
                  <strong>Lawyers:</strong> Will be associated with their respective law firms and can handle cases
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                <div>
                  <strong>Administrators:</strong> Will manage their designated court systems or law firms
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationSystem;
