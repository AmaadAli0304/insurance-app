
"use client";

import { useMemo, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormStatus } from "react-dom";
import { handleAddClaim } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockPatients, mockStaffingRequests } from "@/lib/mock-data";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Submitting..." : "Submit Claim"}
        </Button>
    );
}

export default function NewClaimPage() {
    const { user, role } = useAuth();
    const [state, formAction] = useActionState(handleAddClaim, { message: "" });
    
    const relevantPatients = useMemo(() => {
        if (role === 'Company Admin') {
             return mockPatients.filter(p => p.companyId === user?.companyId);
        }
        return mockPatients.filter(p => p.hospitalId === user?.hospitalId);
    }, [user, role]);
    
    const approvedRequests = useMemo(() => {
        if (role === 'Company Admin') {
            return mockStaffingRequests.filter(r => r.companyId === user?.companyId && r.status === 'Approved');
        }
        return mockStaffingRequests.filter(r => r.hospitalId === user?.hospitalId && r.status === 'Approved');
    }, [user, role])

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Claim Details</CardTitle>
                    <CardDescription>Fill in the form to submit a new claim for processing.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                                <Label htmlFor="patientId">Patient</Label>
                                <Select name="patientId" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a patient" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {relevantPatients.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="requestId">Original Pre-Auth Request</Label>
                                <Select name="requestId" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an approved request" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {approvedRequests.map(r => (
                                            <SelectItem key={r.id} value={r.id}>{r.subject} ({r.id})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="claimAmount">Claim Amount ($)</Label>
                            <Input id="claimAmount" name="claimAmount" type="number" placeholder="e.g., 1250.00" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea id="notes" name="notes" placeholder="Add any relevant notes for the claim processor." />
                        </div>
                        
                        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
