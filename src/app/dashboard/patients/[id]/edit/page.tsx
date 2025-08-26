"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdatePatient } from "../../actions";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { mockPatients, mockCompanies, mockHospitals } from "@/lib/mock-data";
import { notFound, useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo } from "react";

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
    const id = params.id as string;
    const { user } = useAuth();
    const patient = mockPatients.find(p => p.id === id);
    const [state, formAction] = useActionState(handleUpdatePatient, { message: "" });
    const hospital = mockHospitals.find(h => h.id === patient?.hospitalId);
    
    const [selectedCompanyId, setSelectedCompanyId] = useState("");

    useEffect(() => {
        if (patient) {
            setSelectedCompanyId(patient.companyId || "");
        }
    }, [patient]);

    const assignedCompanies = useMemo(() => {
        if (!hospital) return [];
        return mockCompanies.filter(c => hospital.assignedCompanies.includes(c.id));
    }, [hospital]);

    if (!patient) {
        notFound();
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
                                <Label htmlFor="patientContact">Contact (Phone/Email)</Label>
                                <Input id="patientContact" name="patientContact" defaultValue={patient.phoneNumber} required />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="patientAddress">Full Address</Label>
                                <Input id="patientAddress" name="patientAddress" defaultValue={patient.address} required />
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
                                <Label htmlFor="insuranceCompany">Insurance Company</Label>
                                <input type="hidden" name="insuranceCompany" value={selectedCompanyId} />
                                <input type="hidden" name="hospitalId" value={patient.hospitalId} />
                                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
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
                                <Label htmlFor="memberId">Member ID</Label>
                                <Input id="memberId" name="memberId" defaultValue={patient.memberId} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="policyStartDate">Policy Start Date</Label>
                                    <Input id="policyStartDate" name="policyStartDate" type="date" defaultValue={patient.policyStartDate} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="policyEndDate">Policy End Date</Label>
                                    <Input id="policyEndDate" name="policyEndDate" type="date" defaultValue={patient.policyEndDate} required />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Supporting Documents */}
                    <Card>
                        <CardHeader>
                            <CardTitle>3. Supporting Documents (Optional)</CardTitle>
                            <CardDescription>Attach relevant medical reports, ID proofs, and insurance cards.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="medicalReports">Medical Reports</Label>
                                <Button variant="outline" className="w-full justify-start gap-2" asChild><label htmlFor="medicalReports-upload" className="cursor-pointer w-full"><Upload /> Upload File</label></Button>
                                <Input id="medicalReports-upload" name="medicalReports" type="file" className="hidden" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="patientIdProof">Patient ID Proof</Label>
                                <Button variant="outline" className="w-full justify-start gap-2" asChild><label htmlFor="patientIdProof-upload" className="cursor-pointer w-full"><Upload /> Upload File</label></Button>
                                <Input id="patientIdProof-upload" name="patientIdProof" type="file" className="hidden" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="insuranceCard">Insurance Card Scan</Label>
                                <Button variant="outline" className="w-full justify-start gap-2" asChild><label htmlFor="insuranceCard-upload" className="cursor-pointer w-full"><Upload /> Upload File</label></Button>
                                <Input id="insuranceCard-upload" name="insuranceCard" type="file" className="hidden" />
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
