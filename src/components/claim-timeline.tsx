
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, HelpCircle, Send, MessageSquare, HandCoins, BadgeDollarSign, FileCheck2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Claim, ClaimStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ClaimTimelineProps {
  claims: Claim[];
  patientName: string;
}

const getStatusDetails = (status: ClaimStatus) => {
    switch (status) {
        case 'Pre auth Sent':
             return { icon: Send, color: 'text-blue-500', description: 'Pre-authorization sent to TPA/Insurer' };
        case 'Pending':
            return { icon: CheckCircle2, color: 'text-orange-500', description: 'Preauth submitted' };
        case 'Query Raised':
            return { icon: HelpCircle, color: 'text-yellow-600', description: 'TPA requested more information' };
        case 'Query Answered':
             return { icon: MessageSquare, color: 'text-purple-500', description: 'Hospital provided the requested information' };
        case 'Initial Approval Amount':
        case 'Approved':
            return { icon: BadgeDollarSign, color: 'text-teal-500', description: 'Approved an initial amount' };
        case 'Amount Sanctioned':
             return { icon: HandCoins, color: 'text-indigo-500', description: 'Final amount approved' };
        case 'Amount Received':
            return { icon: CheckCircle2, color: 'text-green-600', description: 'Payment received from TPA/Insurer' };
        case 'Settlement Done':
        case 'Paid':
            return { icon: FileCheck2, color: 'text-green-700', description: 'Claim closed and settled' };
        case 'Rejected':
            return { icon: AlertCircle, color: 'text-red-600', description: 'Claim rejected' };
        default:
            return { icon: CheckCircle2, color: 'text-gray-500', description: status };
    }
};

export function ClaimTimeline({ claims, patientName }: ClaimTimelineProps) {
    if (!claims || claims.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Communication Timeline</CardTitle>
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
                <CardTitle className="text-2xl font-bold">Communication Timeline</CardTitle>
                <CardDescription>Patient: {patientName}</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="relative pl-8">
                     {claims.map((claim, index) => {
                        const statusDetails = getStatusDetails(claim.status);
                        const Icon = statusDetails.icon;
                        
                        return (
                            <div key={claim.id} className="flex items-start mb-8 last:mb-0">
                                {index < claims.length -1 && <div className="absolute left-[15px] top-6 h-full w-0.5 bg-gray-200"></div>}
                                <div className="absolute left-0 flex items-center justify-center">
                                     <div className={cn("z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background", statusDetails.color)}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                </div>
                                <div className="ml-6 flex-1">
                                    <p className="font-semibold text-base">{claim.status}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {claim.reason || statusDetails.description} on {format(new Date(claim.updated_at), 'dd MMM yyyy, p')}
                                    </p>
                                    {claim.paidAmount && (
                                        <p className="text-sm text-muted-foreground mt-1">Approved INR {claim.paidAmount.toLocaleString()} on {format(new Date(claim.updated_at), 'dd MMM yyyy, p')}</p>
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
