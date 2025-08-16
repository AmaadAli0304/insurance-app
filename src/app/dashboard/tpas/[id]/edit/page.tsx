
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormState, useFormStatus } from "react-dom";
import { handleUpdateTPA } from "../../actions";
import Link from "next/link";
import { ArrowLeft, Check, ChevronsUpDown } from "lucide-react";
import { mockTPAs, mockCompanies, mockHospitals } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge";

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
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>(tpa?.associatedInsuranceCompanies || []);
    const [selectedHospitals, setSelectedHospitals] = useState<string[]>(tpa?.associatedHospitals || []);

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
                                <Label>Associated Insurance Companies</Label>
                                <input type="hidden" name="associatedInsuranceCompanies" value={selectedCompanies.join(',')} />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between">
                                            <div className="flex-1 text-left font-normal">
                                                {selectedCompanies.length > 0
                                                    ? `${selectedCompanies.length} selected`
                                                    : "Select companies"}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-full">
                                        {mockCompanies.map(company => (
                                            <DropdownMenuCheckboxItem
                                                key={company.id}
                                                checked={selectedCompanies.includes(company.id)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedCompanies(prev =>
                                                        checked ? [...prev, company.id] : prev.filter(id => id !== company.id)
                                                    );
                                                }}
                                            >
                                                {company.name}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedCompanies.map(id => (
                                        <Badge key={id} variant="secondary">{mockCompanies.find(c=>c.id === id)?.name}</Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Associated Hospitals</Label>
                                 <input type="hidden" name="associatedHospitals" value={selectedHospitals.join(',')} />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between">
                                            <div className="flex-1 text-left font-normal">
                                                {selectedHospitals.length > 0
                                                    ? `${selectedHospitals.length} selected`
                                                    : "Select hospitals"}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-full">
                                        {mockHospitals.map(hospital => (
                                            <DropdownMenuCheckboxItem
                                                key={hospital.id}
                                                checked={selectedHospitals.includes(hospital.id)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedHospitals(prev =>
                                                        checked ? [...prev, hospital.id] : prev.filter(id => id !== hospital.id)
                                                    );
                                                }}
                                            >
                                                {hospital.name}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                 <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedHospitals.map(id => (
                                        <Badge key={id} variant="secondary">{mockHospitals.find(h=>h.id === id)?.name}</Badge>
                                    ))}
                                </div>
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
