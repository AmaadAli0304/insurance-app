
"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormStatus } from "react-dom";
import { handleUpdateClaim, getClaimById } from "../../actions";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Claim, ClaimStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Update Claim"}
        </Button>
    );
}

const claimStatuses: ClaimStatus[] = ['Pending', 'Processing', 'Query Raised', 'Query Answered', 'Initial Approval Amount', 'Approval', 'Amount Sanctioned', 'Initial Approval', 'Settlement Done', 'Rejected', 'Appealed', 'Paid', 'Approved'];

export default function EditClaimPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;
    
    const [claim, setClaim] = useState<Claim | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [state, formAction] = useActionState(handleUpdateClaim, { message: "", type: "initial" });

    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        getClaimById(id)
            .then(data => {
                if (!data) notFound();
                else setClaim(data);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [id]);

     useEffect(() => {
        if (state.type === 'success') {
            toast({ title: "Success", description: state.message, variant: "success" });
            router.push(`/dashboard/claims`);
        } else if (state.type === 'error') {
            toast({ title: "Error", description: state.message, variant: "destructive" });
        }
    }, [state, toast, router, id]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!claim) {
        notFound();
    }

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
                             <div><span className="font-semibold">Patient:</span> {claim.Patient_name}</div>
                             <div><span className="font-semibold">Policy Number:</span> {claim.policyNumber}</div>
                             <div><span className="font-semibold">Claim Amount:</span> {claim.claimAmount?.toLocaleString()}</div>
                             <div><span className="font-semibold">Admission ID:</span> {claim.admission_id}</div>
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
                            <Label htmlFor="claim_id">Official Claim ID</Label>
                            <Input id="claim_id" name="claim_id" defaultValue={claim.claim_id ?? ''} placeholder="Enter official claim ID from TPA/Insurer" />
                        </div>
                        
                         <div className="space-y-2">
                            <Label htmlFor="paidAmount">Paid Amount</Label>
                            <Input id="paidAmount" name="paidAmount" type="number" step="0.01" defaultValue={claim.paidAmount ?? undefined} placeholder="Enter amount if status is 'Paid'" />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="reason">Notes / Reason</Label>
                            <Textarea id="reason" name="reason" defaultValue={claim.reason ?? ""} placeholder="Add or update notes for this claim." />
                        </div>

                        {state.message && state.type === 'error' && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
