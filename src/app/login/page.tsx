
"use client";

import { useEffect, useActionState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/components/auth-provider';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { loginAction } from './actions';
import { useFormStatus } from 'react-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';

function LoginButton() {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full" type="submit" disabled={pending}>
          {pending ? (
            <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
          ) : (
            'Sign In'
          )}
        </Button>
    );
}

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [state, formAction] = useActionState(loginAction, { error: undefined, token: undefined });
 
  useEffect(() => {
    if (state.error) {
       toast({
          title: "Authentication Error",
          description: state.error,
          variant: "destructive",
      });
    }
    if (state.token) {
      const rememberMe = state.rememberMe ?? false;
      login(state.token, rememberMe);
    }
  }, [state, login, toast]);


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
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="user@example.com" defaultValue="companyadmin@yopmail.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" defaultValue="password" required />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" name="remember" defaultChecked={true} />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me
              </label>
            </div>
             <div className="space-y-2">
                <p className="text-sm text-muted-foreground">You can use any of the seeded users from the database.</p>
            </div>
            {state.error && <p className="text-sm text-destructive text-center">{state.error}</p>}
          </CardContent>
          <CardFooter>
             <LoginButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
