"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserRole } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('Admin');
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      login(selectedRole);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="user@example.com" defaultValue="test@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" defaultValue="password" required />
            </div>
            <div className="space-y-2">
              <Label>Login As (For Demo)</Label>
              <Select onValueChange={(value: UserRole) => setSelectedRole(value)} defaultValue={selectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Hospital Admin">Hospital Admin</SelectItem>
                  <SelectItem value="Hospital Staff">Hospital Staff</SelectItem>
                  <SelectItem value="Insurance Company Admin">Insurance Company Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
