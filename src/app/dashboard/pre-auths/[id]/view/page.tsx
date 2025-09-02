
"use client";

import { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, User, Hospital, Building, DollarSign, Stethoscope, Loader2 } from 'lucide-react';
import type { StaffingRequest } from "@/lib/types";
import { getPreAuthRequestById } from "../../actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const DetailItem = ({ label, value, icon: Icon }: { label: string, value?: string | number | null, icon: React.ElementType }) => (
    <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground mt-1" />
        <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-base font-semibold">{value || "N/A"}</p>
        </div>
    </div>
);

const getStatusVariant = (status: StaffingRequest['status']) => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Rejected':
        return 'destructive';
      case 'Pending':
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
                            <CardTitle>Pre-Authorization Details</CardTitle>
                            <CardDescription>Viewing request <span className="font-mono">{request.id}</span></CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button asChild variant="outline">
                                <Link href={`/dashboard/pre-auths/${id}/edit`}>Edit Status</Link>
                            </Button>
                            <Badge variant={getStatusVariant(request.status)} className={`text-lg px-4 py-1 ${request.status === 'Approved' ? 'bg-accent text-accent-foreground' : ''}`}>{request.status}</Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DetailItem label="Patient Name" value={request.fullName} icon={User} />
                        <DetailItem label="Hospital" value={request.hospitalName} icon={Hospital} />
                        <DetailItem label="Insurance Company" value={request.companyId} icon={Building} />
                        <DetailItem label="Treating Doctor" value={request.treat_doc_name} icon={Stethoscope} />
                        <DetailItem label="Estimated Cost" value={request.totalExpectedCost ? `$${request.totalExpectedCost.toLocaleString()}`: "N/A"} icon={DollarSign} />
                         <DetailItem label="Request Date" value={new Date(request.createdAt).toLocaleString()} icon={Mail} />
                    </div>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Request Email</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex gap-2">
                                <p className="font-semibold w-16">From:</p>
                                <p className="text-muted-foreground">{request.fromEmail}</p>
                            </div>
                            <div className="flex gap-2">
                                <p className="font-semibold w-16">To:</p>
                                <p className="text-muted-foreground">{request.email}</p>
                            </div>
                             <div className="flex gap-2">
                                <p className="font-semibold w-16">Subject:</p>
                                <p className="text-muted-foreground">{request.subject}</p>
                            </div>
                            <div className="pt-4 border-t">
                                <div dangerouslySetInnerHTML={{ __html: request.details || '' }} />
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    );
}
