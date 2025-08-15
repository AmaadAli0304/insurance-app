
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
            {pending ? "Adding..." : "Add Patient Record"}
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
                <input type="hidden" name="hospitalId" value={user?.hospitalId || ''} />
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Patient Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" name="fullName" placeholder="e.g. John Doe" required />
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
                                <Label htmlFor="phoneNumber">Contact Information (phone/email)</Label>
                                <Input id="phoneNumber" name="phoneNumber" placeholder="e.g. 555-123-4567" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="policyNumber">Insurance Policy Number (or member ID)</Label>
                                <Input id="policyNumber" name="policyNumber" placeholder="e.g. POL-1A2B3C" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="companyId">Insurance Company Name</Label>
                                <Select name="companyId" required>
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Hospital / Provider Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="hospitalName">Hospital Name</Label>
                                <Input id="hospitalName" name="hospitalName" defaultValue={hospital?.name} readOnly />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hospitalCode">Hospital Code</Label>
                                <Input id="hospitalCode" name="hospitalCode" placeholder="Provided by insurer" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="doctorName">Doctor Name</Label>
                                <Input id="doctorName" name="doctorName" placeholder="e.g., Dr. Jane Smith" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="doctorRegistrationNumber">Doctor Registration Number</Label>
                                <Input id="doctorRegistrationNumber" name="doctorRegistrationNumber" placeholder="e.g., DN-12345" />
                            </div>
                        </CardContent>
                    </Card>
                    
                     <Card>
                        <CardHeader>
                            <CardTitle>Treatment / Case Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="diagnosis">Diagnosis (ICD code if applicable)</Label>
                                <Input id="diagnosis" name="diagnosis" placeholder="e.g. C81.90" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="proposedTreatment">Proposed Treatment / Procedure</Label>
                                <Input id="proposedTreatment" name="proposedTreatment" placeholder="e.g., Cardiac Monitoring" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
                                <Input id="estimatedCost" name="estimatedCost" type="number" placeholder="e.g. 5200" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="admissionDate">Planned Admission Date</Label>
                                <Input id="admissionDate" name="admissionDate" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expectedLengthOfStay">Expected Length of Stay (days)</Label>
                                <Input id="expectedLengthOfStay" name="expectedLengthOfStay" type="number" placeholder="e.g. 2" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Supporting Docs</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="medicalReports">Medical Reports / Prescriptions</Label>
                                <Button variant="outline" className="w-full justify-start gap-2"><Upload /> Upload File</Button>
                                <Input id="medicalReports" name="medicalReports" type="file" className="hidden" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="patientIdProof">Patient ID Proof</Label>
                                <Button variant="outline" className="w-full justify-start gap-2"><Upload /> Upload File</Button>
                                <Input id="patientIdProof" name="patientIdProof" type="file" className="hidden" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="insuranceCard">Insurance Card Scan</Label>
                                <Button variant="outline" className="w-full justify-start gap-2"><Upload /> Upload File</Button>
                                <Input id="insuranceCard" name="insuranceCard" type="file" className="hidden" />
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
