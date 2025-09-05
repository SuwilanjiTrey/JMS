// components/auth/OTPVerification.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { sendOTPEmail } from '@/lib/emailjs';

interface OTPVerificationProps {
  email: string;
  name: string;
  onVerify: () => void;
  onCancel: () => void;
}

export default function OTPVerification({ email, name, onVerify, onCancel }: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState('');

  const inputRefs = Array(6).fill(0).map(() => React.createRef<HTMLInputElement>());

  // Generate OTP on component mount
  React.useEffect(() => {
    generateAndSendOTP();
  }, []);

  const generateAndSendOTP = async () => {
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(newOTP);
    
    setResending(true);
    setError('');
    
    try {
      console.log('Generated OTP:', newOTP);
      console.log('Sending to email:', email);
      console.log('Sending to name:', name);
      
      const emailSent = await sendOTPEmail(email, newOTP, name);
      
      if (!emailSent) {
        setError('Failed to send OTP email. Please try again.');
      } else {
        console.log('OTP email sent successfully');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setError('Failed to send OTP email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Move to next input if current input is filled
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (/^\d+$/.test(pastedData)) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      
      // Focus the last filled input or the next empty one
      const lastIndex = Math.min(pastedData.length - 1, 5);
      inputRefs[lastIndex].current?.focus();
    }
  };

  const verifyOTP = () => {
    const otpValue = otp.join('');
    
    console.log('Verifying OTP:', otpValue);
    console.log('Generated OTP:', generatedOTP);
    
    if (otpValue.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    if (otpValue !== generatedOTP) {
      setError('Invalid OTP. Please try again.');
      return;
    }
    
    setSuccess(true);
    
    // Call onVerify after a short delay
    setTimeout(() => {
      onVerify();
    }, 1500);
  };

  const resendOTP = () => {
    generateAndSendOTP();
    // Clear OTP inputs
    setOtp(['', '', '', '', '', '']);
    inputRefs[0].current?.focus();
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-2 text-lg font-medium">OTP Verified</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your email has been verified successfully.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          We've sent a 6-digit OTP to <strong>{email}</strong>. Please enter it below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-between space-x-2">
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={inputRefs[index]}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-12 text-center text-lg"
            />
          ))}
        </div>
        
        <Button
          onClick={verifyOTP}
          disabled={loading || otp.join('').length !== 6}
          className="w-full"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Verifying...
            </>
          ) : (
            'Verify OTP'
          )}
        </Button>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Didn't receive the OTP?{' '}
            <Button
              variant="link"
              onClick={resendOTP}
              disabled={resending}
              className="p-0 h-auto text-orange-600 hover:text-orange-700"
            >
              {resending ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600 mr-1 inline-block"></div>
                  Resending...
                </>
              ) : (
                'Resend OTP'
              )}
            </Button>
          </p>
        </div>
        
        <div className="text-center">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
