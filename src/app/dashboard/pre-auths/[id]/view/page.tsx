
"use client";

import { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    User, Hospital, Building, DollarSign, Stethoscope, Loader2, Edit, Mail, Phone, Calendar, Clock, Hash, 
    HeartPulse, Pill, FileText, Briefcase, UserCheck, Shield, AlertTriangle, Baby, CircleDollarSign,
    Info, Users, MapPin, Activity, History, Scissors, Syringe, MessageSquare
} from 'lucide-react';
import type { StaffingRequest, PreAuthStatus } from "@/lib/types";
import { getPreAuthRequestById } from "../../actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const DetailItem = ({ label, value, icon: Icon, className }: { label: string, value?: string | number | null | boolean, icon?: React.ElementType, className?: string }) => {
    let displayValue: React.ReactNode = "N/A";

    if (typeof value === 'boolean') {
        displayValue = value ? 'Yes' : 'No';
    } else if (value !== null && value !== undefined && value !== '') {
        displayValue = value;
    }

    return (
        <div className={cn("flex items-start gap-3", className)}>
            {Icon && <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />}
            <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="text-base font-semibold">{displayValue}</p>
            </div>
        </div>
    );
};


const getStatusVariant = (status?: PreAuthStatus | null) => {
    if (!status) return 'secondary';
    switch (status) {
      case 'Approval':
      case 'Amount Sanctioned':
      case 'Amount Received':
      case 'Settlement Done':
      case 'Approved':
      case 'Pre auth Sent':
        return 'default';
      case 'Rejected':
        return 'destructive';
      case 'Query Raised':
      case 'Initial Approval Amount':
        return 'secondary';
      default: 
        return 'secondary';
    }
}

export default function ViewPreAuthPage() {
    const params = useParams();
    const id = params.id as string;
    const [request, setRequest] = useState<StaffingRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        getPreAuthRequestById(id)
            .then(data => {
                if (!data) {
                    notFound();
                } else {
                    setRequest(data);
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [id]);
    
    const formatDate = (dateString?: string | null, includeTime: boolean = false) => {
        if (!dateString) return "N/A";
        try {
            const formatString = includeTime ? 'MMMM dd, yyyy p' : 'MMMM dd, yyyy';
            return format(new Date(dateString), formatString);
        } catch {
            return "Invalid Date";
        }
    };


    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!request) {
        return notFound();
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Pre-Authorization Request</CardTitle>
                            <CardDescription>Viewing request ID <span className="font-mono">{request.id}</span> for <span className="font-semibold">{request.fullName}</span></CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button asChild variant="outline">
                                <Link href={`/dashboard/pre-auths/${id}/edit`} className="flex items-center gap-2">
                                  <Edit className="h-4 w-4" /> Edit Status
                                </Link>
                            </Button>
                            <Badge variant={getStatusVariant(request.status)} className={`text-lg px-4 py-1`}>{request.status || 'N/A'}</Badge>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Patient Details</CardTitle></CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <DetailItem label="Full Name" value={request.fullName} icon={User} />
                            <DetailItem label="Email" value={request.email_address} icon={Mail} />
                            <DetailItem label="Phone" value={request.phoneNumber} icon={Phone} />
                            <DetailItem label="Date of Birth" value={formatDate(request.birth_date)} icon={Calendar} />
                            <DetailItem label="Age" value={request.age} icon={Hash} />
                            <DetailItem label="Gender" value={request.gender} icon={Users} />
                            <DetailItem label="ABHA ID" value={request.abha_id} icon={Hash} />
                            <DetailItem label="Health ID" value={request.health_id} icon={Hash} />
                            <DetailItem label="Occupation" value={request.occupation} icon={Briefcase} />
                            <DetailItem label="Address" value={request.address} className="md:col-span-2" icon={MapPin} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Insurance &amp; Admission</CardTitle></CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <DetailItem label="Insurance Company" value={request.companyName} icon={Building} />
                            <DetailItem label="Policy Number" value={request.policyNumber} icon={FileText} />
                            <DetailItem label="Member ID" value={request.insured_card_number} icon={Hash} />
                            <DetailItem label="Relationship to Policyholder" value={request.relationship_policyholder} icon={UserCheck} />
                            <DetailItem label="Admission ID" value={request.admission_id} icon={Hash} />
                            <DetailItem label="Claim ID" value={request.claim_id} icon={Hash} />
                            <DetailItem label="Admission Date" value={`${formatDate(request.admissionDate)} at ${request.admissionTime || ''}`} icon={Calendar} />
                            <DetailItem label="Admission Type" value={request.admissionType} icon={Info} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Clinical Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <DetailItem label="Treating Doctor" value={request.treat_doc_name} icon={Stethoscope} />
                            <DetailItem label="Provisional Diagnosis" value={request.provisionalDiagnosis} icon={HeartPulse} />
                            <DetailItem label="Nature of Illness" value={request.natureOfIllness} icon={Pill}/>
                            <DetailItem label="Past History" value={request.pastHistory} icon={History} />
                            <DetailItem label="Proposed Medical Treatment" value={request.treatmentMedical} icon={Syringe} />
                             <DetailItem label="Proposed Surgical Treatment" value={request.treatmentSurgical} icon={Scissors} />
                        </CardContent>
                    </Card>

                    {(request.isInjury || request.isMaternity) && (
                         <Card>
                            <CardHeader><CardTitle>Additional Case Details</CardTitle></CardHeader>
                             <CardContent className="grid md:grid-cols-2 gap-4">
                                {request.isInjury && <DetailItem label="Injury Case" value={request.isInjury} icon={AlertTriangle} />}
                                {request.isInjury && <DetailItem label="Injury Cause" value={request.injuryCause} icon={Info} />}
                                {request.isMaternity && <DetailItem label="Maternity Case" value={request.isMaternity} icon={Baby} />}
                                {request.isMaternity && <DetailItem label="G | P | L | A" value={`${request.g || 'N/A'} | ${request.p || 'N/A'} | ${request.l || 'N/A'} | ${request.a || 'N/A'}`} icon={Hash} />}
                            </CardContent>
                        </Card>
                    )}
                 </div>

                 <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Cost Estimate</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                             <DetailItem label="Estimated Total Cost" value={request.totalExpectedCost ? `₹${request.totalExpectedCost.toLocaleString()}` : 'N/A'} icon={CircleDollarSign} />
                             <DetailItem label="Amount Sanctioned" value={request.amount_sanctioned ? `₹${request.amount_sanctioned.toLocaleString()}` : 'N/A'} icon={DollarSign} />
                             <DetailItem label="Expected Stay" value={request.expectedStay ? `${request.expectedStay} days` : 'N/A'} icon={Clock} />
                             <DetailItem label="Room Category" value={request.roomCategory} icon={Building} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Status & Notes</CardTitle></CardHeader>
                        <CardContent>
                             <p className="text-muted-foreground">{request.reason || "No notes available for this request."}</p>
                        </CardContent>
                    </Card>
                 </div>
            </div>
            {request.chatHistory && request.chatHistory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Communication History</CardTitle>
                        <CardDescription>A log of all email communications for this request.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Accordion type="single" collapsible className="w-full">
                            {request.chatHistory.map((chat) => (
                                <AccordionItem value={`item-${chat.id}`} key={chat.id}>
                                    <AccordionTrigger>
                                        <div className="flex flex-col items-start text-left">
                                            <p className="font-semibold text-sm">{chat.subject}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                From: {chat.from_email} | To: {chat.to_email} | On: {formatDate(chat.created_at, true)}
                                            </p>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="p-4 border rounded-md bg-muted/50 text-sm prose-sm max-w-full" dangerouslySetInnerHTML={{ __html: chat.body || '<p>No content available.</p>' }} />
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
