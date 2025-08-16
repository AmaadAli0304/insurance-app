
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormState, useFormStatus } from "react-dom";
import { handleAddTPA } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Adding..." : "Add TPA"}
        </Button>
    );
}

export default function NewTPAPage() {
    const [state, formAction] = useFormState(handleAddTPA, { message: "" });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/tpas">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Add New TPA</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>TPA Details</CardTitle>
                    <CardDescription>Fill in the form to add a new Third-Party Administrator.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">TPA Name</Label>
                                <Input id="name" name="name" placeholder="e.g. HealthServe TPA" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactPerson">Contact Person</Label>
                                <Input id="contactPerson" name="contactPerson" placeholder="e.g. John Doe" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" placeholder="e.g. contact@tpa.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" placeholder="e.g. 888-123-4567" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" name="address" placeholder="e.g. 123 Health Way, Anytown, USA" required />
                        </div>

                         <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="servicesOffered">Services Offered (comma-separated)</Label>
                                <Input id="servicesOffered" name="servicesOffered" placeholder="e.g. Cashless claims, Reimbursement" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slaDays">SLA (in days)</Label>
                                <Input id="slaDays" name="slaDays" type="number" placeholder="e.g. 2" required />
                            </div>
                        </div>
                        
                         <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="associatedInsuranceCompanies">Associated Company IDs (comma-separated)</Label>
                                <Input id="associatedInsuranceCompanies" name="associatedInsuranceCompanies" placeholder="e.g. comp-01, comp-02" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="associatedHospitals">Associated Hospital IDs (comma-separated)</Label>
                                <Input id="associatedHospitals" name="associatedHospitals" placeholder="e.g. hosp-01, hosp-02" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="remarks">Remarks</Label>
                            <Textarea id="remarks" name="remarks" placeholder="Any additional notes or comments." />
                        </div>
                        
                        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
