
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormStatus } from "react-dom";
import { handleUpdatePatient } from "../../actions";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { mockPatients, mockCompanies, mockHospitals } from "@/lib/mock-data";
import { notFound } from "next/navigation";
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

export default function EditPatientPage({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const patient = mockPatients.find(p => p.id === params.id);
    const [state, formAction] = useActionState(handleUpdatePatient, { message: "" });
    const hospital = mockHospitals.find(h => h.id === patient?.hospitalId);

    const assignedCompanies = useMemo(() => {
        if (!hospital) return [];
        return mockCompanies.filter(c => hospital.assignedCompanies.includes(c.id));
    }, [hospital]);

    if (!patient) {
        notFound();
    }

    return (
        <div className="space-y-6">
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
                                <Select name="insuranceCompany" required defaultValue={patient.companyId}>
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
                    
                    {/* Admission & Hospital Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>3. Admission & Hospital Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="hospitalName">Hospital Name</Label>
                                <Input id="hospitalName" name="hospitalName" defaultValue={hospital?.name} readOnly />
                                <input type="hidden" name="hospitalId" value={patient.hospitalId} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="doctorName">Doctor Name</Label>
                                <Input id="doctorName" name="doctorName" defaultValue={patient.doctorName} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="doctorSpeciality">Doctor Speciality</Label>
                                <Input id="doctorSpeciality" name="doctorSpeciality" defaultValue={patient.doctorSpeciality} placeholder="e.g., Cardiologist" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="admissionDate">Planned Admission Date</Label>
                                <Input id="admissionDate" name="admissionDate" type="date" defaultValue={patient.admissionDate} required />
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
                                <Input id="diagnosis" name="diagnosis" defaultValue={patient.diagnosis} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="proposedTreatment">Proposed Treatment</Label>
                                <Input id="proposedTreatment" name="proposedTreatment" defaultValue={patient.proposedTreatment} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="procedureCode">Procedure Code (optional)</Label>
                                <Input id="procedureCode" name="procedureCode" defaultValue={patient.procedureCode} placeholder="CPT/HCPCS code" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
                                <Input id="estimatedCost" name="estimatedCost" type="number" defaultValue={patient.estimatedCost} required />
                            </div>
                             <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="clinicalNotes">Clinical Notes (optional)</Label>
                                <Textarea id="clinicalNotes" name="clinicalNotes" defaultValue={patient.clinicalNotes} placeholder="Doctor's summary of why treatment is needed" />
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
