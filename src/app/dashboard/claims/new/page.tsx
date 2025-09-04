
"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";


export default function NewClaimPage() {
    const router = useRouter();

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/claims">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">New Claim</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Claim Creation</CardTitle>
                    <CardDescription>New claims are now automatically created when a Pre-Authorization request is sent.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">To create a new claim, please start by creating a new Pre-Authorization request for a patient.</p>
                    <Button onClick={() => router.push('/dashboard/pre-auths/new')}>
                        Go to New Pre-Auth Request
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
