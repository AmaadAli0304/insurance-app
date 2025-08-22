
"use client";

import * as React from "react";
import { useEffect, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdateCompany, getCompanyById } from "../../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, useRouter } from "next/navigation";
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

export default function EditCompanyPage({ params }: { params: { id: string } }) {
    const [company, setCompany] = React.useState<Company | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [state, formAction] = useActionState(handleUpdateCompany, { message: "" });
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        async function fetchCompany() {
            try {
                const fetchedCompany = await getCompanyById(params.id);
                if (!fetchedCompany) {
                    notFound();
                }
                setCompany(fetchedCompany);
            } catch (err) {
                const dbError = err as Error;
                setError(dbError.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchCompany();
    }, [params.id]);

    useEffect(() => {
        if (state?.message && state.message !== "Company not found or data is the same.") {
           toast({
             title: state.message.includes("success") ? "Success" : "Error",
             description: state.message,
             variant: state.message.includes("success") ? "success" : "destructive",
           });
           if(state.message.includes("success")) {
             router.push('/dashboard/companies');
           }
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
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/companies">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Edit Company: {company.name}</h1>
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

                        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
