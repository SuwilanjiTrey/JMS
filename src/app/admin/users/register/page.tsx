// File: app/admin/users/register/page.tsx - Registration page for admin

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { registerUserWithProfile } from '@/lib/auth';
import { UserCreationData, UserRole, CourtType } from '@/models';
import { RegistrationForm } from '@/components/exports/RegistrationForm';

export default function RegisterUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegistration = async (formData: any) => {
    setIsLoading(true);
    try {
      const userData: UserCreationData = {
        email: formData.email,
        password: formData.password,
        displayName: `${formData.firstName} ${formData.lastName}`,
        role: formData.role as UserRole,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          ...(formData.role === 'judge' && {
            courtType: formData.courtType as CourtType,
            courtLocation: formData.courtLocation,
            judgeLevel: formData.courtType as CourtType,
          }),
          ...(formData.role === 'lawyer' && {
            lawFirmName: formData.lawFirmName,
            barNumber: formData.barNumber,
            specialization: formData.specialization,
          }),
          ...(formData.role === 'admin' && {
            adminType: formData.courtType || 'super-admin',
          }),
        }
      };

      await registerUserWithProfile(userData);
      
      alert(`${formData.role} registered successfully!`);
      router.push('/admin/users');
      
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(`Registration failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Register New User</h1>
          <p className="text-muted-foreground">Add a new user to the judicial system</p>
        </div>
      </div>

      {/* Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle>User Registration</CardTitle>
          <CardDescription>
            Complete the form below to register a new user in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationForm 
            onSubmit={handleRegistration}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
