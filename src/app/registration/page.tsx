// app/register/page.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/models';
import { demoCredentials } from '@/lib/constants/credentials';
import OTPVerification from '@/components/auth/OTP';

// Simplified form data for public users only
interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
}

const RegistrationSystem = () => {
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // OTP State
  const [showOTP, setShowOTP] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [pendingRegistrationData, setPendingRegistrationData] = useState<any>(null);

  const { register } = useAuth();
  const router = useRouter();

  // Form refs
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  // Toggle password visibility
  const togglePasswordVisibility = (inputRef: React.RefObject<HTMLInputElement>) => {
    if (inputRef.current) {
      const input = inputRef.current;
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  };

  // Collect form data
  const getFormData = (): RegistrationFormData => {
    return {
      firstName: firstNameRef.current?.value || '',
      lastName: lastNameRef.current?.value || '',
      email: emailRef.current?.value || '',
      password: passwordRef.current?.value || '',
      confirmPassword: confirmPasswordRef.current?.value || '',
      phone: phoneRef.current?.value || '',
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
    if (phoneRef.current) phoneRef.current.value = '';
    setErrors({});
    setError('');
    setSuccess(false);
  };

  // Validate form
  const validateForm = (data: RegistrationFormData): boolean => {
    const newErrors: Record<string, string> = {};

    // Prevent demo email registration
    const isDemoEmail = demoCredentials.some(cred => cred.email === data.email);
    if (isDemoEmail) {
      newErrors.email = 'Cannot register with demo credentials. Please use a different email address.';
    }

    // Common validations
    if (!data.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!data.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!data.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = 'Please enter a valid email';
    if (!data.password) newErrors.password = 'Password is required';
    else if (data.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!data.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (data.password !== data.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!data.phone.trim()) newErrors.phone = 'Phone number is required';

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

      // Prepare user creation data
      const userData = {
        email: formData.email,
        password: formData.password,
        displayName,
        role: 'public' as UserRole,
        profile: {
          phone: formData.phone,
        },
      };

      // Show OTP verification for public users
      setPendingRegistrationData(userData);
      setShowOTP(true);
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP verification handler
  const handleOTPVerify = async () => {
    if (!pendingRegistrationData) return;
    setIsLoading(true);
    setError('');
    try {
      await register(pendingRegistrationData);
      setOtpVerified(true);
      setShowOTP(false);
      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        router.push('/public/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Registration error after OTP:', error);
      setError(error.message || 'Registration failed. Please try again.');
      setShowOTP(false);
    } finally {
      setIsLoading(false);
    }
  };

  // OTP cancel handler
  const handleOTPCancel = () => {
    setShowOTP(false);
    setPendingRegistrationData(null);
  };

  // Success UI
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
            <p>Your account has been created and your email has been verified.</p>
            <p className="text-sm text-gray-600">You will be redirected to your dashboard shortly...</p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
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
            <User className="h-12 w-12 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-orange-600">Public Registration</h1>
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
              <User className="h-5 w-5" />
              Register as Public User
            </CardTitle>
            <CardDescription>Fill in your details to create an account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Full Name */}
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

                {/* Email */}
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

                {/* Password */}
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

                {/* Confirm Password */}
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

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    ref={phoneRef}
                    type="tel"
                    placeholder="Enter phone number"
                    className={errors.phone ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.phone && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                      <AlertCircle className="h-3 w-3" />
                      {errors.phone}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Register as Public User'
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
            </form>
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Public User Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                <div>Search public cases and judgments</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                <div>File documents electronically</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                <div>Receive case updates via SMS and email</div>
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

      {/* OTP Verification Modal */}
      {showOTP && pendingRegistrationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <OTPVerification
            email={pendingRegistrationData.email}
            name={pendingRegistrationData.displayName}
            onVerify={handleOTPVerify}
            onCancel={handleOTPCancel}
          />
        </div>
      )}
    </div>
  );
};

export default RegistrationSystem;
