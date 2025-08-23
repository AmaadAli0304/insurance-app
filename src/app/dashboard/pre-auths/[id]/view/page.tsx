
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockStaffingRequests, mockPatients, mockHospitals, mockCompanies } from "@/lib/mock-data";
import { Mail, User, Hospital, Building, DollarSign, Stethoscope } from 'lucide-react';
import type { StaffingRequest } from "@/lib/types";

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

export default async function ViewPreAuthPage({ params }: { params: { id: string } }) {
    const request = mockStaffingRequests.find(r => r.id === params.id);

    if (!request) {
        notFound();
    }
    
    const patient = mockPatients.find(p => p.id === request.patientId);
    const hospital = mockHospitals.find(h => h.id === request.hospitalId);
    const company = mockCompanies.find(c => c.id === request.companyId);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Pre-Authorization Details</CardTitle>
                            <CardDescription>Viewing request <span className="font-mono">{request.id}</span></CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(request.status)} className={`text-lg px-4 py-1 ${request.status === 'Approved' ? 'bg-accent text-accent-foreground' : ''}`}>{request.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DetailItem label="Patient Name" value={patient?.fullName} icon={User} />
                        <DetailItem label="Hospital" value={hospital?.name} icon={Hospital} />
                        <DetailItem label="Insurance Company" value={company?.name} icon={Building} />
                        <DetailItem label="Treating Doctor" value={patient?.doctorName} icon={Stethoscope} />
                        <DetailItem label="Estimated Cost" value={patient ? `$${patient.estimatedCost.toLocaleString()}`: "N/A"} icon={DollarSign} />
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
                                <p className="whitespace-pre-wrap">{request.details}</p>
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    );
}
