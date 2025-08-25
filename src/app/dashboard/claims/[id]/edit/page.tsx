
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormStatus } from "react-dom";
import { handleUpdateClaim } from "../../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { mockClaims, mockPatients } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClaimStatus } from "@/lib/types";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Update Claim"}
        </Button>
    );
}

export default function EditClaimPage({ params }: { params: { id: string } }) {
    const claim = mockClaims.find(c => c.id === params.id);
    const [state, formAction] = useActionState(handleUpdateClaim, { message: "" });

    if (!claim) {
        notFound();
    }
    
    const patient = mockPatients.find(p => p.id === claim.patientId);
    const claimStatuses: ClaimStatus[] = ['Processing', 'Approved', 'Paid', 'Rejected', 'Appealed'];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/claims">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">Edit Claim</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Update Claim Status</CardTitle>
                    <CardDescription>Review claim details and update its status.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="id" value={claim.id} />
                        
                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 p-4 border rounded-lg bg-muted/50">
                             <div><span className="font-semibold">Patient:</span> {patient?.fullName}</div>
                             <div><span className="font-semibold">Policy Number:</span> {patient?.policyNumber}</div>
                             <div><span className="font-semibold">Claim Amount:</span> ${claim.claimAmount.toLocaleString()}</div>
                             <div><span className="font-semibold">Pre-Auth ID:</span> {claim.requestId}</div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Claim Status</Label>
                            <Select name="status" required defaultValue={claim.status}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {claimStatuses.map(s => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                         <div className="space-y-2">
                            <Label htmlFor="paidAmount">Paid Amount ($)</Label>
                            <Input id="paidAmount" name="paidAmount" type="number" defaultValue={claim.paidAmount} placeholder="Enter amount if status is 'Paid'" />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" name="notes" defaultValue={claim.notes} placeholder="Add or update notes for this claim." />
                        </div>

                        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
