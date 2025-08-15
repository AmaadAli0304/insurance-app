
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormState, useFormStatus } from "react-dom";
import { handleAddRequest } from "../actions";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockPatients, mockCompanies } from "@/lib/mock-data";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} size="lg">
            {pending ? "Submitting..." : "Send Pre-Authorization Request"}
        </Button>
    );
}

export default function NewRequestPage() {
    const { user } = useAuth();
    const [state, formAction] = useFormState(handleAddRequest, { message: "" });
    const patients = mockPatients.filter(p => p.hospitalId === user?.hospitalId);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/pre-auths">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">New Pre-Authorization Request</h1>
            </div>
            <form action={formAction}>
                 <input type="hidden" name="hospitalId" value={user?.hospitalId || ''} />
                 <input type="hidden" name="from" value={user?.email || ''} />
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Compose Pre-Authorization</CardTitle>
                             <CardDescription>Select a patient and compose the request.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="patientId">Select Patient</Label>
                                <Select name="patientId" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a patient" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {patients.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.fullName} (ID: {p.id})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="to">To</Label>
                                    <Input id="to" name="to" placeholder="e.g. claims@statamine.com" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="from">From</Label>
                                    <Input id="from" name="from" defaultValue={user?.email} readOnly />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input id="subject" name="subject" placeholder="Pre-Authorization Request for..." required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="details">Compose Email</Label>
                                <Textarea id="details" name="details" placeholder="Please approve treatment for..." required rows={10}/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="attachment">Attach File</Label>
                                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                                  <label htmlFor="file-upload" className="cursor-pointer">
                                      <Upload /> Upload File
                                  </label>
                                </Button>
                                <Input id="file-upload" name="attachment" type="file" className="hidden" />
                            </div>
                        </CardContent>
                    </Card>

                    {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                    <SubmitButton />
                </div>
            </form>
        </div>
    );
}
