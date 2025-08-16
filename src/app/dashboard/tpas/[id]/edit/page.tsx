
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormState, useFormStatus } from "react-dom";
import { handleUpdateTPA } from "../../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { mockTPAs } from "@/lib/mock-data";
import { notFound } from "next/navigation";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
        </Button>
    );
}

export default function EditTPAPage({ params }: { params: { id: string } }) {
    const tpa = mockTPAs.find(t => t.tpaId === params.id);
    const [state, formAction] = useFormState(handleUpdateTPA, { message: "" });

    if (!tpa) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/tpas">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Edit TPA: {tpa.name}</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Update TPA Details</CardTitle>
                    <CardDescription>Modify the form to update the TPA's information.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="tpaId" value={tpa.tpaId} />
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">TPA Name</Label>
                                <Input id="name" name="name" defaultValue={tpa.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactPerson">Contact Person</Label>
                                <Input id="contactPerson" name="contactPerson" defaultValue={tpa.contactPerson} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={tpa.email} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" defaultValue={tpa.phone} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" name="address" defaultValue={tpa.address} required />
                        </div>

                         <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="servicesOffered">Services Offered (comma-separated)</Label>
                                <Input id="servicesOffered" name="servicesOffered" defaultValue={tpa.servicesOffered.join(', ')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slaDays">SLA (in days)</Label>
                                <Input id="slaDays" name="slaDays" type="number" defaultValue={tpa.slaDays} required />
                            </div>
                        </div>
                        
                         <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="associatedInsuranceCompanies">Associated Company IDs (comma-separated)</Label>
                                <Input id="associatedInsuranceCompanies" name="associatedInsuranceCompanies" defaultValue={tpa.associatedInsuranceCompanies.join(', ')} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="associatedHospitals">Associated Hospital IDs (comma-separated)</Label>
                                <Input id="associatedHospitals" name="associatedHospitals" defaultValue={tpa.associatedHospitals.join(', ')} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="remarks">Remarks</Label>
                            <Textarea id="remarks" name="remarks" defaultValue={tpa.remarks} />
                        </div>
                        
                        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
