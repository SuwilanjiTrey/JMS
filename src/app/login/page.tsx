'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Gavel, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/models';
import { demoCredentials } from '@/lib/constants/credentials';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      console.log("DEBUG — user after login:", user);
      
      // Determine dashboard path based on role and admin subtype
      const dashboardPath = getDashboardPath(user.role, user.profile?.adminType);
      console.log("DEBUG — dashboardPath:", dashboardPath);
      
      router.push(dashboardPath);
    } catch (error: any) {
      console.error('Login error:', error);
      setError(
        error.message || 
        'Invalid email or password. Please check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getDashboardPath = (role: UserRole, adminType?: string): string => {
    switch (role) {
      case 'admin':
        // Check for admin subtypes
        if (adminType === 'law-firm-admin' ) {
          return '/lawfirm';
        }
        if (adminType === 'court-admin') {
          return '/judge-admin';
        }
        else return '/admin'
        // Default admin (super-admin)
        return '/admin';
      case 'judge':
        return '/judges';
      case 'lawyer':
        return '/lawyers';
      case 'public':
        return '/public';
      case 'law-firm-admin':
        // Legacy support - in case role is still set as law-firm-admin
        return '/lawfirm';
      case 'court-admin':
        // Legacy support - in case role is still set as court-admin
        return '/judge-admin';
      default:
        return '/';
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'judge':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'lawyer':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'public':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'law-firm-admin':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'court-admin':
        return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    const credential = demoCredentials.find(c => c.role === role);
    if (credential) {
      setEmail(credential.email);
      setPassword(credential.password);
      setError('');
      
      // Auto-login with demo credentials
      setIsLoading(true);
      try {
        const user = await login(credential.email, credential.password);
        const dashboardPath = getDashboardPath(user.role, user.profile?.adminType);
        router.push(dashboardPath);
      } catch (error: any) {
        console.error('Demo login error:', error);
        setError('Demo login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSignUpClick = () => {
    router.push('/registration');
  };

  const handleForgotPassword = () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    
    // Check if it's a demo email
    const isDemoEmail = demoCredentials.some(cred => cred.email === email);
    if (isDemoEmail) {
      setError('Password reset is not available for demo accounts. Demo credentials are fixed.');
      return;
    }
    
    // In a real implementation, you would call resetPassword function here
    setError('Password reset functionality will be implemented. For now, contact administrator.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Gavel className="h-12 w-12 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-orange-600">Judicial Management System</h1>
          <p className="text-green-600 mt-2">Republic of Zambia</p>
        </div>
        
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="text-sm text-orange-600 hover:text-orange-500 underline"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
              
              {/* Sign Up Link */}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="text-orange-600 hover:text-orange-500 font-medium underline"
                    onClick={handleSignUpClick}
                    disabled={isLoading}
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Demo Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Demo Accounts</CardTitle>
            <CardDescription>
              Click on any role to quickly login with demo credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {demoCredentials.map((credential) => (
                <Button
                  key={credential.role}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleDemoLogin(credential.role)}
                  disabled={isLoading}
                >
                  <Badge className={getRoleBadgeColor(credential.role)}>
                    {credential.role}
                  </Badge>
                  <span className="ml-2 text-sm text-gray-600">
                    {credential.email}
                  </span>
                  {isLoading && (
                    <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                  )}
                </Button>
              ))}
            </div>
            <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">Demo Account Info:</p>
              <ul className="mt-1 space-y-1">
                <li>• Demo accounts provide full functionality</li>
                <li>• Data is temporary and resets on logout</li>
                <li>• Use for testing and exploration</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>Judicial Management System</p>
          <p>&copy; 2025 Republic of Zambia</p>
        </div>
      </div>
    </div>
  );
}
