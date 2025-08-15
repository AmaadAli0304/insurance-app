
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormState, useFormStatus } from "react-dom";
import { handleAddRequest } from "../actions";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockHospitals, mockCompanies } from "@/lib/mock-data";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} size="lg" className="w-full md:w-auto">
            {pending ? "Submitting..." : "Submit Pre-Authorization Request"}
        </Button>
    );
}

export default function NewRequestPage() {
    const { user } = useAuth();
    const [state, formAction] = useFormState(handleAddRequest, { message: "" });
    const hospital = mockHospitals.find(h => h.id === user?.hospitalId);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/pre-auths">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">New Pre-Authorization Request</h1>
            </div>
            <form action={formAction}>
                 <input type="hidden" name="hospitalId" value={user?.hospitalId || ''} />
                <div className="grid gap-6">
                    {/* Patient Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Patient Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="patientId">Patient ID (Internal)</Label>
                                <Input id="patientId" name="patientId" placeholder="e.g. HOSP-12345" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="patientName">Full Name</Label>
                                <Input id="patientName" name="patientName" placeholder="e.g. John Doe" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="patientDOB">Date of Birth</Label>
                                <Input id="patientDOB" name="patientDOB" type="date" required />
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
                                <Input id="patientContact" name="patientContact" placeholder="e.g. 555-123-4567" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="patientAddress">Full Address</Label>
                                <Input id="patientAddress" name="patientAddress" placeholder="e.g. 123 Main St, Anytown, USA" required />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Insurance Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Insurance Details</CardTitle>
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
                                <Label htmlFor="memberId">Member ID</Label>
                                <Input id="memberId" name="memberId" placeholder="e.g. MEM-XYZ-001" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="policyNumber">Policy Number</Label>
                                <Input id="policyNumber" name="policyNumber" placeholder="e.g. POL-1A2B3C" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="policyStartDate">Policy Start Date</Label>
                                <Input id="policyStartDate" name="policyStartDate" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="policyEndDate">Policy End Date</Label>
                                <Input id="policyEndDate" name="policyEndDate" type="date" required />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Admission & Hospital Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Admission & Hospital Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="hospitalName">Hospital Name</Label>
                                <Input id="hospitalName" name="hospitalName" defaultValue={hospital?.name} readOnly />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="admissionDate">Admission Date</Label>
                                <Input id="admissionDate" name="admissionDate" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expectedDischargeDate">Expected Discharge Date</Label>
                                <Input id="expectedDischargeDate" name="expectedDischargeDate" type="date" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="doctorName">Treating Doctor's Name</Label>
                                <Input id="doctorName" name="doctorName" placeholder="e.g. Dr. Emily Carter" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="doctorSpeciality">Doctor's Speciality</Label>
                                <Input id="doctorSpeciality" name="doctorSpeciality" placeholder="e.g. Cardiologist" required />
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Medical Details */}
                    <Card>
                         <CardHeader>
                            <CardTitle>Medical Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="diagnosis">Diagnosis (ICD Code)</Label>
                                <Input id="diagnosis" name="diagnosis" placeholder="e.g. C81.90" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="procedureCode">Procedure Code (CPT/HCPCS)</Label>
                                <Input id="procedureCode" name="procedureCode" placeholder="e.g. 27447" required />
                            </div>
                             <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="proposedTreatment">Proposed Treatment</Label>
                                <Input id="proposedTreatment" name="proposedTreatment" placeholder="e.g. Knee Replacement Surgery" required />
                            </div>
                             <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
                                <Input id="estimatedCost" name="estimatedCost" type="number" placeholder="e.g. 15200" required />
                            </div>
                             <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="clinicalNotes">Clinical Notes</Label>
                                <Textarea id="clinicalNotes" name="clinicalNotes" placeholder="Doctor’s summary of why treatment is needed..." required />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Supporting Documents */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Supporting Documents</CardTitle>
                            <CardDescription>Optional but recommended. Attach relevant files.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="patientIdProof">Patient ID Proof</Label>
                                <Button variant="outline" className="w-full justify-start gap-2"><Upload /> Upload File</Button>
                                <Input id="patientIdProof" name="patientIdProof" type="file" className="hidden" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="insuranceCard">Insurance Card</Label>
                                <Button variant="outline" className="w-full justify-start gap-2"><Upload /> Upload File</Button>
                                <Input id="insuranceCard" name="insuranceCard" type="file" className="hidden" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="medicalReports">Medical Reports</Label>
                                <Button variant="outline" className="w-full justify-start gap-2"><Upload /> Upload File</Button>
                                <Input id="medicalReports" name="medicalReports" type="file" className="hidden" />
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
