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
import type { StaffingRequest } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Update Status"}
        </Button>
    );
}

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
            router.push(`/dashboard/pre-auths/${id}/view`);
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
                    <Link href={`/dashboard/pre-auths/${id}/view`}>
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
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Approved">Approved</SelectItem>
                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {state.message && state.type === 'error' && <p className="text-sm text-destructive">{state.message}</p>}
                        <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
