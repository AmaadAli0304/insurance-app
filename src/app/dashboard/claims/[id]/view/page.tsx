
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockClaims, mockPatients, mockStaffingRequests, mockHospitals, mockCompanies } from "@/lib/mock-data";
import type { ClaimStatus } from "@/lib/types";

const DetailItem = ({ label, value, className }: { label: string, value?: string | number | null, className?: string }) => (
    <div className={className}>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base">{value || "N/A"}</p>
    </div>
);

const getStatusVariant = (status: ClaimStatus) => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Rejected':
        return 'destructive';
      case 'Processing':
      case 'Appealed':
        return 'secondary';
       case 'Approved':
        return 'default'
      default:
        return 'secondary';
    }
}


export default async function ViewClaimPage({ params }: { params: { id: string } }) {
    const claim = mockClaims.find(c => c.id === params.id);

    if (!claim) {
        notFound();
    }
    
    const patient = mockPatients.find(p => p.id === claim.patientId);
    const request = mockStaffingRequests.find(r => r.id === claim.requestId);
    const hospital = mockHospitals.find(h => h.id === claim.hospitalId);
    const company = mockCompanies.find(c => c.id === claim.companyId);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Claim Details</CardTitle>
                            <CardDescription>Viewing claim <span className="font-mono">{claim.id}</span></CardDescription>
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
                             <DetailItem label="Claimed Amount" value={`$${claim.claimAmount.toLocaleString()}`} />
                             <DetailItem label="Paid Amount" value={claim.paidAmount ? `$${claim.paidAmount.toLocaleString()}`: "N/A"} />
                             <DetailItem label="Last Updated" value={new Date(claim.updatedAt).toLocaleDateString()} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Patient & Provider</CardTitle>
                        </CardHeader>
                         <CardContent className="grid md:grid-cols-2 gap-4">
                            <DetailItem label="Patient Name" value={patient?.fullName} />
                            <DetailItem label="Policy Number" value={patient?.policyNumber} />
                            <DetailItem label="Insurance Company" value={company?.name} />
                            <DetailItem label="Hospital" value={hospital?.name} />
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Associated Pre-Authorization</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <DetailItem label="Request ID" value={request?.id} />
                            <DetailItem label="Request Subject" value={request?.subject} />
                            <DetailItem label="Request Date" value={request ? new Date(request.createdAt).toLocaleDateString() : 'N/A'} />
                        </CardContent>
                    </Card>

                    {claim.notes && (
                        <Card>
                            <CardHeader><CardTitle className="text-xl">Notes</CardTitle></CardHeader>
                            <CardContent><p className="text-muted-foreground">{claim.notes}</p></CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
