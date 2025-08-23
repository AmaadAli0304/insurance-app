
import { getHospitalById, getStaff, getCompaniesForForm, getTPAsForForm } from "../../actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Factory, Briefcase, Users } from "lucide-react";
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

export default async function ViewHospitalPage({ params }: { params: { id: string } }) {
    const hospital = await getHospitalById(params.id);

    if (!hospital) {
        notFound();
    }

    const [allStaff, allCompanies, allTPAs] = await Promise.all([
        getStaff(),
        getCompaniesForForm(),
        getTPAsForForm()
    ]);

    const assignedStaff = allStaff.filter(s => hospital.assignedStaff?.includes(String(s.id)));
    const assignedCompanies = allCompanies.filter(c => hospital.assignedCompanies?.includes(c.id));
    const assignedTPAs = allTPAs.filter(t => hospital.assignedTPAs?.includes(String(t.id)));

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Primary contact and location details for {hospital.name}.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailItem label="Hospital Name" value={hospital.name} />
                    <DetailItem label="Contact Person" value={hospital.contactPerson} />
                    <DetailItem label="Official Email" value={hospital.email} />
                    <DetailItem label="Phone Number" value={hospital.phone} />
                    <DetailItem label="Location / City" value={hospital.location} />
                    <DetailItem label="Full Address" value={hospital.address} />
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
                 <AssociationList 
                    title="Assigned Companies" 
                    items={assignedCompanies} 
                    icon={<Factory className="h-6 w-6 text-primary" />} 
                />
                 <AssociationList 
                    title="Assigned TPAs" 
                    items={assignedTPAs.map(t => ({ id: t.id, name: t.name! }))}
                    icon={<Briefcase className="h-6 w-6 text-primary" />} 
                />
                 <AssociationList 
                    title="Assigned Staff" 
                    items={assignedStaff.map(s => ({ id: s.id, name: s.name! }))}
                    icon={<Users className="h-6 w-6 text-primary" />} 
                />
            </div>
        </div>
    );
}
