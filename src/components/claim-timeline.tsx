
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, CircleDotDashed } from 'lucide-react';
import { format } from 'date-fns';
import type { Claim, ClaimStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ClaimTimelineProps {
  claims: Claim[];
  patientName: string;
}

const getStatusDetails = (status: ClaimStatus) => {
    switch (status) {
        case 'Pending':
            return { icon: CircleDotDashed, color: 'bg-yellow-500', description: 'Preauth submitted' };
        case 'Query Raised':
            return { icon: AlertCircle, color: 'bg-orange-500', description: 'TPA requested more information' };
        case 'Query Answered':
            return { icon: CheckCircle2, color: 'bg-blue-500', description: 'Hospital provided the requested information' };
        case 'Initial Approval Amount':
        case 'Amount Sanctioned':
            return { icon: CheckCircle2, color: 'bg-green-500', description: 'Approved an initial amount' };
        case 'Approval':
        case 'Approved':
            return { icon: CheckCircle2, color: 'bg-green-500', description: 'Claim approved' };
        case 'Amount Received':
            return { icon: CheckCircle2, color: 'bg-green-500', description: 'Payment received from TPA/Insurer' };
        case 'Settlement Done':
        case 'Paid':
            return { icon: CheckCircle2, color: 'bg-green-500', description: 'Claim closed and settled' };
        case 'Rejected':
            return { icon: AlertCircle, color: 'bg-red-500', description: 'Claim rejected' };
        default:
            return { icon: CircleDotDashed, color: 'bg-gray-500', description: '' };
    }
};

export function ClaimTimeline({ claims, patientName }: ClaimTimelineProps) {
    if (!claims || claims.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Claim Tracker</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>No claim history found for this patient.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Claim Tracker</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="relative pl-6">
                     {claims.map((claim, index) => {
                        const statusDetails = getStatusDetails(claim.status);
                        const Icon = statusDetails.icon;
                        
                        return (
                            <div key={claim.id} className="flex items-start mb-8 last:mb-0">
                                {index < claims.length -1 && <div className="absolute left-[11px] top-[32px] bottom-0 w-0.5 bg-border"></div>}
                                <div className="flex items-center justify-center mr-4">
                                     <div className={cn("z-10 flex items-center justify-center w-6 h-6 rounded-full", statusDetails.color)}>
                                        <Icon className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-base">{claim.status}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {claim.reason || statusDetails.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {format(new Date(claim.updated_at), 'dd MMM yyyy, h:mm a')}
                                    </p>
                                    {claim.paidAmount && (
                                        <p className="text-sm font-medium mt-1">Amount: ₹{claim.paidAmount.toLocaleString()}</p>
                                    )}
                                </div>
                            </div>
                        );
                     })}
                </div>
            </CardContent>
        </Card>
    );
}
