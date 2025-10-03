
"use client";

import * as React from "react";
import { useEffect, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdateDoctor, getDoctorById, Doctor } from "../../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { PhoneInput } from "@/components/phone-input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { getHospitalsForForm } from "@/app/dashboard/staff/actions";
import { Hospital } from "@/lib/types";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

export default function EditDoctorPage() {
    const params = useParams();
    const id = params.id as string;
    const [doctor, setDoctor] = React.useState<Doctor | null>(null);
    const [hospitals, setHospitals] = useState<Pick<Hospital, 'id' | 'name'>[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [state, formAction] = useActionState(handleUpdateDoctor, { message: "", type: "initial" });
    const { toast } = useToast();
    const router = useRouter();
    const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDoctorAndHospitals() {
            try {
                const doctorId = Number(id);
                if (isNaN(doctorId)) {
                    notFound();
                    return;
                }
                const [fetchedDoctor, hospitalList] = await Promise.all([
                    getDoctorById(doctorId),
                    getHospitalsForForm()
                ]);
                
                if (!fetchedDoctor) {
                    notFound();
                    return;
                }
                setDoctor(fetchedDoctor);
                setHospitals(hospitalList);
                setSelectedHospitalId(fetchedDoctor.hospital_id || null);
            } catch (err) {
                const dbError = err as Error;
                setError(dbError.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDoctorAndHospitals();
    }, [id]);

    useEffect(() => {
        if (state.type === 'success') {
           toast({
             title: "Doctor",
             description: "Doctor updated successfully",
             variant: "success",
           });
           router.push('/dashboard/doctors');
        } else if (state.type === 'error') {
           toast({
             title: "Error",
             description: state.message,
             variant: "destructive",
           });
        }
    }, [state, router, toast]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!doctor) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/doctors">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">Edit Doctor</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Update Doctor Details</CardTitle>
                    <CardDescription>Modify the form to update the doctor's information.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="id" value={doctor.id} />
                        <div className="grid md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                                <Input id="name" name="name" defaultValue={doctor.name} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="qualification">Qualification</Label>
                                <Input id="qualification" name="qualification" defaultValue={doctor.qualification ?? ""} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={doctor.email ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <PhoneInput name="phone" defaultValue={doctor.phone ?? ""} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="reg_no">Registration Number</Label>
                                <Input id="reg_no" name="reg_no" defaultValue={doctor.reg_no ?? ""} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="hospitalId">Assign Hospital</Label>
                                <Select name="hospitalId" value={selectedHospitalId ?? "none"} onValueChange={setSelectedHospitalId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a hospital" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {hospitals.map(hospital => (
                                            <SelectItem key={hospital.id} value={hospital.id}>
                                                {hospital.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        {state.type === 'error' && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
