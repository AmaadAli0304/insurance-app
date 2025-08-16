
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormState, useFormStatus } from "react-dom";
import { handleUpdateHospital } from "../../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { mockHospitals } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

export default function EditCompanyHospitalPage({ params }: { params: { id: string } }) {
    const hospital = mockHospitals.find(h => h.id === params.id);
    const [state, formAction] = useFormState(handleUpdateHospital, { message: "" });

    if (!hospital) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/company-hospitals">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Edit Hospital: {hospital.name}</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Update Hospital Details</CardTitle>
                    <CardDescription>Modify the form to update the hospital's information.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="id" value={hospital.id} />
                         <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Hospital Name</Label>
                                <Input id="name" name="name" defaultValue={hospital.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="registrationNumber">Registration Number</Label>
                                <Input id="registrationNumber" name="registrationNumber" defaultValue={hospital.registrationNumber} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Full Postal Address</Label>
                            <Textarea id="address" name="address" defaultValue={hospital.address} required />
                        </div>

                         <div className="grid md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="contactPerson">Contact Person</Label>
                                <Input id="contactPerson" name="contactPerson" defaultValue={hospital.contactPerson} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Official Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={hospital.email} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" defaultValue={hospital.phone} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="servicesOffered">Services Offered (comma-separated)</Label>
                            <Input id="servicesOffered" name="servicesOffered" defaultValue={hospital.servicesOffered?.join(', ')} />
                        </div>

                        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
