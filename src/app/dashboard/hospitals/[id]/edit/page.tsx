
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdateHospital } from "../../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { mockHospitals } from "@/lib/mock-data";
import { notFound } from "next/navigation";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

export default function EditHospitalPage({ params }: { params: { id: string } }) {
    const hospital = mockHospitals.find(h => h.id === params.id);
    const [state, formAction] = useActionState(handleUpdateHospital, { message: "" });

    if (!hospital) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Update Hospital Details</CardTitle>
                    <CardDescription>Modify the form to update the hospital's information.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="id" value={hospital.id} />
                        <div className="space-y-2">
                            <Label htmlFor="name">Hospital Name</Label>
                            <Input id="name" name="name" defaultValue={hospital.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" name="address" defaultValue={hospital.address} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact">Contact</Label>
                            <Input id="contact" name="contact" defaultValue={hospital.contact} required />
                        </div>
                        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
