
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormState, useFormStatus } from "react-dom";
import { handleAddPatient } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockHospitals, mockCompanies, mockStaffingPackages } from "@/lib/mock-data";
import { StaffingPackage } from "@/lib/types";
import { useState, useMemo } from "react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Adding..." : "Add Patient"}
        </Button>
    );
}

export default function NewPatientPage() {
    const { user } = useAuth();
    const [state, formAction] = useFormState(handleAddPatient, { message: "" });
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

    const assignedCompanies = useMemo(() => {
        const hospital = mockHospitals.find(h => h.id === user?.hospitalId);
        if (!hospital) return [];
        return mockCompanies.filter(c => hospital.assignedCompanies.includes(c.id));
    }, [user?.hospitalId]);

    const companyPackages = useMemo((): StaffingPackage[] => {
        if (!selectedCompanyId) return [];
        const company = mockCompanies.find(c => c.id === selectedCompanyId);
        return company?.packages || [];
    }, [selectedCompanyId]);


    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/patients">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Add New Patient</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Patient Details</CardTitle>
                    <CardDescription>Fill in the form to add a new patient to the system.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                     <input type="hidden" name="hospitalId" value={user?.hospitalId || ''} />
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Patient Name</Label>
                            <Input id="name" name="name" placeholder="e.g. John Doe" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input id="dob" name="dob" type="date" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="companyId">Staffing Company</Label>
                            <Select name="companyId" required onValueChange={setSelectedCompanyId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a company" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assignedCompanies.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="packageId">Staffing Package</Label>
                            <Select name="packageId" required disabled={!selectedCompanyId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a package" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companyPackages.map(p => (
                                        <SelectItem key={p.packageId} value={p.packageId}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}

