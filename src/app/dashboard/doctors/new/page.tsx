
"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleAddDoctor } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { PhoneInput } from "@/components/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getHospitalsForForm } from "@/app/dashboard/staff/actions";
import { Hospital } from "@/lib/types";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Adding..." : "Add Doctor"}
        </Button>
    );
}

export default function NewDoctorPage() {
    const [state, formAction] = useActionState(handleAddDoctor, { message: "", type: undefined });
    const { toast } = useToast();
    const router = useRouter();
    const [hospitals, setHospitals] = useState<Pick<Hospital, "id" | "name">[]>([]);
    const [isLoadingHospitals, setIsLoadingHospitals] = useState(true);

    useEffect(() => {
        getHospitalsForForm()
            .then(setHospitals)
            .catch(() => toast({ title: "Error", description: "Could not load hospitals.", variant: "destructive" }))
            .finally(() => setIsLoadingHospitals(false));
    }, [toast]);

    useEffect(() => {
        if (state.type === 'success') {
            toast({
                title: "Doctor",
                description: "Doctor added successfully",
                variant: "success",
            });
            router.push('/dashboard/doctors');
        } else if (state.type === 'error') {
            toast({
                title: "Error",
                description: state.message,
                variant: "destructive"
            });
        }
    }, [state, toast, router]);

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/doctors">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">New Doctor</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Doctor Details</CardTitle>
                    <CardDescription>Fill in the form to add a new doctor.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                                <Input id="name" name="name" placeholder="e.g. Dr. John Smith" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="qualification">Qualification</Label>
                                <Input id="qualification" name="qualification" placeholder="e.g. MBBS, MD" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" placeholder="e.g. dr.smith@hospital.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <PhoneInput name="phone" placeholder="e.g. 9876543210" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reg_no">Registration Number</Label>
                                <Input id="reg_no" name="reg_no" placeholder="e.g. 12345-ABC" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hospitalId">Assign Hospital</Label>
                                <Select name="hospitalId" disabled={isLoadingHospitals}>
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
