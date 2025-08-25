
"use client";

import { useState, useEffect, use } from "react";
import { getCompanyById } from "../../actions";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Company } from "@/lib/types";

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

export default function ViewCompanyPage() {
    const params = useParams();
    const id = params.id as string;
    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                const companyData = await getCompanyById(id);
                if (!companyData) {
                    notFound();
                    return;
                }
                setCompany(companyData);
            } catch (err) {
                const dbError = err as Error;
                setError(dbError.message);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [id]);


    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                 <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-destructive">Error: {error}</div>;
    }

    if (!company) {
        return <div>Company not found.</div>;
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Primary contact and location details for {company.name}.</CardDescription>
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
