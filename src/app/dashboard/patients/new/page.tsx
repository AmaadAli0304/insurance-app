
"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleAddPatient } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCompaniesForForm } from "../../company-hospitals/actions";
import type { Company } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} size="lg">
            {pending ? "Saving..." : "Add Patient Record"}
        </Button>
    );
}

export default function NewPatientPage() {
    const [state, formAction] = useActionState(handleAddPatient, { message: "", type: "initial" });
    const { toast } = useToast();
    const router = useRouter();
    const [companies, setCompanies] = useState<Pick<Company, "id" | "name">[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        async function loadCompanies() {
            try {
                const companyList = await getCompaniesForForm();
                setCompanies(companyList);
            } catch (error) {
                toast({ title: "Error", description: "Failed to load companies.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
        loadCompanies();
    }, [toast]);
    
    useEffect(() => {
        if (state.type === 'success') {
            toast({ title: "Patient", description: state.message, variant: "success" });
            router.push('/dashboard/patients');
        } else if (state.type === 'error') {
            toast({ title: "Error", description: state.message, variant: "destructive" });
        }
    }, [state, toast, router]);


    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/patients">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">New Patient</h1>
            </div>
            <form action={formAction}>
                <div className="grid gap-6">
                    {/* Patient Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Patient Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                                <Input id="name" name="name" placeholder="Full legal name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birth_date">Date of Birth</Label>
                                <Input id="birth_date" name="birth_date" type="date" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select name="gender">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                                <Input id="email" name="email" type="email" placeholder="patient@example.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Contact Phone</Label>
                                <Input id="phone" name="phone" placeholder="Phone or email" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="address">Full Address</Label>
                                <Input id="address" name="address" placeholder="123 Main St, Anytown, USA" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Insurance Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Insurance Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company_id">Insurance Company <span className="text-destructive">*</span></Label>
                                <Select name="company_id" required disabled={isLoading}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a company" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="policy_number">Policy Number</Label>
                                <Input id="policy_number" name="policy_number" placeholder="Insurance policy number" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="member_id">Member ID</Label>
                                <Input id="member_id" name="member_id" placeholder="Member/insured person's ID" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="policy_start_date">Policy Start Date</Label>
                                    <Input id="policy_start_date" name="policy_start_date" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="policy_end_date">Policy End Date</Label>
                                    <Input id="policy_end_date" name="policy_end_date" type="date" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {state.type === 'error' && <p className="text-sm text-destructive">{state.message}</p>}
                    <SubmitButton />
                </div>
            </form>
        </div>
    );
}
