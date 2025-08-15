
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormState, useFormStatus } from "react-dom";
import { handleUpdatePatient } from "../../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { mockPatients, mockCompanies, mockHospitals } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo } from "react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

export default function EditPatientPage({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const patient = mockPatients.find(p => p.id === params.id);
    const [state, formAction] = useFormState(handleUpdatePatient, { message: "" });

    const assignedCompanies = useMemo(() => {
        const hospital = mockHospitals.find(h => h.id === user?.hospitalId);
        if (!hospital) return [];
        return mockCompanies.filter(c => hospital.assignedCompanies.includes(c.id));
    }, [user?.hospitalId]);

    if (!patient) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/patients">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Edit Patient: {patient.fullName}</h1>
            </div>
            <form action={formAction}>
                 <input type="hidden" name="id" value={patient.id} />
                 <input type="hidden" name="hospitalId" value={user?.hospitalId || ''} />
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Patient Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" name="fullName" defaultValue={patient.fullName} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={patient.dateOfBirth} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select name="gender" required defaultValue={patient.gender}>
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
                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                <Input id="phoneNumber" name="phoneNumber" defaultValue={patient.phoneNumber} required />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Insurance Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyId">Insurance Company</Label>
                                <Select name="companyId" required defaultValue={patient.companyId}>
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
                                <Label htmlFor="policyNumber">Policy Number</Label>
                                <Input id="policyNumber" name="policyNumber" defaultValue={patient.policyNumber} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="policyStartDate">Policy Start Date</Label>
                                <Input id="policyStartDate" name="policyStartDate" type="date" defaultValue={patient.policyStartDate} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="policyEndDate">Policy End Date</Label>
                                <Input id="policyEndDate" name="policyEndDate" type="date" defaultValue={patient.policyEndDate} required />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Hospital Admission Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="admissionDate">Admission Date</Label>
                                <Input id="admissionDate" name="admissionDate" type="date" defaultValue={patient.admissionDate} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="diagnosis">Diagnosis</Label>
                                <Input id="diagnosis" name="diagnosis" defaultValue={patient.diagnosis} required />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
                                <Input id="estimatedCost" name="estimatedCost" type="number" defaultValue={patient.estimatedCost} required />
                            </div>
                        </CardContent>
                    </Card>

                    {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                    <SubmitButton />
                </div>
            </form>
        </div>
    );
}
