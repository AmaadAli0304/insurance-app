
"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdatePatient, getPatientById } from "../actions";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCompaniesForForm } from "../../company-hospitals/actions";
import type { Patient, Company } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} size="lg">
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

export default function EditPatientPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;
    
    const [state, formAction] = useActionState(handleUpdatePatient, { message: "", type: 'initial' });
    const [patient, setPatient] = useState<Patient | null>(null);
    const [companies, setCompanies] = useState<Pick<Company, "id" | "name">[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [patientData, companyList] = await Promise.all([
                    getPatientById(id),
                    getCompaniesForForm()
                ]);

                if (!patientData) {
                    notFound();
                    return;
                }
                
                setPatient(patientData);
                setCompanies(companyList);
            } catch (error) {
                toast({ title: "Error", description: "Failed to load patient data.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [id, toast]);
    
     useEffect(() => {
        if (state.type === 'success') {
            toast({ title: "Patient", description: state.message, variant: "success" });
            router.push('/dashboard/patients');
        } else if (state.type === 'error') {
            toast({ title: "Error", description: state.message, variant: "destructive" });
        }
    }, [state, toast, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                 <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (!patient) {
        return notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/patients">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">Edit Patient</h1>
            </div>
            <form action={formAction}>
                 <input type="hidden" name="id" value={patient.id} />
                <div className="grid gap-6">
                    {/* Patient Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Patient Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                                <Input id="name" name="name" defaultValue={patient.fullName} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birth_date">Date of Birth</Label>
                                <Input id="birth_date" name="birth_date" type="date" defaultValue={patient.dateOfBirth ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select name="gender" defaultValue={patient.gender ?? undefined}>
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
                                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                                <Input id="email" name="email" type="email" defaultValue={patient.email ?? ""} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Contact Phone</Label>
                                <Input id="phone" name="phone" defaultValue={patient.phoneNumber ?? ""} />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="address">Full Address</Label>
                                <Input id="address" name="address" defaultValue={patient.address ?? ""} />
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
                                <Select name="company_id" required defaultValue={patient.companyId}>
                                    <SelectTrigger disabled={isLoading}>
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
                                <Input id="policy_number" name="policy_number" defaultValue={patient.policyNumber ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="member_id">Member ID</Label>
                                <Input id="member_id" name="member_id" defaultValue={patient.memberId ?? ""} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="policy_start_date">Policy Start Date</Label>
                                    <Input id="policy_start_date" name="policy_start_date" type="date" defaultValue={patient.policyStartDate ?? ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="policy_end_date">Policy End Date</Label>
                                    <Input id="policy_end_date" name="policy_end_date" type="date" defaultValue={patient.policyEndDate ?? ""} />
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
