'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Gavel, Users, Building, Scale, Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, CourtType } from '@/models';
import { demoCredentials } from '@/lib/constants/credentials';
import { 
  getAllLawFirms, 
  createLawFirm, 
  getLawFirmById 
} from '@/lib/auth';

// Types
interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  adminType?: string;
  lawFirmId?: string;
  newLawFirm?: {
    name: string;
    address: string;
    contactEmail: string;
    contactPhone: string;
  };
  // Judge specific
  courtType?: CourtType;
  courtLocation?: string;
  // Law firm specific
  barNumber?: string;
  specialization?: string[];
}

const RegistrationSystem = () => {
  // UI State
  const [activeTab, setActiveTab] = useState<UserRole>('judge');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [lawFirms, setLawFirms] = useState<any[]>([]);
  const [lawFirmOption, setLawFirmOption] = useState<'new' | 'existing'>('new');
  const [selectedLawFirmId, setSelectedLawFirmId] = useState<string>('');
  const [newLawFirm, setNewLawFirm] = useState({
    name: '',
    address: '',
    contactEmail: '',
    contactPhone: ''
  });
  const [isLoadingLawFirms, setIsLoadingLawFirms] = useState(false);
  const [selectedAdminType, setSelectedAdminType] = useState<string>('');

  // Add this function to fetch law firms
  const fetchLawFirms = async () => {
    setIsLoadingLawFirms(true);
    try {
      const firms = await getAllLawFirms();
      setLawFirms(firms);
    } catch (error) {
      console.error('Error fetching law firms:', error);
      setError('Failed to load law firms. Please try again.');
    } finally {
      setIsLoadingLawFirms(false);
    }
  };

  // Add this useEffect to fetch law firms when component mounts
  useEffect(() => {
    fetchLawFirms();
  }, []);
  
  const { register } = useAuth();
  const router = useRouter();
  
  // Form refs - uncontrolled inputs
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const courtTypeRef = useRef<HTMLSelectElement>(null);
  const courtLocationRef = useRef<HTMLInputElement>(null);
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

  // Toggle password visibility using DOM manipulation
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
    adminType: selectedAdminType, // Use state instead of ref
    courtType: activeTab === 'judge' ? (courtTypeRef.current?.value as CourtType) : undefined,
    courtLocation: activeTab === 'judge' ? courtLocationRef.current?.value : undefined,
    lawFirmId: selectedLawFirmId || undefined,
    barNumber: activeTab === 'lawyer' ? barNumberRef.current?.value : undefined,
    specialization: activeTab === 'lawyer' ? selectedSpecializations : undefined,
    newLawFirm: lawFirmOption === 'new' ? newLawFirm : undefined,
  };
};

  // Reset form
  const resetForm = () => {
    if (firstNameRef.current) firstNameRef.current.value = '';
    if (lastNameRef.current) lastNameRef.current.value = '';
    if (emailRef.current) emailRef.current.value = '';
    if (passwordRef.current) {
      passwordRef.current.value = '';
      passwordRef.current.type = 'password';
    }
    if (confirmPasswordRef.current) {
      confirmPasswordRef.current.value = '';
      confirmPasswordRef.current.type = 'password';
    }
    if (courtTypeRef.current) courtTypeRef.current.value = '';
    if (courtLocationRef.current) courtLocationRef.current.value = '';
    if (barNumberRef.current) barNumberRef.current.value = '';
    if (adminTypeRef.current) adminTypeRef.current.value = '';
    setSelectedSpecializations([]);
    setErrors({});
    setError('');
    setSuccess(false);
  };

  // Validate form
  const validateForm = (data: RegistrationFormData): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Check if trying to register with demo email
    const isDemoEmail = demoCredentials.some(cred => cred.email === data.email);
    if (isDemoEmail) {
      newErrors.email = 'Cannot register with demo credentials. Please use a different email address.';
    }
    
    // Common validations
    if (!data.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!data.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!data.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(data.email) && !newErrors.email) newErrors.email = 'Please enter a valid email';
    
    if (!data.password) newErrors.password = 'Password is required';
    else if (data.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (!data.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (data.password !== data.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    // Role-specific validations
    if (data.role === 'judge') {
      if (!data.courtType) newErrors.courtType = 'Court type is required';
      if (!data.courtLocation?.trim()) newErrors.courtLocation = 'Court location is required';
    } else if (data.role === 'lawyer') {
      if (!data.lawFirmId) newErrors.lawFirm = 'Please select a law firm';
      if (!data.barNumber?.trim()) newErrors.barNumber = 'Bar registration number is required';
    } else if (data.role === 'admin' && data.adminType === 'law-firm-admin') {
      if (lawFirmOption === 'new') {
        if (!data.newLawFirm?.name?.trim()) newErrors.lawFirmName = 'Law firm name is required';
        if (!data.newLawFirm?.address?.trim()) newErrors.lawFirmAddress = 'Address is required';
        if (!data.newLawFirm?.contactEmail?.trim()) newErrors.lawFirmEmail = 'Contact email is required';
        if (!data.newLawFirm?.contactPhone?.trim()) newErrors.lawFirmPhone = 'Contact phone is required';
      } else {
        if (!data.lawFirmId) newErrors.existingLawFirm = 'Please select a law firm';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = getFormData();
    
    if (!validateForm(formData)) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const displayName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // Simplified role handling
      let role = formData.role;
      if (role === 'admin' && formData.adminType) {
        role = formData.adminType as UserRole;
      }
      
      // Handle law firm creation if needed
      let lawFirmId = formData.lawFirmId;
      if (role === 'law-firm-admin' && lawFirmOption === 'new') {
        // Create new law firm
        const newFirm = await createLawFirmHandler(formData.newLawFirm!);
        lawFirmId = newFirm.id;
      }
      
      // Create profile based on role
      let profile: any = {};
      
      if (role === 'judge') {
        profile = {
          courtType: formData.courtType,
          courtLocation: formData.courtLocation
        };
      } else if (role === 'lawyer') {
        profile = {
          lawFirmId,
          barNumber: formData.barNumber,
          specialization: formData.specialization || []
        };
      } else if (role === 'law-firm-admin') {
        profile = {
          lawFirmId
        };
      }
      
      // Prepare user creation data
      const userData = {
        email: formData.email,
        password: formData.password,
        displayName,
        role,
        profile
      };
      
      // Register user
      await register(userData);
      
      setSuccess(true);
      
      // Auto-redirect after successful registration
      setTimeout(() => {
        const dashboardPath = getDashboardPath(role);
        router.push(dashboardPath);
      }, 2000);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(
        error.message || 
        'Registration failed. Please check your information and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const createLawFirmHandler = async (firmData: any) => {
    try {
      const newFirm = await createLawFirm(firmData);
      setLawFirms(prev => [...prev, newFirm]);
      return newFirm;
    } catch (error) {
      console.error('Error creating law firm:', error);
      setError('Failed to create law firm. Please try again.');
      throw error;
    }
  };

  const getDashboardPath = (role: UserRole): string => {
    switch (role) {
      case 'admin':
      case 'super-admin':
      case 'law-firm-admin':
        return '/admin';
      case 'judge':
        return '/judges';
      case 'lawyer':
        return '/lawyers';
      case 'public':
        return '/public';
      default:
        return '/';
    }
  };

  // Handle tab change
// Handle tab change
const handleTabChange = (value: string) => {
  setActiveTab(value as UserRole);
  setSelectedAdminType(''); // Reset admin type when switching tabs
  setErrors({});
  setError('');
  setSuccess(false);
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
            disabled={isLoading}
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
            disabled={isLoading}
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
          disabled={isLoading}
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
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => togglePasswordVisibility(passwordRef)}
            disabled={isLoading}
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
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => togglePasswordVisibility(confirmPasswordRef)}
            disabled={isLoading}
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
          disabled={isLoading}
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
          disabled={isLoading}
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
    <div className="space-y-4">
      <div>
        <Label htmlFor="lawFirm">
          Law Firm <span className="text-red-500">*</span>
        </Label>
        {isLoadingLawFirms ? (
          <div className="flex items-center justify-center h-10">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <select 
            id="lawFirm"
            value={selectedLawFirmId}
            onChange={(e) => setSelectedLawFirmId(e.target.value)}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.lawFirm ? 'border-red-500' : ''}`}
            disabled={isLoading}
          >
            <option value="">Select your law firm</option>
            {lawFirms.map(firm => (
              <option key={firm.id} value={firm.id}>
                {firm.name}
              </option>
            ))}
          </select>
        )}
        {errors.lawFirm && (
          <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
            <AlertCircle className="h-3 w-3" />
            {errors.lawFirm}
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
          disabled={isLoading}
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
              disabled={isLoading}
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
    </div>
  );

  // Admin-specific fields
const AdminFields = () => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="adminType">
        Administrative Role <span className="text-red-500">*</span>
      </Label>
      <select 
        id="adminType"
        ref={adminTypeRef}
        value={selectedAdminType}
        onChange={(e) => {
          setSelectedAdminType(e.target.value);
          if (e.target.value === 'law-firm-admin') {
            fetchLawFirms();
          }
        }}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.adminType ? 'border-red-500' : ''}`}
        disabled={isLoading}
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
      {errors.adminType && (
        <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
          <AlertCircle className="h-3 w-3" />
          {errors.adminType}
        </div>
      )}
    </div>

    {/* Show law firm options only for law-firm-admin */}
    {selectedAdminType === 'law-firm-admin' && (
      <div className="border-t pt-4 space-y-4">
        <h3 className="text-lg font-semibold text-orange-600">Law Firm Management</h3>
        
        <div className="flex space-x-4">
          <Button
            type="button"
            variant={lawFirmOption === 'new' ? 'default' : 'outline'}
            onClick={() => setLawFirmOption('new')}
            disabled={isLoading}
          >
            Register New Law Firm
          </Button>
          <Button
            type="button"
            variant={lawFirmOption === 'existing' ? 'default' : 'outline'}
            onClick={() => setLawFirmOption('existing')}
            disabled={isLoading}
          >
            Select Existing Law Firm
          </Button>
        </div>

        {lawFirmOption === 'new' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="lawFirmName">
                Law Firm Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lawFirmName"
                value={newLawFirm.name}
                onChange={(e) => setNewLawFirm({...newLawFirm, name: e.target.value})}
                placeholder="Enter law firm name"
                className={errors.lawFirmName ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.lawFirmName && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                  <AlertCircle className="h-3 w-3" />
                  {errors.lawFirmName}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="lawFirmAddress">
                Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lawFirmAddress"
                value={newLawFirm.address}
                onChange={(e) => setNewLawFirm({...newLawFirm, address: e.target.value})}
                placeholder="Enter law firm address"
                className={errors.lawFirmAddress ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.lawFirmAddress && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                  <AlertCircle className="h-3 w-3" />
                  {errors.lawFirmAddress}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="lawFirmEmail">
                Contact Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lawFirmEmail"
                type="email"
                value={newLawFirm.contactEmail}
                onChange={(e) => setNewLawFirm({...newLawFirm, contactEmail: e.target.value})}
                placeholder="Enter contact email"
                className={errors.lawFirmEmail ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.lawFirmEmail && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                  <AlertCircle className="h-3 w-3" />
                  {errors.lawFirmEmail}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="lawFirmPhone">
                Contact Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lawFirmPhone"
                value={newLawFirm.contactPhone}
                onChange={(e) => setNewLawFirm({...newLawFirm, contactPhone: e.target.value})}
                placeholder="Enter contact phone"
                className={errors.lawFirmPhone ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.lawFirmPhone && (
                <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                  <AlertCircle className="h-3 w-3" />
                  {errors.lawFirmPhone}
                </div>
              )}
            </div>
          </div>
        )}

        {lawFirmOption === 'existing' && (
          <div>
            <Label htmlFor="existingLawFirm">
              Select Law Firm <span className="text-red-500">*</span>
            </Label>
            {isLoadingLawFirms ? (
              <div className="flex items-center justify-center h-10">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <select 
                id="existingLawFirm"
                value={selectedLawFirmId}
                onChange={(e) => setSelectedLawFirmId(e.target.value)}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.existingLawFirm ? 'border-red-500' : ''}`}
                disabled={isLoading}
              >
                <option value="">Select a law firm</option>
                {lawFirms.map(firm => (
                  <option key={firm.id} value={firm.id}>
                    {firm.name}
                  </option>
                ))}
              </select>
            )}
            {errors.existingLawFirm && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                <AlertCircle className="h-3 w-3" />
                {errors.existingLawFirm}
              </div>
            )}
          </div>
        )}
      </div>
    )}
  </div>
);

  // Success state UI
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Registration Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>Your account has been created successfully.</p>
            <p className="text-sm text-gray-600">
              You will be redirected to your dashboard shortly...
            </p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center relative">
          <div className="absolute top-0 right-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/login')}
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
              disabled={isLoading}
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

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
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
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="judge" className="flex items-center gap-2" disabled={isLoading}>
                    <Scale className="h-4 w-4" />
                    Judges
                  </TabsTrigger>
                  <TabsTrigger value="lawyer" className="flex items-center gap-2" disabled={isLoading}>
                    <Building className="h-4 w-4" />
                    Lawyers
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex items-center gap-2" disabled={isLoading}>
                    <Users className="h-4 w-4" />
                    Administrators
                  </TabsTrigger>
                </TabsList>
                
                <div className="space-y-4 mt-6">
                  <CommonFields />
                  
                  {activeTab === 'judge' && (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-4 text-orange-600">Judge Information</h3>
                      <div className="space-y-4">
                        <JudgeFields />
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'lawyer' && (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-4 text-orange-600">Lawyer Information</h3>
                      <div className="space-y-4">
                        <LawyerFields />
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'admin' && (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-4 text-orange-600">Administrator Information</h3>
                      <div className="space-y-4">
                        <AdminFields />
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-4 space-y-3">
                    <Button
                      type="submit"
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        `Register ${activeTab === 'judge' ? 'Judge' : activeTab === 'lawyer' ? 'Lawyer' : 'Administrator'}`
                      )}
                    </Button>
                    
                    <div className="text-center text-sm text-gray-600">
                      Already have an account?{' '}
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-orange-600 hover:text-orange-700"
                        onClick={() => router.push('/login')}
                        disabled={isLoading}
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
              <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                <p className="text-xs font-medium text-orange-800">Note:</p>
                <p className="text-xs text-orange-700">
                  Demo email addresses cannot be used for registration. Please use your own email address.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationSystem;
