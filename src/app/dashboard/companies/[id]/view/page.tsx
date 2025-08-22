
import { getCompanyById } from "../../actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Building, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DetailItem = ({ label, value }: { label: string, value?: string | null }) => (
    <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base">{value || "N/A"}</p>
    </div>
);

const AssociationList = ({ title, items, icon }: { title: string, items: { id: string | number, name: string }[], icon: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center gap-4">
            {icon}
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
            {items.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {items.map(item => <Badge key={item.id} variant="secondary">{item.name}</Badge>)}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">No {title.toLowerCase()} assigned.</p>
            )}
        </CardContent>
    </Card>
);

export default async function ViewCompanyPage({ params }: { params: { id: string } }) {
    const company = await getCompanyById(params.id);

    if (!company) {
        notFound();
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/companies">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Company Details</h1>
                    <p className="text-muted-foreground">Viewing profile for {company.name}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Primary contact and location details for the company.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailItem label="Company Name" value={company.name} />
                    <DetailItem label="Contact Person" value={company.contactPerson} />
                    <DetailItem label="Official Email" value={company.email} />
                    <DetailItem label="Phone Number" value={company.phone} />
                    <DetailItem label="Portal Link" value={company.portalLink} />
                    <DetailItem label="Full Address" value={company.address} />
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
                 <AssociationList 
                    title="Assigned Hospitals" 
                    items={company.assignedHospitalsDetails || []} 
                    icon={<Building className="h-6 w-6 text-primary" />} 
                />
            </div>
        </div>
    );
}
