
"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdateRequest, getPreAuthRequestById } from "../../actions";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { StaffingRequest, PreAuthStatus } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Update Status"}
        </Button>
    );
}

const preAuthStatuses: PreAuthStatus[] = [
    'Pending',
    'Query Raised',
    'Query Answered',
    'Initial Approval Amount',
    'Approval',
    'Amount Sanctioned',
    'Amount Received',
    'Settlement Done',
    'Rejected',
    'Draft'
];

export default function EditPreAuthPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;
    
    const [request, setRequest] = useState<StaffingRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [state, formAction] = useActionState(handleUpdateRequest, { message: "", type: 'initial' });
    
    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        getPreAuthRequestById(id)
            .then(data => {
                if (!data) notFound();
                else setRequest(data);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [id]);

    useEffect(() => {
        if (state.type === 'success') {
            toast({ title: "Success", description: state.message, variant: "success" });
            router.push(`/dashboard/pre-auths`);
        } else if (state.type === 'error') {
            toast({ title: "Error", description: state.message, variant: "destructive" });
        }
    }, [state, toast, router, id]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!request) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href={`/dashboard/pre-auths`}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">Update Pre-Auth Status</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Request Details</CardTitle>
                    <CardDescription>Update the status for request <span className="font-mono">{request.id}</span>.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="id" value={request.id} />
                        
                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 p-4 border rounded-lg bg-muted/50">
                            <div><span className="font-semibold">Patient:</span> {request.fullName}</div>
                            <div><span className="font-semibold">Policy Number:</span> {request.policyNumber}</div>
                            <div><span className="font-semibold">Amount:</span> ${request.totalExpectedCost?.toLocaleString()}</div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Pre-Auth Status</Label>
                            <Select name="status" required defaultValue={request.status}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {preAuthStatuses.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="amount">Sanctioned Amount ($)</Label>
                            <Input id="amount" name="amount" type="number" step="0.01" defaultValue={request.amount_sanctioned ?? undefined} placeholder="Enter sanctioned amount" />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="claim_id">Official Claim ID</Label>
                            <Input id="claim_id" name="claim_id" defaultValue={request.claim_id ?? ''} placeholder="Enter official claim ID from TPA/Insurer" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason / Notes</Label>
                            <Textarea id="reason" name="reason" defaultValue={request.reason ?? ""} placeholder="Add a reason for the status update." />
                        </div>
                        
                        {state.message && state.type === 'error' && <p className="text-sm text-destructive">{state.message}</p>}
                        <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
