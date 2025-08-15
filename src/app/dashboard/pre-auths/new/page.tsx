
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormState, useFormStatus } from "react-dom";
import { handleAddRequest } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockPatients, mockCompanies } from "@/lib/mock-data";
import { useMemo } from "react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Submitting..." : "Submit Pre-Auth"}
        </Button>
    );
}

export default function NewRequestPage() {
    const { user } = useAuth();
    const [state, formAction] = useFormState(handleAddRequest, { message: "" });

    const hospitalPatients = useMemo(() => {
        return mockPatients.filter(p => p.hospitalId === user?.hospitalId);
    }, [user?.hospitalId]);

    const assignedCompanies = useMemo(() => {
        const patientCompanies = hospitalPatients.map(p => p.companyId);
        return mockCompanies.filter(c => patientCompanies.includes(c.id));
    }, [hospitalPatients]);

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
            <Card>
                <CardHeader>
                    <CardTitle>Pre-Auth Details</CardTitle>
                    <CardDescription>Fill in the form to create a new pre-auth request.</CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <input type="hidden" name="hospitalId" value={user?.hospitalId || ''} />
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="patientId">Patient</Label>
                            <Select name="patientId" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a patient" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hospitalPatients.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="companyId">Staffing Company</Label>
                            <Select name="companyId" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a company" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assignedCompanies.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="packageId">Staffing Package ID</Label>
                            <Input id="packageId" name="packageId" placeholder="e.g. stat-gold" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="requestAmount">Request Amount ($)</Label>
                            <Input id="requestAmount" name="requestAmount" type="number" placeholder="e.g. 5200" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="details">Request Details</Label>
                            <Textarea id="details" name="details" placeholder="Provide a detailed description of the staffing request..." required />
                        </div>

                        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                        <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
