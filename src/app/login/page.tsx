
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/components/auth-provider';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { mockUsers } from '@/lib/mock-data';

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("admin@medichain.com");
  const [password, setPassword] = useState("password");

  // This function is for demo purposes to quickly switch between test users
  const handleDemoUserChange = (email: string) => {
    setEmail(email);
    setPassword("password");
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // In a mock setup, we can have a fake delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Here, you would typically validate the password. We'll skip that for the demo.
    const userExists = mockUsers.some(u => u.email === email);

    if (userExists) {
        login(email);
        // The AuthProvider will handle the redirect.
    } else {
        toast({
            title: "Authentication Error",
            description: "User not found. Please select a valid demo user.",
            variant: "destructive",
        });
    }

    setIsLoading(false);
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
              <Input id="email" type="email" placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Demo users:</p>
                <div className="flex flex-wrap gap-2">
                    {mockUsers.map(user => (
                        <Button key={user.uid} type="button" variant="outline" size="sm" onClick={() => handleDemoUserChange(user.email)}>
                            {user.role}
                        </Button>
                    ))}
                </div>
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
