
"use client";

import { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Claim, ClaimStatus } from "@/lib/types";
import { getClaimById } from "../../actions";
import { Loader2 } from "lucide-react";

const DetailItem = ({ label, value, className }: { label: string, value?: string | number | null, className?: string }) => (
    <div className={className}>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base">{value || "N/A"}</p>
    </div>
);

const getStatusVariant = (status: ClaimStatus) => {
    switch (status) {
      case 'Paid':
      case 'Settlement Done':
        return 'default';
      case 'Rejected':
        return 'destructive';
      case 'Processing':
      case 'Pending':
      case 'Query Answered':
        return 'secondary';
       case 'Approved':
       case 'Approval':
       case 'Amount Sanctioned':
       case 'Amount Received':
        return 'default'
      default:
        return 'secondary';
    }
}


export default function ViewClaimPage({ params }: { params: { id: string } }) {
    const [claim, setClaim] = useState<Claim | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!params.id) return;
        setIsLoading(true);
        getClaimById(params.id)
            .then(data => {
                if (!data) notFound();
                setClaim(data);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [params.id]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!claim) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Claim Details</CardTitle>
                            <CardDescription>Viewing claim <span className="font-mono">{claim.claim_id || claim.id}</span></CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(claim.status)} className={`text-lg px-4 py-1 ${claim.status === 'Paid' || claim.status === 'Approved' ? 'bg-accent text-accent-foreground' : ''}`}>{claim.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Financial Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                             <DetailItem label="Claimed Amount" value={claim.claimAmount ? claim.claimAmount.toLocaleString() : "N/A"} />
                             <DetailItem label="Paid Amount" value={claim.paidAmount ? claim.paidAmount.toLocaleString(): "N/A"} />
                             <DetailItem label="Last Updated" value={new Date(claim.updated_at).toLocaleDateString()} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Patient & Provider</CardTitle>
                        </CardHeader>
                         <CardContent className="grid md:grid-cols-2 gap-4">
                            <DetailItem label="Patient Name" value={claim.Patient_name} />
                            <DetailItem label="Policy Number" value={claim.policyNumber} />
                            <DetailItem label="Insurance Company" value={claim.companyName} />
                            <DetailItem label="Hospital" value={claim.hospitalName} />
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Associated Pre-Authorization</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <DetailItem label="Request ID" value={claim.admission_id} />
                            <DetailItem label="Request Subject" value={claim.reason} />
                            <DetailItem label="Request Date" value={new Date(claim.created_at).toLocaleDateString()} />
                        </CardContent>
                    </Card>

                    {claim.reason && (
                        <Card>
                            <CardHeader><CardTitle className="text-xl">Notes</CardTitle></CardHeader>
                            <CardContent><p className="text-muted-foreground">{claim.reason}</p></CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
