
import { getTPAById } from "../../actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building } from "lucide-react";
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

export default async function ViewTPAPage({ params }: { params: { id: string } }) {
    const tpaId = Number(params.id);
    if (isNaN(tpaId)) {
        notFound();
    }
    const tpa = await getTPAById(tpaId);

    if (!tpa) {
        notFound();
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Primary contact and location details for {tpa.name}.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailItem label="TPA Name" value={tpa.name} />
                    <DetailItem label="Official Email" value={tpa.email} />
                    <DetailItem label="Phone Number" value={tpa.phone} />
                    <DetailItem label="Portal Link" value={tpa.portalLink} />
                    <DetailItem label="Full Address" value={tpa.address} />
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
                 <AssociationList 
                    title="Assigned Hospitals" 
                    items={tpa.assignedHospitalsDetails || []} 
                    icon={<Building className="h-6 w-6 text-primary" />} 
                />
            </div>
        </div>
    );
}
