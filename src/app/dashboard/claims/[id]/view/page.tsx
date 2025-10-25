

"use client";

import { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Claim, ClaimStatus } from "@/lib/types";
import { getClaimById } from "../../actions";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DetailItem = ({ label, value, className, isCurrency = false }: { label: string, value?: string | number | null, className?: string, isCurrency?: boolean }) => {
    let displayValue: React.ReactNode = "N/A";

    if (value !== null && value !== undefined && value !== '') {
        if (isCurrency && typeof value === 'number') {
            displayValue = value.toLocaleString('en-IN');
        } else {
            displayValue = String(value);
        }
    }
    
    return (
        <div className={className}>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-base">{displayValue}</p>
        </div>
    );
};


const getStatusVariant = (status: ClaimStatus) => {
    switch (status) {
      case 'Paid':
      case 'Settlement Done':
        return 'badge-purple';
      case 'Rejected':
        return 'destructive';
      case 'Processing':
      case 'Pending':
      case 'Query Answered':
        return 'badge-yellow';
       case 'Approved':
       case 'Approval':
       case 'Amount Sanctioned':
       case 'Initial Approval':
       case 'Final Approval':
        return 'badge-green';
       case 'Query Raised':
        return 'badge-orange';
       case 'Pre auth Sent':
        return 'badge-light-blue';
      default:
        return 'secondary';
    }
}


export default function ViewClaimPage() {
    const params = useParams();
    const id = params.id as string;
    const [claim, setClaim] = useState<Claim | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        getClaimById(id)
            .then(data => {
                if (!data) notFound();
                setClaim(data);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [id]);
    
    const formatDate = (dateInput?: string | null | Date) => {
        if (!dateInput) return "N/A";
        
        const dateString = typeof dateInput === 'string' ? dateInput : dateInput.toISOString();
        
        // The DB returns a string with timezone info, which JS Date constructor handles.
        // But for dates without time, it might assume UTC. Adding 'T00:00:00' helps.
        const date = new Date(dateString.includes('T') ? dateString : dateString.split(' ')[0] + 'T00:00:00');

        if (isNaN(date.getTime())) {
            return "Invalid Date";
        }
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    };

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
                        <Badge variant={getStatusVariant(claim.status)} className={cn('text-lg px-4 py-1')}>{claim.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {claim.status !== 'Settled' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Financial Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-3 gap-4">
                                {claim.status !== 'Final Approval' && claim.status !== 'Final Discharge sent' && <DetailItem label="Billed Amount" value={claim.amount} isCurrency />}
                                <DetailItem label="Last Updated" value={new Date(claim.updated_at).toLocaleDateString()} />
                            </CardContent>
                        </Card>
                    )}

                    {claim.status === 'Final Discharge sent' && (
                        <Card>
                            <CardHeader><CardTitle className="text-xl">Discharge Bill Details</CardTitle></CardHeader>
                            <CardContent className="grid md:grid-cols-3 gap-4">
                                <DetailItem label="Pharmacy Bill" value={claim.pharmacy_bill} isCurrency />
                                <DetailItem label="Lab Bill" value={claim.lab_bill} isCurrency />
                                <DetailItem label="CT Scan Charges" value={claim.ct_scan_charges} isCurrency />
                                <DetailItem label="MRI Charges" value={claim.mri_charges} isCurrency />
                                <DetailItem label="USG Charges" value={claim.usg_charges} isCurrency />
                                <DetailItem label="X-Ray Charges" value={claim.xray_charges} isCurrency />
                                <DetailItem label="Implant Charges" value={claim.implant_charges} isCurrency />
                                <DetailItem label="Other Charges" value={claim.other_charges} isCurrency />
                                <DetailItem label="MOU Discount" value={claim.mou_discount} isCurrency />
                            </CardContent>
                        </Card>
                    )}

                    {claim.status === 'Final Approval' && (
                         <Card>
                            <CardHeader><CardTitle className="text-xl">Final Approval Details</CardTitle></CardHeader>
                            <CardContent className="grid md:grid-cols-3 gap-4">
                                <DetailItem label="Final Hospital Bill" value={claim.final_bill} isCurrency />
                                <DetailItem label="Hospital Discount" value={claim.hospital_discount} isCurrency />
                                <DetailItem label="NM Deductions" value={claim.nm_deductions} isCurrency />
                                <DetailItem label="Co-Pay" value={claim.co_pay} isCurrency />
                                <DetailItem label="MOU Discount" value={claim.mou_discount} isCurrency />
                                <DetailItem label="Final Authorised Amount" value={claim.finalAuthorisedAmount} isCurrency />
                                <DetailItem label="Amount Paid by Insured" value={claim.amountPaidByInsured} isCurrency />
                            </CardContent>
                        </Card>
                    )}
                    
                    {claim.status === 'Settled' && (
                         <Card>
                            <CardHeader><CardTitle className="text-xl">Settlement Details</CardTitle></CardHeader>
                            <CardContent className="grid md:grid-cols-3 gap-4">
                                <DetailItem label="Final Authorised Amount" value={claim.final_amount} isCurrency />
                                <DetailItem label="Deduction" value={claim.nm_deductions} isCurrency />
                                <DetailItem label="TDS" value={claim.tds} isCurrency />
                                <DetailItem label="MOU Discount" value={claim.mou_discount} isCurrency />
                                <DetailItem label="Final Settlement Amount" value={claim.final_settle_amount} isCurrency />
                                <DetailItem label="Net Amount Credited" value={claim.amount} isCurrency />
                                <DetailItem label="UTR No" value={claim.utr_no} />
                                <DetailItem label="Date of Settlement" value={formatDate(claim.date_settlement)} />
                            </CardContent>
                        </Card>
                    )}


                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Patient & Provider</CardTitle>
                        </CardHeader>
                         <CardContent className="grid md:grid-cols-2 gap-4">
                            <DetailItem label="Patient Name" value={claim.Patient_name} />
                            <DetailItem label="Insurance Company" value={claim.companyName} />
                            <DetailItem label="Hospital" value={claim.hospitalName} />
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Associated Pre-Authorization</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <DetailItem label="Request ID" value={claim.preauthId} />
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
