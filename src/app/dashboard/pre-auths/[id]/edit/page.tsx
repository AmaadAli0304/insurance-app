
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
import { useMemo } from "react";

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
    
    const hospitalPatients = useMemo(() => {
        return mockPatients.filter(p => p.hospitalId === user?.hospitalId);
    }, [user?.hospitalId]);

    const assignedCompanies = useMemo(() => {
        const patientCompanies = hospitalPatients.map(p => p.companyId);
        return mockCompanies.filter(c => patientCompanies.includes(c.id));
    }, [hospitalPatients]);

    if (!request) {
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

                        <div className="space-y-2">
                            <Label htmlFor="patientId">Patient</Label>
                            <Select name="patientId" required defaultValue={request.patientId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a patient" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hospitalPatients.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="companyId">Staffing Company</Label>
                            <Select name="companyId" required defaultValue={request.companyId}>
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
                            <Label htmlFor="packageId">Staffing Package ID</Label>
                            <Input id="packageId" name="packageId" defaultValue={request.packageId} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="requestAmount">Request Amount ($)</Label>
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
                            <Label htmlFor="details">Request Details</Label>
                            <Textarea id="details" name="details" defaultValue={request.details} required />
                        </div>

                        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                        <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
