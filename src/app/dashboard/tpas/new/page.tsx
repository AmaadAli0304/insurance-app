
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormState, useFormStatus } from "react-dom";
import { handleAddTPA } from "../actions";
import Link from "next/link";
import { ArrowLeft, ChevronsUpDown } from "lucide-react";
import { mockCompanies, mockHospitals } from "@/lib/mock-data";
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
            {pending ? "Adding..." : "Add TPA"}
        </Button>
    );
}

export default function NewTPAPage() {
    const [state, formAction] = useFormState(handleAddTPA, { message: "" });
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
    const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);

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
