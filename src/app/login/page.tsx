'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Gavel, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/models';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // For demo purposes, we'll use mock authentication
      // In a real app, this would call the actual Firebase auth
      await login(email, password);
      
      // Store the selected role for demo purposes
      localStorage.setItem('userRole', selectedRole);
      localStorage.setItem('userName', email.split('@')[0]);
      
      // Redirect to the appropriate dashboard
      const dashboardPath = getDashboardPath(selectedRole);
      router.push(dashboardPath);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDashboardPath = (role: UserRole): string => {
    switch (role) {
      case 'admin':
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

  const getRoleBadgeColor = (role: UserRole) => {
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

  // Demo credentials
  const demoCredentials = [
    { role: 'admin', email: 'admin@courts.gov.zm', password: 'admin123' },
    { role: 'judge', email: 'judge@courts.gov.zm', password: 'judge123' },
    { role: 'lawyer', email: 'lawyer@courts.gov.zm', password: 'lawyer123' },
    { role: 'public', email: 'public@courts.gov.zm', password: 'public123' },
  ];

  const handleDemoLogin = (role: UserRole) => {
    const credential = demoCredentials.find(c => c.role === role);
    if (credential) {
      setEmail(credential.email);
      setPassword(credential.password);
      setSelectedRole(role);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zambia-orange/10 to-zambia-green/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Gavel className="h-12 w-12 text-zambia-orange" />
          </div>
          <h1 className="text-3xl font-bold text-zambia-black">Judicial Management System</h1>
          <p className="text-zambia-black/70 mt-2">Republic of Zambia</p>
        </div>

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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
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
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(['admin', 'judge', 'lawyer', 'public'] as UserRole[]).map((role) => (
                    <Button
                      key={role}
                      type="button"
                      variant={selectedRole === role ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => setSelectedRole(role)}
                    >
                      <Badge className={getRoleBadgeColor(role)}>
                        {role}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-zambia-orange hover:bg-zambia-orange/90"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
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
                >
                  <Badge className={getRoleBadgeColor(credential.role)}>
                    {credential.role}
                  </Badge>
                  <span className="ml-2 text-sm text-gray-600">
                    {credential.email}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>Judicial Management System</p>
          <p>© 2024 Republic of Zambia</p>
        </div>
      </div>
    </div>
  );
}