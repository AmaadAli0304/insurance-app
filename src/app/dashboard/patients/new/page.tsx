
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormState, useFormStatus } from "react-dom";
import { handleAddPatient } from "../actions";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockHospitals, mockCompanies } from "@/lib/mock-data";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} size="lg">
            {pending ? "Saving..." : "Add Patient Record"}
        </Button>
    );
}

export default function NewPatientPage() {
    const { user } = useAuth();
    const [state, formAction] = useFormState(handleAddPatient, { message: "" });
    const hospital = mockHospitals.find(h => h.id === user?.hospitalId);

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
            <form action={formAction}>
                <div className="grid gap-6">
                    {/* Patient Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Patient Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" name="fullName" placeholder="Full legal name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select name="gender" required>
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
                                <Input id="patientContact" name="patientContact" placeholder="Phone or email" required />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="patientAddress">Full Address</Label>
                                <Input id="patientAddress" name="patientAddress" placeholder="123 Main St, Anytown, USA" required />
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
                                <Select name="insuranceCompany" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a company" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mockCompanies.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="policyNumber">Policy Number</Label>
                                <Input id="policyNumber" name="policyNumber" placeholder="Insurance policy number" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="memberId">Member ID</Label>
                                <Input id="memberId" name="memberId" placeholder="Member/insured person's ID" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="policyStartDate">Policy Start Date</Label>
                                    <Input id="policyStartDate" name="policyStartDate" type="date" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="policyEndDate">Policy End Date</Label>
                                    <Input id="policyEndDate" name="policyEndDate" type="date" required />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Admission & Hospital Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>3. Admission & Hospital Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="hospitalName">Hospital Name</Label>
                                <Input id="hospitalName" name="hospitalName" defaultValue={hospital?.name} readOnly />
                                <input type="hidden" name="hospitalId" value={user?.hospitalId || ''} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="doctorName">Doctor Name</Label>
                                <Input id="doctorName" name="doctorName" placeholder="Treating doctor's full name" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="doctorSpeciality">Doctor Speciality</Label>
                                <Input id="doctorSpeciality" name="doctorSpeciality" placeholder="e.g., Cardiologist" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="admissionDate">Planned Admission Date</Label>
                                <Input id="admissionDate" name="admissionDate" type="date" required />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Medical Details */}
                     <Card>
                        <CardHeader>
                            <CardTitle>4. Medical Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="diagnosis">Diagnosis</Label>
                                <Input id="diagnosis" name="diagnosis" placeholder="Primary diagnosis (ICD code if possible)" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="proposedTreatment">Proposed Treatment</Label>
                                <Input id="proposedTreatment" name="proposedTreatment" placeholder="e.g., Knee Replacement Surgery" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="procedureCode">Procedure Code (optional)</Label>
                                <Input id="procedureCode" name="procedureCode" placeholder="CPT/HCPCS code" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
                                <Input id="estimatedCost" name="estimatedCost" type="number" placeholder="e.g. 15000" required />
                            </div>
                             <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="clinicalNotes">Clinical Notes (optional)</Label>
                                <Textarea id="clinicalNotes" name="clinicalNotes" placeholder="Doctor's summary of why treatment is needed" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Supporting Documents */}
                    <Card>
                        <CardHeader>
                            <CardTitle>5. Supporting Documents (Optional)</CardTitle>
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
