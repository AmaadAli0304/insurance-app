
"use client";

import { useState, useEffect } from "react";
import { getDoctorById, Doctor } from "../../actions";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Mail, Phone, Award, Fingerprint } from "lucide-react";

const DetailItem = ({ label, value, icon: Icon }: { label: string, value?: string | null, icon: React.ElementType }) => (
    <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground mt-1" />
        <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-base">{value || "N/A"}</p>
        </div>
    </div>
);

export default function ViewDoctorPage() {
    const params = useParams();
    const id = params.id as string;
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                const doctorId = Number(id);
                if (isNaN(doctorId)) {
                    notFound();
                    return;
                }
                const doctorData = await getDoctorById(doctorId);
                if (!doctorData) {
                    notFound();
                    return;
                }
                setDoctor(doctorData);
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

    if (!doctor) {
        return <div>Doctor not found.</div>;
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Stethoscope className="h-10 w-10 text-primary" />
                        <div>
                            <CardTitle className="text-3xl">{doctor.name}</CardTitle>
                            <CardDescription>Professional and contact details for {doctor.name}.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t">
                    <DetailItem label="Qualification" value={doctor.qualification} icon={Award} />
                    <DetailItem label="Registration Number" value={doctor.reg_no} icon={Fingerprint} />
                    <DetailItem label="Email Address" value={doctor.email} icon={Mail} />
                    <DetailItem label="Phone Number" value={doctor.phone} icon={Phone} />
                </CardContent>
            </Card>
        </div>
    );
}
