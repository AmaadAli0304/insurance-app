
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormState, useFormStatus } from "react-dom";
import { handleAddCompany } from "../actions";
import Link from "next/link";
import { ArrowLeft, PlusCircle, Trash2 } from "lucide-react";
import type { Policy } from "@/lib/types";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Adding..." : "Add Company"}
        </Button>
    );
}

export default function NewCompanyPage() {
    const [state, formAction] = useFormState(handleAddCompany, { message: "" });
    const [policies, setPolicies] = useState<Partial<Policy>[]>([
        { policyId: '', policyName: '', coverageAmount: 0, conditions: '' }
    ]);

    const handlePolicyChange = (index: number, field: keyof Policy, value: string | number) => {
        const newPolicies = [...policies];
        const policy = newPolicies[index];
        (policy[field] as any) = value;
        setPolicies(newPolicies);
    };

    const addPolicy = () => {
        setPolicies([...policies, { policyId: '', policyName: '', coverageAmount: 0, conditions: '' }]);
    };

    const removePolicy = (index: number) => {
        const newPolicies = policies.filter((_, i) => i !== index);
        setPolicies(newPolicies);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/companies">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Add New Insurance Company</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Company Details</CardTitle>
                    <CardDescription>Fill in the form to add a new insurance company.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="policies" value={JSON.stringify(policies)} />
                         <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Company Name</Label>
                                <Input id="name" name="name" placeholder="e.g. Statamine Inc." required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="registrationNumber">Registration Number</Label>
                                <Input id="registrationNumber" name="registrationNumber" placeholder="Official registration number" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Full Postal Address</Label>
                            <Input id="address" name="address" placeholder="e.g. 123 Insurance Rd, Big City, USA" />
                        </div>

                         <div className="grid md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="contactPerson">Contact Person</Label>
                                <Input id="contactPerson" name="contactPerson" placeholder="e.g. John Doe" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Official Email</Label>
                                <Input id="email" name="email" type="email" placeholder="e.g. contact@company.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" placeholder="e.g. 800-555-1234" />
                            </div>
                        </div>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Policies</CardTitle>
                                <CardDescription>Add the insurance policies offered by this company.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {policies.map((policy, index) => (
                                    <div key={index} className="p-4 border rounded-md space-y-3 relative">
                                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removePolicy(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`policyId-${index}`}>Policy ID</Label>
                                                <Input id={`policyId-${index}`} value={policy.policyId} onChange={e => handlePolicyChange(index, 'policyId', e.target.value)} placeholder="e.g. GOLD-100" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`policyName-${index}`}>Policy Name</Label>
                                                <Input id={`policyName-${index}`} value={policy.policyName} onChange={e => handlePolicyChange(index, 'policyName', e.target.value)} placeholder="e.g. Gold Plan" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`coverageAmount-${index}`}>Coverage Amount ($)</Label>
                                                <Input id={`coverageAmount-${index}`} type="number" value={policy.coverageAmount} onChange={e => handlePolicyChange(index, 'coverageAmount', Number(e.target.value))} placeholder="e.g. 50000" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`conditions-${index}`}>Conditions</Label>
                                                <Input id={`conditions-${index}`} value={policy.conditions} onChange={e => handlePolicyChange(index, 'conditions', e.target.value)} placeholder="Brief summary or link" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addPolicy}>
                                    <PlusCircle className="h-4 w-4" />
                                    Add Another Policy
                                </Button>
                            </CardContent>
                        </Card>
                        
                        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
