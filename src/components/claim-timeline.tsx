
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
            return { icon: CircleDotDashed, color: 'text-yellow-500', description: 'Preauth submitted' };
        case 'Query Raised':
            return { icon: AlertCircle, color: 'text-orange-500', description: 'TPA requested more information' };
        case 'Query Answered':
            return { icon: CheckCircle2, color: 'text-blue-500', description: 'Hospital provided the requested information' };
        case 'Initial Approval Amount':
        case 'Amount Sanctioned':
            return { icon: CheckCircle2, color: 'text-green-500', description: 'Approved an initial amount' };
        case 'Approval':
        case 'Approved':
            return { icon: CheckCircle2, color: 'text-green-500', description: 'Claim approved' };
        case 'Amount Received':
            return { icon: CheckCircle2, color: 'text-green-500', description: 'Payment received from TPA/Insurer' };
        case 'Settlement Done':
            return { icon: CheckCircle2, color: 'text-green-500', description: 'Claim closed and settled' };
        case 'Rejected':
            return { icon: AlertCircle, color: 'text-red-500', description: 'Claim rejected' };
        default:
            return { icon: CircleDotDashed, color: 'text-gray-500', description: '' };
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
                 <div className="relative pl-8">
                     {claims.map((claim, index) => {
                        const statusDetails = getStatusDetails(claim.status);
                        const Icon = statusDetails.icon;
                        
                        return (
                            <div key={claim.id} className="flex items-start mb-8 last:mb-0">
                                <div className="absolute left-0 flex flex-col items-center">
                                    <div className={cn("flex items-center justify-center w-8 h-8 rounded-full", statusDetails.color)}>
                                        <Icon className="w-5 h-5 text-white bg-current rounded-full p-0.5" />
                                    </div>
                                    {index < claims.length - 1 && (
                                        <div className="w-px h-full bg-gray-300 mt-2"></div>
                                    )}
                                </div>
                                <div className="ml-8">
                                    <p className="font-semibold text-lg">{claim.status}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {claim.reason || statusDetails.description} on {format(new Date(claim.updated_at), 'dd MMM yyyy')}
                                    </p>
                                    {claim.paidAmount && (
                                        <p className="text-sm font-medium">Amount: ₹{claim.paidAmount.toLocaleString()}</p>
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
