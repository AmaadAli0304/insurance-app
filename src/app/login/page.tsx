
"use client";

import { useState, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/components/auth-provider';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { checkDbConnection } from './actions';
import { Wifi } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        login(data.user, data.token);

    } catch (err: any) {
        const errorMessage = err.message || "An unknown error occurred.";
        setError(errorMessage);
        toast({
            title: "Authentication Error",
            description: errorMessage,
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleConnectionCheck = async () => {
    setIsCheckingConnection(true);
    const result = await checkDbConnection();
    if (result.success) {
      toast({
        title: "Connection Success",
        description: result.message,
        variant: "success",
      });
    } else {
      toast({
        title: "Connection Failed",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsCheckingConnection(false);
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
              <Input id="email" name="email" type="email" placeholder="user@example.com" defaultValue="companyadmin@yopmail.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" defaultValue="password" required />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
             <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleConnectionCheck}
              disabled={isCheckingConnection}
            >
              {isCheckingConnection ? (
                 <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Wifi className="mr-2 h-4 w-4" />
              )}
              Check DB Connection
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
