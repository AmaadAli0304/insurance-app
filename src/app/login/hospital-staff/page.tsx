
"use client";

import { useState, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function HospitalStaffLoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok || data.user.role !== 'Hospital Staff') {
            throw new Error(data.error || 'Login failed or not a Hospital Staff user.');
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

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
       <div className="hidden bg-muted lg:flex lg:flex-col items-center justify-center p-8 text-center">
        <div className="mb-8">
            <Logo />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter">One Stop Insurance</h1>
        <p className="mt-4 text-lg text-muted-foreground">Your centralized hub for seamless insurance and hospital management.</p>
         <div className="relative flex items-center justify-center mt-8">
            <Image
                src="/images/logo.png"
                alt="Login character illustration"
                width={350}
                height={550}
                className="object-contain"
                data-ai-hint="logo"
            />
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
            <div className="flex justify-center mb-4 lg:hidden">
                <Logo />
            </div>
            <CardTitle className="text-2xl">Hospital Staff Login</CardTitle>
            <CardDescription>Enter your credentials to access the hospital portal.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="staff@hospital.com" required />
                </div>
                <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
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
                <div className="flex justify-between w-full">
                    <Link href="/login/company-admin" className="text-sm text-muted-foreground hover:underline">
                        Log in as Company Admin
                    </Link>
                     <Link href="/login/admin" className="text-sm text-muted-foreground hover:underline">
                        Log in as Admin
                    </Link>
                </div>
            </CardFooter>
            </form>
        </Card>
      </div>
    </div>
  );
}
