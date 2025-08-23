
"use client";

import { useState, useMemo, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormStatus } from "react-dom";
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
    const [state, formAction] = useActionState(handleAddRequest, { message: "" });
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

    const hospitalPatients = useMemo(() => {
        return mockPatients.filter(p => p.hospitalId === user?.hospitalId);
    }, [user?.hospitalId]);
    
    const hospitalCompanies = useMemo(() => {
        const companyIds = new Set(hospitalPatients.map(p => p.companyId));
        return mockCompanies.filter(c => companyIds.has(c.id));
    }, [hospitalPatients]);

    const filteredPatients = useMemo(() => {
        if (!selectedCompany) return [];
        return hospitalPatients.filter(p => p.companyId === selectedCompany);
    }, [selectedCompany, hospitalPatients]);


    return (
        <div className="space-y-6">
            <form action={formAction}>
                 <input type="hidden" name="hospitalId" value={user?.hospitalId || ''} />
                 <input type="hidden" name="from" value={user?.email || ''} />
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Compose Pre-Authorization</CardTitle>
                             <CardDescription>Select an insurance company and patient to compose the request.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="insuranceCompany">Select Insurance Company</Label>
                                <Select onValueChange={setSelectedCompany}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a company" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {hospitalCompanies.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="patientId">Select Patient</Label>
                                <Select name="patientId" required disabled={!selectedCompany}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a patient" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredPatients.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.fullName} (ID: {p.id})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="to">To</Label>
                                    <Input id="to" name="to" placeholder="e.g. claims@company.com" required />
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
