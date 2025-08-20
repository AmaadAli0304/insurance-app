
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormState, useFormStatus } from "react-dom";
import { handleUpdateCompany } from "../../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { mockCompanies } from "@/lib/mock-data";
import { notFound } from "next/navigation";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

export default function EditCompanyPage({ params }: { params: { id: string } }) {
    const company = mockCompanies.find(c => c.id === params.id);
    const [state, formAction] = useFormState(handleUpdateCompany, { message: "" });

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
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Full Postal Address <span className="text-destructive">*</span></Label>
                            <Input id="address" name="address" defaultValue={company.address} required />
                        </div>

                         <div className="grid md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="contactPerson">Contact Person</Label>
                                <Input id="contactPerson" name="contactPerson" defaultValue={company.contactPerson} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Official Email <span className="text-destructive">*</span></Label>
                                <Input id="email" name="email" type="email" defaultValue={company.email} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" defaultValue={company.phone} />
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
