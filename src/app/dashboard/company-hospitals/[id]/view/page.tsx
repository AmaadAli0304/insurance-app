
"use client";

import { useState, useEffect, use } from "react";
import { getHospitalById, getStaff, getCompaniesForForm, getTPAsForForm } from "../../actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Factory, Briefcase, Users, Mail, Phone, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Hospital, Staff, Company, TPA } from "@/lib/types";
import { useParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const DetailItem = ({ label, value, icon: Icon }: { label: string, value?: string | null, icon: React.ElementType }) => (
    <div className="flex items-start gap-3">
        <Icon className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
        <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-base">{value || "N/A"}</p>
        </div>
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

export default function ViewHospitalPage() {
    const params = useParams();
    const id = params.id as string;
    const [hospital, setHospital] = useState<Hospital | null>(null);
    const [assignedStaff, setAssignedStaff] = useState<{ id: string | number; name: string; }[]>([]);
    const [assignedCompanies, setAssignedCompanies] = useState<{ id: string | number; name: string; }[]>([]);
    const [assignedTPAs, setAssignedTPAs] = useState<{ id: string | number; name: string; }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                const hospitalData = await getHospitalById(id);
                if (!hospitalData) {
                    notFound();
                    return;
                }
                setHospital(hospitalData);

                // Fetch all related data in parallel for efficiency
                const [allStaff, allCompanies, allTPAs] = await Promise.all([
                    getStaff(),
                    getCompaniesForForm(),
                    getTPAsForForm()
                ]);

                // Filter to find the assigned items
                setAssignedStaff(allStaff.filter(s => hospitalData.assignedStaff?.includes(s.id)));
                setAssignedCompanies(allCompanies.filter(c => hospitalData.assignedCompanies?.includes(c.id)));
                setAssignedTPAs(allTPAs.filter(t => hospitalData.assignedTPAs?.includes(String(t.id))).map(t => ({id: t.id, name: t.name!})));

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

    if (!hospital) {
        // This case should be handled by notFound() inside useEffect, but as a fallback:
        return <div>Hospital not found.</div>;
    }
    
    const getInitials = (name: string) => {
        if (!name || typeof name !== 'string') return 'H';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-center gap-6">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={hospital.photo ?? undefined} alt={hospital.name} />
                        <AvatarFallback>{getInitials(hospital.name)}</AvatarFallback>
                    </Avatar>
                     <div className="flex-1 text-center md:text-left">
                        <CardTitle className="text-3xl">{hospital.name}</CardTitle>
                        <CardDescription>Primary contact and location details.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t">
                    <DetailItem label="Contact Person" value={hospital.contactPerson} icon={Users} />
                    <DetailItem label="Official Email" value={hospital.email} icon={Mail} />
                    <DetailItem label="Phone Number" value={hospital.phone} icon={Phone} />
                    <DetailItem label="Location / City" value={hospital.location} icon={MapPin} />
                    <DetailItem label="Full Address" value={hospital.address} className="md:col-span-2" icon={MapPin}/>
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
                    items={assignedTPAs}
                    icon={<Briefcase className="h-6 w-6 text-primary" />} 
                />
                 <AssociationList 
                    title="Assigned Staff" 
                    items={assignedStaff}
                    icon={<Users className="h-6 w-6 text-primary" />} 
                />
            </div>
        </div>
    );
}
