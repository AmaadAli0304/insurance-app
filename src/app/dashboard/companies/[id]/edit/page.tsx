
"use client";

import * as React from "react";
import { useEffect, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdateCompany } from "../../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, useRouter, useParams } from "next/navigation";
import type { Company } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

export default function EditCompanyPage() {
    const params = useParams();
    const id = params.id as string;
    const [company, setCompany] = React.useState<Company | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [state, formAction] = useActionState(handleUpdateCompany, { message: "", type: "initial" });
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        async function fetchCompany() {
            try {
                const response = await fetch(`/api/companies/${id}`);
                if (!response.ok) {
                     if (response.status === 404) {
                        notFound();
                    }
                    throw new Error('Failed to fetch company');
                }
                const fetchedCompany = await response.json();
                setCompany(fetchedCompany);
            } catch (err) {
                const dbError = err as Error;
                setError(dbError.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchCompany();
    }, [id]);

    useEffect(() => {
        if (state.type === 'success') {
           toast({
             title: "Insurance Company",
             description: "company updated successfully",
             variant: "success",
           });
           router.push('/dashboard/companies');
        } else if (state.type === 'error') {
           toast({
             title: "Error",
             description: state.message,
             variant: "destructive",
           });
        }
    }, [state, router, toast]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!company) {
        notFound();
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/companies">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">Edit Company</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Update Company Details</CardTitle>
                    <CardDescription>Modify the form to update the company's information.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="id" value={company.id} />
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Company Name <span className="text-destructive">*</span></Label>
                                <Input id="name" name="name" defaultValue={company.name} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="email">Official Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={company.email ?? ""} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Full Postal Address</Label>
                            <Input id="address" name="address" defaultValue={company.address ?? ""} />
                        </div>

                         <div className="grid md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="contactPerson">Contact Person</Label>
                                <Input id="contactPerson" name="contactPerson" defaultValue={company.contactPerson ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" defaultValue={company.phone ?? ""} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="portalLink">Portal Link</Label>
                                <Input id="portalLink" name="portalLink" type="url" defaultValue={company.portalLink ?? ""} />
                            </div>
                        </div>

                        {state.type === 'error' && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
