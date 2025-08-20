
"use client";

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormStatus } from "react-dom";
import { handleUpdateHospital } from "../../actions";
import Link from "next/link";
import { ArrowLeft, ChevronsUpDown } from "lucide-react";
import { mockHospitals, mockTPAs, mockCompanies } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

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
    const [state, formAction] = useActionState(handleUpdateHospital, { message: "" });

    const [selectedCompanies, setSelectedCompanies] = useState<string[]>(hospital?.assignedCompanies || []);
    const [selectedTPAs, setSelectedTPAs] = useState<string[]>(hospital?.assignedTPAs || []);


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
                                <Label htmlFor="name">Hospital Name <span className="text-destructive">*</span></Label>
                                <Input id="name" name="name" defaultValue={hospital.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
                                <Input id="location" name="location" defaultValue={hospital.location} required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Full Postal Address <span className="text-destructive">*</span></Label>
                            <Textarea id="address" name="address" defaultValue={hospital.address} required />
                        </div>

                         <div className="grid md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="contactPerson">Contact Person</Label>
                                <Input id="contactPerson" name="contactPerson" defaultValue={hospital.contactPerson} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Official Email <span className="text-destructive">*</span></Label>
                                <Input id="email" name="email" type="email" defaultValue={hospital.email} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" defaultValue={hospital.phone} />
                            </div>
                        </div>

                         <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Assigned Insurance Companies</Label>
                                <input type="hidden" name="assignedInsuranceCompanies" value={selectedCompanies.join(',')} />
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
                                <Label>Assigned TPAs</Label>
                                <input type="hidden" name="assignedTPAs" value={selectedTPAs.join(',')} />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between">
                                             <div className="flex-1 text-left font-normal">
                                                {selectedTPAs.length > 0
                                                    ? `${selectedTPAs.length} selected`
                                                    : "Select TPAs"}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-full">
                                        {mockTPAs.map(tpa => (
                                            <DropdownMenuCheckboxItem
                                                key={tpa.tpaId}
                                                checked={selectedTPAs.includes(tpa.tpaId)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedTPAs(prev =>
                                                        checked ? [...prev, tpa.tpaId] : prev.filter(id => id !== tpa.tpaId)
                                                    );
                                                }}
                                            >
                                                {tpa.name}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedTPAs.map(id => (
                                        <Badge key={id} variant="secondary">{mockTPAs.find(t=>t.tpaId === id)?.name}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {state.message && <p className="text-sm text-destructive">{state.message}</p>}
                         <SubmitButton />
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
