
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleAddHospital } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Adding..." : "Add Hospital"}
        </Button>
    );
}

export default function NewHospitalPage() {
    const [state, formAction] = useActionState(handleAddHospital, { message: "" });

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/hospitals">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">New Hospital</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Hospital Details</CardTitle>
                    <CardDescription>Fill in the form to add a new hospital to the system.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Hospital Name</Label>
                            <Input id="name" name="name" placeholder="e.g. Mercy General Hospital" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" name="address" placeholder="e.g. 4001 J St, Sacramento, CA" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact">Contact</Label>
                            <Input id="contact" name="contact" placeholder="e.g. 916-453-4444" required />
                        </div>
                        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
