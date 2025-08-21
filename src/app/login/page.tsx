
"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/components/auth-provider';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { mockUsers, getMockUserByEmail } from '@/lib/mock-data';
import type { User } from '@/lib/types';

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("admin@medichain.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDemoUserChange = (email: string) => {
    setEmail(email);
    setPassword("password");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simulate async operation
    setTimeout(() => {
        const user = getMockUserByEmail(email);

        if (user && user.password === password) { // Check for explicit password first
            login(user);
        } else if (user && !user.password && password === 'password') { // Fallback for mock users without password
            login(user);
        }
        else {
             toast({
                title: "Authentication Error",
                description: "Invalid email or password.",
                variant: "destructive",
            });
            setError("Invalid email or password.");
        }
        setLoading(false);
    }, 500);
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
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
             <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Demo users (click to autofill):</p>
                <div className="flex flex-wrap gap-2">
                    {mockUsers.map(user => (
                        <Button key={user.uid} type="button" variant="outline" size="sm" onClick={() => handleDemoUserChange(user.email)}>
                            {user.role}
                        </Button>
                    ))}
                </div>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardContent>
          <CardFooter>
             <Button className="w-full" type="submit" disabled={loading}>
              {loading ? (
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
