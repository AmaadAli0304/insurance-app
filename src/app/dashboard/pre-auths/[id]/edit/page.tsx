
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormState, useFormStatus } from "react-dom";
import { handleUpdateRequest } from "../../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { mockStaffingRequests, mockPatients, mockCompanies } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

export default function EditRequestPage({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const request = mockStaffingRequests.find(r => r.id === params.id);
    const [state, formAction] = useFormState(handleUpdateRequest, { message: "" });
    
    const patient = mockPatients.find(p => p.id === request?.patientId);

    if (!request || !patient) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/pre-auths">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Edit Pre-Auth: {request.id}</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Update Pre-Auth Details</CardTitle>
                    <CardDescription>Modify the form to update the request information.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="id" value={request.id} />
                        <input type="hidden" name="hospitalId" value={user?.hospitalId || ''} />
                        <input type="hidden" name="patientId" value={patient.id} />
                        
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input id="subject" name="subject" defaultValue={request.subject} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Contact Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={request.email} required />
                            </div>
                           <div className="space-y-2">
                                <Label>Patient Name</Label>
                                <Input defaultValue={patient.fullName} readOnly />
                            </div>
                             <div className="space-y-2">
                                <Label>Patient ID</Label>
                                <Input defaultValue={patient.id} readOnly />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="companyId">Staffing Company</Label>
                                <Select name="companyId" required defaultValue={request.companyId}>
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
                                <Label htmlFor="packageId">Procedure Code</Label>
                                <Input id="packageId" name="packageId" defaultValue={request.packageId} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="requestAmount">Estimated Cost ($)</Label>
                                <Input id="requestAmount" name="requestAmount" type="number" defaultValue={request.requestAmount} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" required defaultValue={request.status}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="doctorName">Doctor's Name</Label>
                                <Input id="doctorName" name="doctorName" defaultValue={request.doctorName} required />
                            </div>
                              <div className="space-y-2">
                                <Label htmlFor="doctorSpeciality">Doctor's Speciality</Label>
                                <Input id="doctorSpeciality" name="doctorSpeciality" defaultValue={request.doctorSpeciality} required />
                            </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="proposedTreatment">Proposed Treatment</Label>
                                <Input id="proposedTreatment" name="proposedTreatment" defaultValue={request.proposedTreatment} required />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="details">Clinical Notes</Label>
                                <Textarea id="details" name="details" defaultValue={request.details} required rows={5} />
                            </div>
                        </div>

                        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                        <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
